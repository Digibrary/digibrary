import * as fs from 'fs'
import User from '../models/User';
import settings from "./settings";
import * as bcrypt from 'bcryptjs'
import db from '../models/db';

const forbidden_passwords = fs.readFileSync(__dirname + "/.." + settings.common_password_file, 'utf8').split('\n');
const forbidden_usernames = fs.readFileSync(__dirname + "/.." + settings.reserved_usernames_file, 'utf8').split('\n');

export function check_common_passwords(password: string): boolean {
    return !forbidden_passwords.includes(password);
}

export function check_username(user_login: string): boolean {
    return !forbidden_usernames.includes(user_login);
}

export function check_password_history(user_login: string, newPassword: string): boolean {
    var user: User = User.getByUsername(user_login)!;
    var hashList: string[] = user.password_history?.split(",") || [];
    for (const hash of hashList) {
        if (bcrypt.compareSync(newPassword, hash)) {
            return false;
        }
    }
    return true;
}

export function update_password_history(user_login: string, newHash: string): boolean {
    var user: User = User.getByUsername(user_login)!;
    if (!user.password_history) {
        user.password_history = '';
    }
    var hashList: string[] = user.password_history.split(',');
    if (hashList.length == settings.remember_last_passwords) {
        hashList = hashList.slice(1)
    }
    hashList.push(newHash)
    var new_password_history = hashList.join(',');
    update_last_change_password_timestamp(user_login)
    var info = db.prepare("UPDATE users SET password_history=? WHERE user_login=?").run(new_password_history, user_login);
    if (info.changes == 1) {
        return true; //success
    }
    return false; //failed to update
}

export function check_password_age(user_login: string): boolean {
    var last_change_password_timestamp: number = User.getByUsername(user_login)?.last_change_password_timestamp || 0;
    var current_timestamp = new Date().getTime();
    var max_age = settings.password_max_age * 60 * 60 * 24 * 1000; //unix time milisec
    if (current_timestamp - last_change_password_timestamp > max_age) {
        return false; //have to change password
    }
    return true; //don't have to change password
}

export function get_retry_left(user_login: string): number {//return numbers of retries left
    var user: User = User.getByUsername(user_login)!;
    if (user.password_retries >= settings.number_of_retries) {
        return 0;
    }
    return settings.number_of_retries - user.password_retries;
}

export function add_retry(user_login: string): boolean {
    var info = db.prepare("UPDATE users SET password_retries = password_retries + 1 WHERE user_login=?").run(user_login);
    if (info.changes == 1) {
        return true;
    }
    return false;
}

export function reset_retry(user_login: string): boolean {
    var info = db.prepare("UPDATE users SET password_retries = 0 WHERE user_login=?").run(user_login);
    if (info.changes == 1) {
        return true;
    }
    return false;
}

function update_last_change_password_timestamp(user_login: string) {
    var current_timestamp = new Date().getTime();
    var info = db.prepare("UPDATE users SET last_change_password_timestamp=? WHERE user_login=?").run(current_timestamp, user_login);
    return;
}