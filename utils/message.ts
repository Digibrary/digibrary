import { Request } from "express";
import { NotificationType } from "../typing/notification-type";
export function addMessage(req: Request, message: {
    type: NotificationType,
    title: string,
    value: string
}) {
    if (req.session.notifications == undefined) {
        req.session.notifications = []
    }
    req.session.notifications?.push(message)
}

export function getMessages(req: Request) {
    var notifications = req.session.notifications;
    req.session.notifications = []
    return notifications
}