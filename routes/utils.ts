import express from 'express';
import User, { Role } from '../models/User';
import { NotificationType } from '../typing/notification-type';
import { addMessage, getMessages } from '../utils/message';
import { check_password_age } from '../utils/security';
import settings from '../utils/settings';
export default {
    always_create_session: function(req: express.Request, res: express.Response, next: express.NextFunction){
        if (req.session.isAuthenticated == undefined) { //doesn't have session
            req.session.isAuthenticated = false
        }
        next();
    },
    is_authenticated: function (req: express.Request, res: express.Response, next: express.NextFunction) {
        if (req.session.isAuthenticated == false) { //access control
            res.redirect('/')
            res.end()
        } else {
            next()
        }
    },
    is_admin: function (req: express.Request, res: express.Response, next: express.NextFunction) {
        var user_login: string = req.session.user_login || '';
        if (User.getByUsername(user_login)?.role != Role.ADMIN) { //access control
            res.redirect('/')
            res.end()
        } else {
            next()
        }
    },
    is_librarian: function (req: express.Request, res: express.Response, next: express.NextFunction) {
        var user_login: string = req.session.user_login || '';
        if (User.getByUsername(user_login)?.role != Role.LIBRARIAN) { //access control
            res.redirect('/')
            res.end()
        } else {
            next()
        }
    },
    pass_handlebars_objects: function(req: express.Request, res: express.Response, next: express.NextFunction){
        var path = req.path;
        var functionalities = ['/','/user', '/admin', '/library']
        functionalities.forEach(str => {
            if (path.startsWith(str)){
                res.locals.current_functionality = str
            }
        })
        res.locals.notifications = getMessages(req);
        res.locals.session = req.session;
        next()
    },
    force_change_password: function(req: express.Request, res: express.Response, next: express.NextFunction){
        if(!req.session.isAuthenticated){
            next()
            return;
        }
        if(!check_password_age(req.session.user_login!) && req.path != '/user/changepassword' && req.path != '/user/logout'){
            addMessage(req,{
                type: NotificationType.ERROR,
                title: "Password age reached!",
                value: `You have to change your password every ${settings.password_max_age} days!`
            })
            res.redirect('/user/changepassword')
            return;
        }
        next()
    }
}