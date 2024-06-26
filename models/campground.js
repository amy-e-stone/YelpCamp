// require Mongoose so that we can connect to Mongo through JavaScript
const mongoose = require('mongoose');
const Review = require('./review');
// make a variable for our schema (this just shortens it so that we don't have to type mongoose.Schema every time)
const Schema = mongoose.Schema;

// for reference
// https://res.cloudinary.com/dfr64tnii/image/upload/v1682429824/YelpCamp/x0fzhmgb6ufxyvwekjhv.jpg

const ImageSchema = new Schema({
    url: String,
    filename: String
})

// by moving images out into it's own schema, we can use ImageSchema.virtual()
// RECALL that Mongoose virtuals are properties not stored in the Mongo database (we already have the url from Cloudinary stored, we do not need to save the thumbnails since we are using Cloudinary API)
// In other words, the thumnail is derived from what we are already storing
ImageSchema.virtual('thumbnail').get(function() {
    // 'this' refers to the particular image we are transforming to thumbnail
    // we could use a regular expression (REGEX), but we haven't talked about that yet
    return this.url.replace('/upload', '/upload/w_200');
});

// By default, Mongoose does not include viretuals when you convert a document to JSON
// 'opts' needs to be passed in after the model as , opts
const opts = { toJSON: { virtuals: true } };

// make the schema/model
const CampgroundSchema = new Schema({
    title: String,
    // we moved images out into it's own schema above
    images: [ImageSchema],
    // the following MUST follow the guidelines in Mongo docs for location
    // Mongo supports GeoJSON functionalities
    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    price: Number,
    description: String,
    location: String,
    author: {
        type: Schema.Types.ObjectId,
        // refer to the user model
        ref: 'User'
    },
    reviews: [{
        // an object id
        type: Schema.Types.ObjectId,
        // refer to the review model
        ref: 'Review'
    }]
}, opts);

// includes markup for the popup on every instance of campground
CampgroundSchema.virtual('properties.popUpMarkup').get(function() {
    // sets a link to go view the campground instance
    // 'this' refers to the particular campground instance
    return `
    <strong><a href="/campgrounds/${this._id}">${this.title}</a></strong>
    <p>${this.description.substring(0, 20)}...</p>`
});

// another example, not using the shorthand syntax
// const productSchema = new mongoose.Schema({
//     name: {
//         type: String,
//         required: true,
//     },
//     price: {
//         type: Number
//     }
// });

// when writing middleware, it is recommeded to look at the docs under types of middleware because it can be confusing
// note that there are 2 types: query middleware and docement middleware
// look at how we are currently removing a campground, which is findByIdAndDelete()
// to see what middleware findByIdAndDelete() triggers, look for that method in the docs under models
// we see that this method triggers findOneAndDelete()

// delete every review with the matching campround id when a campground is deleted
// this is a query middleware
CampgroundSchema.post('findOneAndDelete', async function(doc){
    // for TESTING, if we see this in the terminal when we delete a campground, then we know that the middleware ran
    // console.log('DELETED!!!!!');
    // what we want to do is to take the document that was just deleted (doc was passed in so we still have access to it)
    // here, we can see what was just deleted
    // console.log(doc);
    // if we did find a document...
    if(doc){
        // pass in the query
        await Review.deleteMany({
            // the id for each review is somewhere '$in'
            _id: {
                $in: doc.reviews
            } 
        })
    }
})
// NOTE: if we change the way we delete campgrounds in app.js - say we use deleteMany() rather than
//       findByIdAndDelete(), it will not trigger the above middleware

// export the compiled model
// recall that mongoose creates a collection called 'campgrounds' in mongo
module.exports = mongoose.model('Campground', CampgroundSchema);
