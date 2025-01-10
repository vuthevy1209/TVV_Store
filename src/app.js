// place it add the top to ensure that all env is loaded before any code that needs .env executed
require('dotenv').config(); // load the env variables


var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const AuthController = require('./modules/auth/controllers/auth.controllers');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());

// Connect to database
const {connect} = require("./config/database");
connect();

// passport
const passport = require('./config/auth/passport');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const {sequelize} = require('./config/database'); // Adjust the path to your Sequelize instance
const MongoStore = require('connect-mongo');
const mongoDb = require('./config/database/mongo');
mongoDb.connect();

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

// const cartSessionMiddleware = require('./modules/cart/middlewares/cartSession.middlewares');
// app.use(cartSessionMiddleware);

app.use(passport.initialize());
// app.use(passport.authenticate('session'));
app.use(passport.session());

const FederatedCredential = require('./modules/auth/models/federatedCredential');
const User = require('./modules/user/models/user');





// flash
const flash = require('connect-flash');
app.use(flash());

// view
const hbsHelpers = require('handlebars-helpers');
const {engine} = require('express-handlebars');

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
        }
    },
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true,
    }
});


// Template engine
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
const productService = require('./modules/product/services/product.services');
productService.indexProducts().then(() => {
    console.log('Products indexed successfully');
}).catch(err => {
    console.error('Error indexing products:', err);
});


// routes
const authRouter = require('./modules/auth/routes/auth.routes');
const productRouter = require('./modules/product/routes/product.routes');
const homeRouter = require('./modules/home/routes/home.routes');
const cartRouter = require('./modules/cart/routes/cart.routes');
const orderRouter = require('./modules/order/routes/order.routes');
const connectEnsureLogin = require('connect-ensure-login');
const userRouter = require('./modules/user/routes/user.routes');
const paymentRouter = require('./modules/payment/routes/payment.routes');

app.use('/auth/login/google' , passport.authenticate('google'));
app.use('/oauth2/redirect/google', AuthController.googleCallback);

// app.use('/oauth2/redirect/google', passport.authenticate('google', {
//     successRedirect: '/home',
//     failureRedirect: '/auth/login-register',
//     keepSessionInfo: true
//
// }));

require('./utils/node-cron');


app.use('/auth', authRouter);
app.use('/products', productRouter);
app.use('/user', userRouter);

app.use('/carts', cartRouter);
app.use('/orders', connectEnsureLogin.ensureLoggedIn({ setReturnTo: true, redirectTo: '/auth/login-register' }), orderRouter);
app.get('/config', (req, res) => {
    res.json({ ipInfoToken: process.env.IPINFO_TOKEN });
});
app.use('/', homeRouter);


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
