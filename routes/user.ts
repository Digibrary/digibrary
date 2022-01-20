/**
 * The /user page and every related functionalities. Currently the application is able to handle:
 * - Registrations
 * - Logins
 * - Changing user password
 * - Resetting user password 
 * - View list of users (only admin can)
 */

import * as express from "express";
import { authenticate, authenticate_plain, changePassword, issueResetToken, register, resetPassword, verifyPassword } from "../utils/auth";
import User, { Role } from "../models/User";
import { Notification, NotificationType } from "../typing/notification-type";
import { addMessage, getMessages } from "../utils/message";
import {check_password_history, check_username } from '../utils/security'
import csrf from 'csurf'
import settings from "../utils/settings";
import utilRoutes from "./utils";
var router = express.Router();
var csrfProtect = csrf()
//helper functions, verify user_login and password is up to standards
function verifyFields(obj: { user_login?: string, password?: string, email?: string }): boolean {
    var { user_login, password, email } = obj;
    if (user_login) {
        return /^[a-z0-9.-]{3,50}$/ig.test(user_login);
    }
    if (password) {
        return /^(?=.*[\d])(?=.*[!@#$%^&*])[\w!@#$%^&*]{8,}$/i.test(password);
    }
    if (email) {
        return /^.+@.+$/i.test(email);
    }
    return false;
}
/**
 * Public routes, does not require authentication to reach
 */
/**
 * Login page
 */
router.get('/login', function (req: express.Request, res: express.Response, next: express.NextFunction) {
    res.render('user/login', { title: 'Login'});
});

router.post('/login', function (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        if(authenticate_plain(req,res) || authenticate(req, res)){
            res.redirect("/user/")
            return;
        }
    } catch (e: any) {
        addMessage(req, {title: "Error", value: e.message, type:NotificationType.ERROR})
    }
    res.redirect("/user/login")
});

/**
 * Register page
 */
router.get('/register', function (req: express.Request, res: express.Response, next: express.NextFunction) {
    res.render('user/register', { title: 'Register'});
});

router.post('/register', function (req: express.Request, res: express.Response, next: express.NextFunction) {
    var { submit } = req.body;
    if (!submit) {
        res.redirect('/user/register');
        return;
    }

    var { user_login, password, retypePassword, email, phone, address }:
        { user_login: string, password: string, retypePassword: string, email: string, phone: string, address: string } = req.body;
    user_login = user_login.toLowerCase();
    email = email.toLowerCase()

    var hasError = false;
    //TODO change to toast and 1 render
    if (!verifyFields({ 'user_login': user_login }) || !verifyFields({ 'password': password })) {
        var error: string = "Username or password is in the wrong format";
        addMessage(req, {title: "Error", value: error, type:NotificationType.ERROR})
        hasError = true;
    }

    if (User.getByUsername(user_login.toLowerCase()) != undefined) {
        var error = "Username already taken!"
        addMessage(req, {title: "Error", value: error, type:NotificationType.ERROR})
        hasError = true;
    }

    if (User.getByEmail(email.toLowerCase()) != undefined) {
        var error = "Email is already in use by another account!"
        addMessage(req, {title: "Error", value: error, type:NotificationType.ERROR})
        hasError = true;
    }

    if (!user_login || !password || !retypePassword || !email) {
        var error = "Missing required information!"
        addMessage(req, {title: "Error", value: error, type:NotificationType.ERROR})
        hasError = true;
    }

    if (password !== retypePassword) {
        var error = "Passwords is not the same!"
        addMessage(req, {title: "Error", value: error, type:NotificationType.ERROR})
        hasError = true;
    }

    if(!check_username(user_login)){
        var error = "You cannot use that user_login!"
        addMessage(req, {title: "Error", value: error, type:NotificationType.ERROR})
        hasError = true;
    }

    if(hasError){
        res.redirect('/user/register')
        return;
    }
    try {
        delete req.body.retypePassword;
        delete req.body.submit;
        register(req.body);
        res.redirect('/user/login');
    } catch (e: any) {
        var error: string = e.message;
        res.render('user/register', { title: 'Register', message: error});
    }
});

/**
 * Password recovery
 */
router.get('/forgotpassword', csrfProtect, function (req: express.Request, res: express.Response, next: express.NextFunction) {
    res.render('user/forgotpassword', { title: 'Forgot password', csrfToken: req.csrfToken()});
});

router.post('/forgotpassword', csrfProtect, function (req: express.Request, res: express.Response, next: express.NextFunction) {
    var {user_login}:{user_login:string} = req.body;
    if(user_login.trim().length == 0){
        res.redirect('/user/forgotpassword');
        return
    }else{
        addMessage(req, {
            type: NotificationType.INFO,
            title: "Token sent to your email!",
            value: ''
        })
    }
    try {
        issueResetToken(user_login);
    } catch (error) {
        addMessage(req, {
            type: NotificationType.INFO,
            title: "Error!",
            value: 'Error issuing token'
        })
        console.log(error);
    }
    res.redirect('/user/resetpassword')
});

router.get('/resetpassword', csrfProtect, function (req: express.Request, res: express.Response, next: express.NextFunction) {
    res.render('user/resetpassword', { title: 'Reset password', csrfToken: req.csrfToken()});
});

router.post('/resetpassword', csrfProtect, function (req: express.Request, res: express.Response, next: express.NextFunction) {
    var {token, newPassword, retypeNewPassword}:{token:string, newPassword:string, retypeNewPassword:string} = req.body;
    var hasError = false;
    token = token.trim();
    if(newPassword != retypeNewPassword){
        addMessage(req, {
            type: NotificationType.ERROR,
            title: 'New password doesn\'t match!',
            value: ''
        })
        hasError = true;
    }
    if(!verifyFields({ 'password': newPassword }) || !verifyFields({ 'password': retypeNewPassword })){
        addMessage(req, {
            type: NotificationType.ERROR,
            title: 'New password doesn\'t meet security requirements!',
            value: ''
        })
        hasError = true;
    }
    if(hasError){
        res.redirect('/user/resetpassword')
        return;
    }
    try {
        if(resetPassword(req, token, newPassword)){
            addMessage(req, {
                type: NotificationType.SUCCESS,
                title: "Password reset!",
                value: ''
            })
        }else{
            addMessage(req, {
                type: NotificationType.ERROR,
                title: 'Error!',
                value: ''
            })
        }
        
    } catch (error:any) {
        addMessage(req, {
            type: NotificationType.ERROR,
            title: error.message,
            value: ''
        })
    }
    res.redirect('/user/login');
});

/**
 * Check if the session is an authenticated one before continuing
 */
router.all('*', utilRoutes.is_authenticated)

/**
 * Private pages
 */
router.get('/', function (req: express.Request, res: express.Response, next: express.NextFunction) {
    res.render('user/index', { title: 'User hub'});
});

router.get('/logout', function (req: express.Request, res: express.Response, next: express.NextFunction) {
    req.session.regenerate((err) => {
        addMessage(req, {
            type: NotificationType.INFO,
            title: "Goodbye!",
            value: ""
        })
        res.redirect('/');
    });
});

router.get('/changepassword', csrfProtect, function (req: express.Request, res: express.Response, next: express.NextFunction) {
    res.render('user/changepassword', { title: 'Change password', csrfToken: req.csrfToken()});
});

router.post('/changepassword', csrfProtect, function (req: express.Request, res: express.Response, next: express.NextFunction) {
    var { password, newPassword, retypeNewPassword } = req.body;
    var hasError = false;
    if(!verifyPassword(req.session.user_login!, password)){
        addMessage(req, {
            type: NotificationType.ERROR,
            title: 'Wrong password!',
            value: ''
        })
        hasError = true;
    }
    if(newPassword != retypeNewPassword){
        addMessage(req, {
            type: NotificationType.ERROR,
            title: 'New password doesn\'t match!',
            value: ''
        })
        hasError = true;
    }
    if(newPassword == password){
        addMessage(req, {
            type: NotificationType.ERROR,
            title: 'New password cannot be the same!',
            value: ''
        })
        hasError = true;
    }
    if(!verifyFields({ 'password': newPassword }) || !verifyFields({ 'password': retypeNewPassword })){
        addMessage(req, {
            type: NotificationType.ERROR,
            title: 'New password doesn\'t meet security requirements!',
            value: ''
        })
        hasError = true;
    }
    if(hasError){
        res.redirect('/user/changepassword')
        return;
    }
    if(!check_password_history(req.session.user_login!, newPassword)){
        addMessage(req, {
            type: NotificationType.ERROR,
            title: `Error`,
            value: `New password cannot be the same as the last ${settings.remember_last_passwords} passwords!`
        })
        res.redirect('/user/changepassword')
        return;
    }
    if(changePassword(req.session.user_login!, newPassword)){
        addMessage(req, {
            type: NotificationType.SUCCESS,
            title: 'Successfully changed password!'
        } as Notification)
        res.redirect('/')
    }else{
        addMessage(req, {
            type: NotificationType.ERROR,
            title: 'Something went wrong!'
        } as Notification)
        res.redirect('/user/changepassword')
    }
});

/**
 * Check if the session belongs to an admin
 */
router.all('*', utilRoutes.is_admin)

router.get('/manage', function (req: express.Request, res: express.Response, next: express.NextFunction) {
    var listUsers: User[] = User.getAll();
    res.render('user/manage', { title: 'Manage Users', users: listUsers });
});

export default router;
