// place it add the top to ensure that all env is loaded before any code that needs .env executed
require('dotenv').config(); // load the env variables
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const AuthController = require('./modules/auth/controllers/auth.controllers');
const {connect} = require("./config/database");
const passport = require('./config/auth/passport');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const {sequelize} = require('./config/database'); // Adjust the path to your Sequelize instance
const MongoStore = require('connect-mongo');
const mongoDb = require('./config/database/mongo');
const FederatedCredential = require('./modules/auth/models/federatedCredential');
const User = require('./modules/user/models/user');
const productService = require('./modules/product/services/product.services');
const hbsHelpers = require('handlebars-helpers');
const {engine} = require('express-handlebars');
const flash = require('connect-flash');
require('./utils/node-cron');


const app = express();

// Basic middlewares
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());


// Databases connection
connect();
mongoDb.connect();

// Session
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: parseInt(process.env.COOKIE_MAX_AGE, 10) // 24 hours
    },
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        collectionName: 'sessions', // Optional, default is 'sessions'
        ttl: parseInt(process.env.SESSION_TTL, 10)
    }),
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());


// Flash message
app.use(flash());

// HandleBars setup
const hbs = engine({
    extname: '.hbs',
    // set these things explixity to avoid confusion
    defaultLayout: 'main', // Use 'main.hbs' as the default layout
    layoutsDir: path.join(__dirname, 'views/layouts'), // Layouts folder
    partialsDir: path.join(__dirname, 'views/partials'), // Partials folder
    helpers: {
        ...hbsHelpers(),
        includes: function (array, value) {
            return array && array.includes(value);
        },
        eq: function (a, b) {
            return a === b;
        },
        json: function (context) {
            return JSON.stringify(context);
        },
        // Add the formatCurrency helper
        formatCurrency: function (value, locale = 'en-US', currency = 'USD') {
            if (typeof value !== 'number') {
                return value; // Return unformatted value if it's not a number
            }
            // Use Math.round to remove the fractional part
            const integerValue = Math.round(value);
            // Format with Intl.NumberFormat
            let formattedCurrency = new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: currency,
                minimumFractionDigits: 0, // No decimal places
                maximumFractionDigits: 0, // No decimal places
            }).format(integerValue);

            return formattedCurrency;
        }


    },
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true,
    }
});
app.engine('.hbs', hbs);
app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));


// Global variables
app.use((req, res, next) => {
    res.locals.user = req.user || null;
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");

    next();
});

// Index products when the application starts
productService.indexProducts().then(() => {
    console.log('Products indexed successfully');
}).catch(err => {
    console.error('Error indexing products:', err);
});


// Import and use routes
const routes = require('./routes/routes');
app.use(routes);


// Catch-all for 404 errors
app.use((req, res) => {
    res.status(404).render('404', {title: 'Page Not Found'});
});

// error handler
app.use((err, req, res, next) => {
    console.log(err.stack)
    if (res.headersSent) {
        return next(err)
    }
    res.status(500)
    res.render('error', { error: [err.message] })
});

module.exports = app;
