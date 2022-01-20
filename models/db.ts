/**
 * Create the 'db' object to be used in other files
 */

import type { Database } from 'better-sqlite3';
import * as BetterSqlite3 from 'better-sqlite3';
const DatabaseConstructor = BetterSqlite3.default;
const db: Database = new DatabaseConstructor('library.db', { verbose: console.log })
import { readFileSync } from 'fs';

//Checks if the database is initialized by checking if there's a table called 'users'
var isInitialized: boolean = false;
try {
    const row = db.prepare('SELECT name FROM sqlite_master WHERE type=\'table\' AND name=\'users\';').get();
    if (row) {
        isInitialized = true;
        console.log("[*] Database already initialized")
    }
} catch (e: any) {
    console.log(e.message)
}

//If the database doesn't exists, use the SQL file to prepare the database
if (!isInitialized) {
    const prepareDb = readFileSync(__dirname + '/../preparedb.sql', 'utf8');
    db.exec(prepareDb)
    console.log("[*] Initialized database with mock data!")
}

export default db