/**
 * The library page, not much here yet
 */
import * as express from "express";
var router = express.Router();

/**
 * Get the home page
 */
router.get('/', function(req:express.Request, res: express.Response, next: express.NextFunction) {
  res.render('library/index', { title: 'Digibrary', session:req.session, notifications: req.session.notifications});
});

export default router;
