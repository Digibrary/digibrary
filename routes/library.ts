/**
* The library page, not much here yet
*/
import * as express from "express";
import { NotificationType } from "../typing/notification-type";
import { addMessage } from "../utils/message";
import utilRoutes from "./utils";
var router = express.Router();
import util from 'util';
const exec = util.promisify(require('child_process').exec);

/**
* Get the home page
*/
router.get('/', function(req:express.Request, res: express.Response, next: express.NextFunction) {
    res.render('library/index', { title: 'Digibrary' });
});

/**
 * Check if the session belongs to an admin, running commands on a server is dangerous after all.
 */
router.all('*', utilRoutes.is_admin)

router.get('/search', async function(req:express.Request, res: express.Response, next: express.NextFunction) {
    var { title,ﾠ} = req.query;
    if(!title){
        res.render('library/search', { title: 'Search for books' });
        return;
    }
    
    title = title.toString(); //explicitly convert title to string type
    const isValidTitle = /^[A-Za-z0-9\s\-_,\.;:()]+$/.test(title);
    if(!isValidTitle){
        addMessage(req, {title: "Error", value: "Book title is not valid!", type:NotificationType.ERROR})
        res.redirect('/library/search')
        return;
    }
    
    const cmds = [
        'bookcut details -b "'+title+'"',
        '/usr/utils/google-books-cli/bin/books-cli search --keyword "'+title+'"',ﾠ
    ];
    
    var result = ""
    for (const cmd of cmds) {
        try{
            var {stdout, stderr} = await exec(cmd, {timeout: 15000 })
            result += stdout+stderr
        }catch(e){
            
        }
    }
    res.render('library/search', { title: 'Search for books', result: result});
});

router.post('/search')

export default router;
