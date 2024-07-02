//if we are not in production mode (meaning we are in development mode)
if(process.env.NODE_ENV !== "production") {
    // require the dotenv module and call the config function
    require('dotenv').config();
}

require('dotenv').config();

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');

// require the routes
const userRoutes = require('./routes/users');
const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');

// require connect-mongo (so that we can store a session on Mongo Atlas instead of local memory)
const MongoDBStore = require('connect-mongo')(session);

// connect to the database, local is 'mongodb://127.0.0.1:27017/yelp-camp', Atlas is process.env.DB_URL
const dbUrl = process.env.DB_URL || 'mongodb://127.0.0.1:27017/yelp-camp';

mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const app = express();

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
// tell the app to serve the public directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(mongoSanitize({
    replaceWith: '_'
}));

const secret = process.env.SECRET;

const store = new MongoDBStore({
    url: dbUrl,
    secret,
    // how often to update (instead of updating every time a user refreshes the page) - total number of seconds
    // for example, to set 24 hours, you would set the following to get seconds
    touchAfter: 24 * 60 * 60
})

store.on("error", function(e) {
    console.log("SESSION STORE ERROR!!!", e);
})

const sessionConfig = {
    // pass store directly into the session config object
    // store: store, or just store,
    store,
    // we make a name so that it is different from the default, 'connect.sid', (we are not trying to hide it, just need something different)
    name: 'session',
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        // make it so 3rd parties do not have access to the cookie (see documentation)
        // this applies only to the cookie set through this session
        // the cookie is only accessible over http, they are not accessible through javascript - so if an attacker
        // were to write some javascript that executes on our site and extracts cookies, they would not be able to
        // see our session cookie
        httpOnly: true,

        // the following line makes it so the cookie can only be configured/changed over https (http secure), localhost is not
        // secure: true,

        // Date.now() is in milliseconds, this cookie will expire in a week
        // it is broken down into milliseconds/second, seconds/min, minutes/hour, hours/day, and days/week
        // we can see this expiration date in the dev tools
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig));
app.use(flash());

// helmet package adds headers in the response that give more security
// this automatically enables all 11 of the middleware that helmet comes with
app.use(helmet());
// contentSecurityPolicy: specify a list of trusted sources, for example images can only be from unsplash
// app.use(helmet({contentSecurityPolicy: false}));
// below is the content security policy settings ...
const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
];
const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
];
// configure helmet
const fontSrcUrls = [];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/dfr64tnii/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT! 
                "https://images.unsplash.com/",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);

// tell the app to use passport, see passport docs
app.use(passport.initialize());
app.use(passport.session());
// telling passport to use the local strategy that we have required and for that local strategy, the
// authentication method is going to be located on our user model and it's called 'authenticate'
passport.use(new LocalStrategy(User.authenticate()));
// this is telling passport how to serialize a user
// serialization refers to how we store a user in the session
passport.serializeUser(User.serializeUser());
// how do you get a user out of that session, 'unstore' the session
passport.deserializeUser(User.deserializeUser());

// Hardcode a user for testing
app.get('/fakeUser', async (req, res) => {
    const user = new User({ email: 'culito@yahoo.com', username: 'Culito' });
    // 'register' method will salt and hash the password and store it
    const newUser = await User.register(user, 'chicken');
    res.send(newUser);
})

// middleware for Flash message, local variables
app.use((req, res, next) => {
    // on every single request, take whatever is in there (most of the time it will be nothing), do the stuff in here

    // to TEST injection
    // console.log(req.query);

    // we can name these whatever we want - 'res.locals.<yournaming>'
    // we should have access to currentUser in all templates
    res.locals.currentUser = req.user;
    // if there is anything stored in the flash in the key 'success'
    res.locals.success = req.flash('success');
    // if there is anything stored in the flash in the key 'error'
    res.locals.error = req.flash('error');
    next();
})

// use the following routes from the 'routes' folder
app.use('/', userRoutes);
app.use('/campgrounds', campgroundRoutes);
app.use('/campgrounds/:id/reviews', reviewRoutes);


// ROUTES
app.get('/', (req, res) => {
    res.render('home');
});

// Handles requests with an incorrect URL and redirects to the home page
app.get('/%0d', (req, res) => {
    res.render('home');
});

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
})

// Error Handler
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong';
    res.status(statusCode).render('error', { err });
})

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Serving on port ${port}`);
});