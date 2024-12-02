var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');


var app = express();
require('dotenv').config(); // load the env variables

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Connect to database
const {connect} = require("./config/database");
connect();


// passport
const passport = require('./config/auth/passport');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const { sequelize } = require('./config/database'); // Adjust the path to your Sequelize instance
const Session = require('./modules/auth/models/session'); // Adjust the path to your Session model


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
    //     table: Session,
    //     // tableName: 'Session',
    //     checkExpirationInterval: parseInt(process.env.SESSION_EXPIRATION_INTERVAL, 10),
    //     expiration: parseInt(process.env.SESSION_EXPIRATION, 10)
    // }),
}));

app.use(passport.initialize());
app.use(passport.authenticate('session'));


// flash
const flash = require('connect-flash');
app.use(flash());


// view
const hbsHelpers = require('handlebars-helpers');
const { engine } = require('express-handlebars');
const exphbs = require('express-handlebars'); // Add this line

const hbs = engine({
    extname: '.hbs',
    helpers: hbsHelpers(),
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true,
    }
});
// Template engine
app.engine('.hbs', hbs);
app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, 'views'));

// Register Handlebars as the view engine
app.engine('hbs', exphbs.engine({
    extname: 'hbs',
    helpers: {
        includes: function(array, value) {
            return array && array.includes(value);
        }
    }
}));

// Static files
app.use(express.static(path.join(__dirname, 'public')));


// Global variables
app.use((req, res, next) => {
    res.locals.user = req.user || null;
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
});

// routes
const authRouter = require('./modules/auth/routes/auth.routes');
app.use('/auth', authRouter);

// error handler
app.use((err, req, res, next) =>  {
    console.log(err.stack)
    if (res.headersSent) {
        return next(err)
    }
    res.status(500)
    res.render('error', { error: err })
});

// Catch-all for 404 errors
app.use((req, res) => {
    res.status(404).render('404', { title: 'Page Not Found' });
});


// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   next(createError(404));
// });




// port
const port = 3001;
app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
});

module.exports = app;
