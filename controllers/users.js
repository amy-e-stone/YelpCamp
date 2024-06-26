const User = require('../models/user');

module.exports.renderRegister = (req, res) => {
    res.render('users/register');
}

// We don't like the error page we go to when catchAsync catches an error, so we will put our own try/catch
// around the code (inside the catchAsync) to handle the error our own way, with a flash message.
module.exports.register = async (req, res, next) => {
    try {
        // destructure what we want from req.body - for testing: res.send(req.body);
        const { email, username, password } = req.body;
        // pass email and username into a new user object
        const user = new User({ email, username });
        // pass this new instance of a user and the password through .register method for it to hash the password and store the salt
        const registeredUser = await User.register(user, password);
        // log the user in after registration so they don't have to login again at the login page
        // the login() method requires a callback parameter, we cannot await success or error, it is not supported by Passport
        req.login(registeredUser, err => {
            // catch any error and go to the error handler
            if(err) return next(err);
            req.flash('success', 'Welcome to Yelp Camp!');
            res.redirect('/campgrounds');
        });
    } catch(e) {
        req.flash('error', e.message);
        res.redirect('register');
    }
}

module.exports.renderLogin = (req, res) => {
    res.render('users/login');
}

module.exports.login = (req, res) => {
    req.flash('success', 'Welcome back!');
    // track where the user was and redirect there, if none, redirect to /campgrounds
    const redirectUrl = res.locals.returnTo || '/campgrounds';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
}

module.exports.logout = (req, res) => {
    // to logout using Passport
    req.logout( logout => {
    req.flash('success', 'Goodbye!');
    res.redirect('/campgrounds');
    });
}