import * as express from "express";
import db from "../models/db";
import User from "../models/User";
import * as bcrypt from 'bcryptjs'
import { NotificationType } from "../typing/notification-type";
import { addMessage } from "./message";
import { add_retry, check_password_history, get_retry_left, reset_retry, update_password_history } from "./security";
import settings from "./settings";
import crypto from 'crypto'

export function authenticate(req: express.Request, res: express.Response): boolean {
    var { user_login, password }: { user_login: string, password: string } = req.body;
    user_login = user_login.toLowerCase().trim();
    var result: User;
    try {
        result = db.prepare("SELECT id, user_login, password_or_hash FROM users WHERE user_login=?").get(user_login);
    } catch (e: any) {
        throw new Error("Server Error");
    }
    if (result == undefined) { //no user
        addMessage(req, {
            type: NotificationType.ERROR,
            title: "Login failed!",
            value: ""
        })
        return false;
    } else if (get_retry_left(user_login) == 0) { //user exists but have no retry left
        addMessage(req, {
            type: NotificationType.ERROR,
            title: "Max password retries reached!",
            value: "Please contact an administrator to unlock your account!"
        })
        return false;
    } else if (bcrypt.compareSync(password, result.password_or_hash)) {
        req.session.isAuthenticated = true;
        req.session.userId = result.id;
        req.session.user_login = result.user_login;
        console.log(`[*] User ${user_login} login`)
        addMessage(req, {
            type: NotificationType.SUCCESS,
            title: "Welcome, " + result.user_login,
            value: ""
        })
        reset_retry(user_login)
        return true;
    } else { //wrong password
        add_retry(user_login)
        addMessage(req, {
            type: NotificationType.ERROR,
            title: "Login failed!",
            value: `You have ${get_retry_left(user_login)} retries left!`
        })
        return false
        //TODO track failed attempts
    }
}

/**
 * Authenticate using plain password
 * DEPRECATED!!! Keeping to support old users until they can change their password!
 */
export function authenticate_plain(req: express.Request, res: express.Response): boolean {
    var { user_login, password }: { user_login: string, password: string } = req.body;
    user_login = user_login.toLowerCase().trim();
    password = password.trim();
    
    var isValid = /^[a-z0-9_!@#$%^&*()=+;:\\|<>,.?/`~{}[\]-\s]*$/i.test(user_login) && /^[a-z0-9_!@#$%^&*()=+;:\\|<>,.?/`~{}[\]-]*$/i.test(password)
    if (!isValid){
        addMessage(req, {
            type: NotificationType.ERROR,
            title: "Login failed!",
            value: ""
        })
        return false;
    }
    
    var result: User|undefined;
    try {
        result = db.prepare(`SELECT id, user_login, password_or_hash FROM users WHERE user_login="${user_login}" AND password_or_hash="${password}"`).get();
    } catch (e: any) {
        console.log(e)
    }
    if (result == undefined) { //no user
        return false;
    }
    req.session.isAuthenticated = true;
    req.session.userId = result.id;
    req.session.user_login = result.user_login;
    console.log(`[*] User ${user_login} login`)
    addMessage(req, {
        type: NotificationType.SUCCESS,
        title: "Welcome, " + result.user_login,
        value: ""
    })
    reset_retry(user_login)
    return true;
}

export function register(user: User) {
    //user_login, password, email mandatory
    //phone, address 
    user.user_login = user.user_login.toLowerCase().trim();
    user.password_or_hash = bcrypt.hashSync(user.password_or_hash);
    var info = db.prepare("INSERT INTO users(user_login, password_or_hash, email) VALUES (:user_login, :password_or_hash, :email)").run(user);
    if (info.changes != 1) {
        console.log("[*] Database error inserting new user!");
        throw new Error("Database error!");
    }
    if (user.phone) {
        info = db.prepare("UPDATE users SET phone=:phone WHERE user_login=:user_login").run(user);
        if (info.changes != 1) {
            console.log("[*] Database error inserting new user's phone!");
            throw new Error("Database error!");
        }
    }
    if (user.address) {
        info = db.prepare("UPDATE users SET address=:address WHERE user_login=:user_login").run(user);
        if (info.changes != 1) {
            console.log("[*] Database error inserting new user's address!");
            throw new Error("Database error!");
        }
    }
    return;
}

export function verifyPassword(user_login: string, password: string): boolean {
    user_login = user_login.toLowerCase().trim();
    var result: User;
    try {
        result = db.prepare("SELECT password_or_hash FROM users WHERE user_login=?").get(user_login);
    } catch (e: any) {
        throw new Error("Server Error");
    }
    return bcrypt.compareSync(password, result.password_or_hash);
}

export function changePassword(user_login: string, newPassword: string): boolean {
    user_login = user_login.toLowerCase().trim();
    var user: User = User.getByUsername(user_login)!;
    var hashList: string[] = user.password_history?.split(",") || []; //list of old password
    hashList.push(user.password_or_hash);
    if(hashList.length > settings.remember_last_passwords){
        hashList = hashList.slice( - settings.remember_last_passwords)
    }
    var new_password_history = hashList.join(',')
    var result;
    try {
        result = db.prepare("UPDATE users SET password_history=? WHERE user_login=?").run(new_password_history, user_login);
    } catch (e: any) {
        throw new Error("Server Error");
    }

    var newHash = bcrypt.hashSync(newPassword);
    var result;
    try {
        result = db.prepare("UPDATE users SET password_or_hash=? WHERE user_login=?").run(newHash, user_login);
    } catch (e: any) {
        throw new Error("Server Error");
    }
    update_password_history(user_login, newHash)
    return result.changes == 1;
}

export function issueResetToken(user_login:string){
    var user = User.getByUsername(user_login);
    if (user == undefined){
        return;
    }

    var token = randomValueHex(20);
    console.log(`[*] User ${user_login} just requested to reset password. Token: ${token}`);
    var valid_until = new Date().getTime() + 60 * 1000 * settings.token_lifespan //x minutes from now
    db.prepare('UPDATE users SET recover_token=?, recover_token_valid_timestamp=? WHERE user_login=?').run(token, valid_until, user_login)
}

export function resetPassword(req: express.Request, token:string, newPassword:string):boolean{
    var user:User|undefined = db.prepare("SELECT * FROM users WHERE recover_token=? AND recover_token_valid_timestamp > ?").get(token, new Date().getTime());
    if(user == undefined){
        addMessage(req, {
            type: NotificationType.ERROR,
            title: 'No such token!',
            value: ''
        })
        return false;
    }
    if(!check_password_history(user.user_login, newPassword)){
        addMessage(req, {
            type: NotificationType.ERROR,
            title: `Error`,
            value: `New password cannot be the same as the last ${settings.remember_last_passwords} passwords!`
        })
        return false;
    }
    db.prepare("UPDATE users SET recover_token='', recover_token_valid_timestamp=0").run();
    return changePassword(user.user_login, newPassword);
}

function randomValueHex (len:number):string{
    return crypto.randomBytes(Math.ceil(len/2))
        .toString('hex') // convert to hexadecimal format
        .slice(0,len).toUpperCase();   // return required number of characters
}