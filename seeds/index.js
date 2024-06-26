// For development only

// we will make this self-contained (run it on it's own)
// it will use mongoose, the model/schema and the array of 1,000 cities dataset

// require mongoose so that we can connect to mongo db
const mongoose = require('mongoose');
// require the db model, note that the path is backed out by one with (..)
const Campground = require('../models/campground');
// require the city dataset
const cities = require('./cities');
// import data { destructured }
const { places, descriptors } = require('./seedHelpers');


mongoose.connect('mongodb://127.0.0.1:27017/yelp-camp', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

// we need to pick a random place and a random descriptor and combine the two
// note that this is a one line function that we can pass an array to
const sample = array => array[Math.floor(Math.random() * array.length)];

const seedDB = async () => {
    // start by removing everything from the database
    // Campground is the model/schema
    await Campground.deleteMany({});
    // to test
    // const c = new Campground({title: 'purple field'});
    // await c.save();
    for (let i = 0; i < 300; i++){
        const random1000 = Math.floor(Math.random() * 1000);
        const price = Math.floor(Math.random() * 20) + 10;
        const camp = new Campground({
            // we are assigning the same author to all of the campgrounds
            author: '643d3d2969cc04034437648a',
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            description: 'Lorem ipsum, dolor sit amet consectetur adipisicing elit. Labore rerum minus cupiditate eaque, voluptatibus odit amet veniam provident doloribus, officia explicabo, quis modi? Qui, maiores ratione voluptatibus quos iste itaque?',
            price,
            geometry: {
                type: 'Point',
                coordinates: [
                    cities[random1000].longitude,
                    cities[random1000].latitude,
                ]
            },
            images: [
                {
                  url: 'https://res.cloudinary.com/dfr64tnii/image/upload/v1682341155/YelpCamp/qcrpiynvduxivex0i4m6.jpg',
                  filename: 'YelpCamp/qcrpiynvduxivex0i4m6'
                },
                {
                  url: 'https://res.cloudinary.com/dfr64tnii/image/upload/v1682341158/YelpCamp/jc61qq6hzlem81ivcw30.jpg',
                  filename: 'YelpCamp/jc61qq6hzlem81ivcw30'
                }
              ]
        })
        await camp.save();
    }
}

// execute seedDB
// seedDB() returns a promise because it's an async function
// recall: .then is the function to be executed after the promise resolves
seedDB().then(() => {
    mongoose.connection.close();
})