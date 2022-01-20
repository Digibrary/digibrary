import createError from 'http-errors';
import express, { json, urlencoded } from 'express';
import { Request, Response, NextFunction } from 'express';
import { engine } from 'express-handlebars';
import { join } from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import session from 'express-session';
var SQLiteStore = require('connect-sqlite3')(session);
import indexRouter from './routes/index';
import userRouter from './routes/user';
import libraryRouter from './routes/library';
import utilRoutes from './routes/utils';

const app = express();

// view engine setup
app.engine('handlebars', engine({
    layoutsDir: join(__dirname, 'views'),
    defaultLayout: 'layout',
    helpers: require('./utils/handlebars-helpers')
}));
app.set('view engine', 'handlebars');
app.set('views', join(__dirname, 'views'));

//session-express middleware setup
app.use(session({
    store: new SQLiteStore({
        table: 'sessions',
        db: 'library.db'
    }),
    secret: 'very_secret_string_probably_should_put_in_env'
}))

//other middlewares setup
app.use(logger('dev'));
app.use(json());
app.use(urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(join(__dirname, 'public')));

//Routings
app.all("*",utilRoutes.always_create_session);
app.use(utilRoutes.pass_handlebars_objects);
app.use(utilRoutes.force_change_password);
app.use('/', indexRouter);
app.use('/user', userRouter);
app.use('/library', libraryRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err: any, req: Request, res: Response, next: NextFunction) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

app.listen(3000, () => {
    console.log('[*] The application is listening on port 3000!');
})

export default app;
