const { campgroundSchema, reviewSchema } = require('./schemas.js'); // <-- Joi schema
const ExpressError = require('./utils/ExpressError');
const Campground = require('./models/campground');
const Review = require('./models/review');

// Save the returnTo value from the session (req.session.returnTo) to res.locals
module.exports.storeReturnTo = (req, res, next) => {
    if (req.session.returnTo) {
        res.locals.returnTo = req.session.returnTo;
    }
    next();
}

// Is the user logged in?
// instead of starting with 'const isLoggedIn', we can export at the same time by typing it this way...
module.exports.isLoggedIn = (req, res, next) => {
    // 'req.user' is automatically filled in with the deserialized intormation from the session ('user' is added by Passport)
    // console.log('REQ.USER...', req.user);
    // use passport '.isAuthenticated()' to only allow logged in users to access a particular route
    if(!req.isAuthenticated()){
        // store the url the user is requesting and then redirect back to login
        // we want to store the originalUrl, here is an example of both path and originalUrl
        // console.log(req.path, req.originalUrl);
        // req.session.returnTo = req.originalUrl <-- this was later removed and put into the app.use middleware in app.js that runs everytime due to a reported bug
        req.flash('error', 'You must be signed in');
        return res.redirect('/login');
    }
    next();
}

// Does the campground have all of the required information?
module.exports.validateCampground = (req, res, next) => {
    const { error } = campgroundSchema.validate(req.body);
    if(error){
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
}

// Does the user have permission to change a campground?
module.exports.isAuthor = async(req, res, next) => {
    // take the id from the url
    const { id } = req.params;
    // look up the campground with that id
    const campground =  await Campground.findById(id);
    // look to see if the logged in user id equals the campground author id
    if(!campground.author.equals(req.user._id)){
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/campgrounds/${id}`);
    }
    next();
}

// Does the user have permission to delete a review?
module.exports.isReviewAuthor = async(req, res, next) => {
    // take the id from the url (recall how the route is set up 'reviewId')
    // '/campgrounds/id/reviews/reviewId', we donstruct the review id as well as the campground id
    const { id, reviewId } = req.params;
    // look up the campground with that id
    const review =  await Review.findById(reviewId);
    // look to see if the logged in user id equals the campground author id
    if(!review.author.equals(req.user._id)){
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/campgrounds/${id}`);
    }
    next();
}

// Does the review have all of the required information?
module.exports.validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if(error){
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
}


