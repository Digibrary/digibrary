import "express-session"; // don't forget to import the original module
import { Notification } from "../notification-type";

declare module "express-session" {
    interface SessionData {
        isAuthenticated: boolean,
        userId: number,
        user_login: string 
        notifications:Notification[]
    }
}