export enum NotificationType{
    WARNING = 'warning',
    SUCCESS = 'success',
    INFO = 'info',
    ERROR = 'error'
}

export class Notification{
    constructor(
        public type:NotificationType = NotificationType.INFO,
        public title:string = '',
        public value:string = '') {

    }
}