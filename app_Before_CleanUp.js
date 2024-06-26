// require express so that we can connect to server
const express = require('express');
const app = express();
// require path so that we can run from any directory
const path = require('path');
// require mongoose so that we can connect to mongo db
const mongoose = require('mongoose');
// require the db models
const Campground = require('./models/campground');
const Review = require('./models/review');

// connect mongoose to mongo
// ...one way to do this
// mongoose.connect('mongodb://127.0.0.1:27017/yelp-camp', { useNewUrlParser: true, useUnifiedTopology: true })
// // .connect returns a promise, so we will use .then .catch instead of what the Mongoose Quick Start suggests
//     .then(() => {
//         console.log("MONGO CONNECTION OPEN!!!")
//     })
//     .catch(err => {
//         console.log("OH NO ERROR CONNECTING TO MONGO!!!!")
//         console.log(err)
//     })

// ...another way to do this (as seen in YelpCamp demo)
mongoose.connect('mongodb://127.0.0.1:27017/yelp-camp', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

// set the view engine to ejs as this is how we will render the pages
// set the path so that we can run the app from any directory, as long as we are properly pointing to it in console
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// for express to parse req.body from POST
app.use(express.urlencoded({ extended: true }));

// to use PUT, PATCH or DELETE
const methodOverride = require('method-override');
// pass in the string that we want to use for our query string
app.use(methodOverride('_method'));

// ejs-mate code placeholders
// with ejs-mate we can now define a layout file ine vews/layouts
const ejsMate = require('ejs-mate');
// tell the express app to use this for the ejs engine (there are multiple engines), ejs-mate
app.engine('ejs', ejsMate);

// require wrapper function
const catchAsync = require('./utils/catchAsync');

// require error function class
const ExpressError = require('./utils/ExpressError');

// require the schema we made with Joi
const { campgroundSchema, reviewSchema } = require('./schemas.js')

const validateCampground = (req, res, next) => {
    // NOTE: we cut this out and pasted it into schemas.js
    // const campgroundSchema = Joi.object({
    //     campground: Joi.object({
    //         title: Joi.string().required(),
    //         price: Joi.number().required().min(0),
    //         image: Joi.string().required(),
    //         location: Joi.string().required(),
    //         description: Joi.string().required()
    //     }).required()
    // })
    const { error } = campgroundSchema.validate(req.body);
    if(error){
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
}

const validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if(error){
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
}


// ROUTES
app.get('/', (req, res) => {
    // TO TEST connection
    // res.send('HELLO FROM YELPCAMP!');
    // TO TEST ejs rendering
    res.render('home');
});

// SHOW ALL campgrounds
app.get('/campgrounds', catchAsync(async (req, res) => {
    const campgrounds = await Campground.find({});
    // pass the campgrounds through the template (ejg) and render it to the webpage
    res.render('campgrounds/index', { campgrounds });
}));

// // TO TEST creating a new entry in the db, should be a POST, but this is just for testing
// app.get('/makecampground', async (req, res) => {
//     const camp = new Campground({ title: 'My Backyard', description: 'cheap camping' });
//     await camp.save();
//     res.send(camp);
//     // also check the database as well (Windows console mongosh)
// })

// create a NEW CAMPGROUND - route that SERVES THE FORM
// this must go before '/campgrounds/:id' route because it will treat 'new' in this route as the :id
app.get('/campgrounds/new', (req, res) => {
    res.render('campgrounds/new');
});

// // create a new campground - SUBMIT FORM (with try/catch error handling)
// // this is the endpoint where the new campground form is submitted to
// app.post('/campgrounds', async (req, res, next) => {
//     try {
//     // by default, req.body is going to be empty because it has not yet been parsed
//     // so we need to tell express to parse the body app.use(express.urlencoded({ extended: true }))
//     // TO TEST that we can see the req.body (shows up on webpage after submitting doc)
//     // res.send(req.body);
//     // we can see from the body that the info is under "campground" so we need to specify this
//     const campground = new Campground(req.body.campground)
//     await campground.save();
//     // redirect to the newly created campground
//     res.redirect(`/campgrounds/${campground._id}`);
//     } catch(e) {
//         next(e);
//     }
// });

// create a NEW CAMPGROUND - SUBMIT FORM (with async wrapper function error handling)
// note that we call validiateCampground first
app.post('/campgrounds', validateCampground, catchAsync(async (req, res, next) => {
    // without the if statement checking for the completion of new campground info,
    // we can still post a new campground outside of the form that will return an empty form - so
    // if we throw the following error ourselves, the catchAsync will catch the error and hand it off to next
    // if(!req.body.campground) throw new ExpressError('Invalid Campground Data', 400)
    // we can use joi rather than writing if statements to check for form completion (NOT A MONGOOSE SCHEMA!!)
    // this is going to validate our data before we even attempt to save it with Mmongoose (See JOI docs)
    // we will cut this out and make it middleware so it's more reusable
    // const campgroundSchema = Joi.object({
    //     campground: Joi.object({
    //         title: Joi.string().required(),
    //         price: Joi.number().required().min(0),
    //         image: Joi.string().required(),
    //         location: Joi.string().required(),
    //         description: Joi.string().required()
    //     }).required()
    // })
    // // now we pass the data through the schema
    // const { error } = campgroundSchema.validate(req.body);
    // if(error){
    //     // result.error.details -> 'details is an array of objects and we have to map over it and turn it into a single string and join it together
    //     const msg = error.details.map(el => el.message).join(',');
    //     throw new ExpressError(msg, 400);
    // }
    // // we can see this result in Postman when making an empty POST
    // // and we can see this by adding the attributes like campground[price] or just campground, etc
    // console.log(result);
    const campground = new Campground(req.body.campground)
    await campground.save();
    res.redirect(`/campgrounds/${campground._id}`);
}));

// SHOW a SPECIFIC campground by clicking on a link from all campgrounds page
app.get('/campgrounds/:id', catchAsync(async (req, res) => {
    // pass in the id to .findById() which is going to be from req.params.id
    const campground = await Campground.findById(req.params.id).populate('reviews');

    // TO TEST, this just renders the show page
    // res.render('campgrounds/show')
    // pass the campground (found by id) through the template (ejg) and render it to the webpage
    res.render('campgrounds/show', { campground });
}));

// EDIT/UPDATE a campground - route that SERVES THE FORM
app.get('/campgrounds/:id/edit', catchAsync(async (req, res) => {
    // find the campground by the id
    const campground = await Campground.findById(req.params.id);
    // pass the campground (found by id) through the template (ejg) and render it to the webpage
    res.render('campgrounds/edit', { campground });
}));

// EDIT/UPDATE a campground - SUBMIT FORM
app.put('/campgrounds/:id', validateCampground, catchAsync(async (req, res) => {
    // TO TEST to make sure that this PUT route works with the POST request (method override)
    // res.send("IT WORKED!!");
    // Update the campground
    // this gives us the id (destructring)
    const { id } = req.params;
    // in the 2nd argument, we use the 'spread' operator instead of what we have done before
    // the spread syntax enumerates (singles out from an array or iterable) the properties of an object and adds the key-value pairs to the object being created.
    // const campground = await Campground.findByIdAndUpdate(id, {title: req.body.campground.title, location: req.body.campground.location} );
    const campground = await Campground.findByIdAndUpdate(id, {...req.body.campground});
    res.redirect(`/campgrounds/${campground._id}`);
}));

// DELETE a campground
app.delete('/campgrounds/:id', catchAsync(async (req, res) => {
    const { id } = req.params;
    // first you would want to find the campground and make some other requests before removing
    // for example, you would want to remove anything associated with it first, like photos or comments
    // for now we are just setting up the D in CRUD
    await Campground.findByIdAndDelete(id);
    res.redirect('/campgrounds');
}));

// Associate a single campground with some NEW REVIEW
app.post('/campgrounds/:id/reviews', validateReview, catchAsync (async (req, res) => {
    // to test if we hit the nested route
    // res.send('YOU MADE IT!')
    const campground = await Campground.findById(req.params.id);
    const review = new Review(req.body.review);
    campground.reviews.push(review);
    await review.save();
    await campground.save();
    res.redirect(`/campgrounds/${campground._id}`);
}));

// DELETE a review
// we need 'campgrounds/:id' because we want to remove that reference to whatever the review is in the campground and we want to remove the review itself 'reviews/:reviewId'
app.delete('/campgrounds/:id/reviews/:reviewId', catchAsync(async (req, res) => {
    // res.send('DELETE ME!');
    // await Review.findByIdAndDelete(req.params.reviewId);
    // at this point we still have the reference to this review in our campground in the array of object ids
    // we need to find that campground and delete that ONE review (not all of the reviews!), nor do we want to delete the campground
    const { id, reviewId } = req.params;
    // pull operator - pull from the reviews array where we have reviewId
    await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId }});
    await Review.findByIdAndDelete(reviewId);
    // sends you back to the campground page
    res.redirect(`/campgrounds/${id}`);
}))

// for every single request, '*' means for every path, we will call the callback
// Order is important here! This will only run if nothing else is matched (to the path) first
app.all('*', (req, res, next) => {
    // res.send('404!!!')
    next(new ExpressError('Page Not Found', 404))
})

// Error Handler
app.use((err, req, res, next) => {
    // instead of destructuring we will pass the entire error to the error template
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong';
    res.status(statusCode).render('error', { err });
    // const { statusCode = 500, message = 'Something went wrong and was not specified, so this is the default message' } = err;
    // res.status(statusCode).render('error');
    // res.status(statusCode).send(message);
    // res.send('Something is wrong')
})



app.listen(3000, () => {
    console.log('Serving on port 3000');
});