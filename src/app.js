var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes');
var usersRouter = require('./routes/users');


var app = express();
require('dotenv').config(); // load the env variables

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// passport
const passport = require('./config/auth/passport');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const { sequelize } = require('./config/database'); // Adjust the path to your Sequelize instance
//const Session = require('./modules/auth/models/session'); // Adjust the path to your Session model


app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        //secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
    // store: new SequelizeStore({
    //     db: sequelize,
    //     tableName: 'sessions',
    //     checkExpirationInterval: parseInt(process.env.SESSION_EXPIRATION_INTERVAL, 10),
    //     expiration: parseInt(process.env.SESSION_EXPIRATION, 10)
    // }),
}));

app.use(passport.initialize());
app.use(passport.authenticate('session'));



// Connect to database
const {connect} = require("./config/database");
connect();
module.exports = app;
