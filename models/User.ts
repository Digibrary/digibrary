/**
 * The User class / model. Has static methods to query user info from the database. 
 */

import db from "./db"

class User {
    id!: number
    user_login!: string
    password_or_hash!: string
    active!: boolean
    email!: string
    role!: number
    phone: string | undefined
    address: string | undefined
    recover_token: string | undefined
    recover_token_valid_timestamp: number | undefined
    consecutive_failure: number | undefined
    last_login_timestamp: number | undefined
    last_login_ip: string | undefined
    password_history: string | undefined
    last_change_password_timestamp: number | undefined
    password_retries: number

    constructor(user: any) {
        this.id = user.id;
        this.user_login = user.user_login
        this.password_or_hash = user.password_or_hash
        this.active = user.active
        this.email = user.email
        this.role = user.role
        this.phone = user.phone
        this.address = user.address
        this.recover_token = user.recover_token
        this.recover_token_valid_timestamp = user.recover_token_valid_timestamp
        this.consecutive_failure = user.consecutive_failure
        this.last_login_timestamp = user.last_login_timestamp
        this.last_login_ip = user.last_login_ip
        this.password_history = user.password_history
        this.last_change_password_timestamp = user.last_change_password_timestamp
        this.password_retries = user.password_retries
    }

    static getById(id: number): User | undefined { 
        var user = db.prepare("SELECT * FROM users WHERE id=?").get(id)
        return user
    }

    static getByUsername(user_login: string): User | undefined { 
        var user = db.prepare("SELECT * FROM users WHERE user_login=?").get(user_login);
        return user;
    }

    static getByEmail(email: string): User | undefined { 
        var user = db.prepare("SELECT * FROM users WHERE email=?").get(email);
        return user;
    }

    static getAll(): User[] {
        var users = db.prepare("SELECT * FROM users").all();
        return users;
    }
}

/**
 * Role ENUM for easy & quick checking, not have to rely on hardcoding
 */
export enum Role {
    ADMIN = 1,
    LIBRARIAN,
    USER,
    GUEST,
}

export default User