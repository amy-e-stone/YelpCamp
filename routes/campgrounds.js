const express = require('express');
// we don't need to use mergeParams here because the id is defined in the routes/paths
const router = express.Router();
const campgrounds = require('../controllers/campgrounds');
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, isAuthor, validateCampground } = require('../middleware');
const Campground = require('../models/campground');
const multer = require('multer');
// require the storage that we set up in index.js in the cloudinary folder
// this is the storage variable that is connected to cloudinary
// we do not need to include /index.js because Node.js automatically looks for an index.js file
const { storage } = require('../cloudinary')
// execute multer and set some destination for the user uploads
const upload = multer({ storage });

router.route('/')
    .get(catchAsync(campgrounds.index)) // SHOW ALL campgrounds
    .post(isLoggedIn, upload.array('image'), validateCampground, catchAsync(campgrounds.createCampground)); // create a new campground - SUBMIT FORM
    // 'image' is the field it should be looking for - we are telling multer that the peice of the form data with the name of 'image' is a file
    // the multer middleware will then add a file attribute to the req.body and the rest of the body which is called 'body'
    // .post(upload.array('image'), (req, res) => {
    //     console.log(req.body, /*req.file,*/ req.files);
    //     res.send("IT WORKED?!");
    // })

// create a NEW CAMPGROUND - route that SERVES THE FORM
// this must come before /:id route because it will think that /new is an id if we put it after
router.get('/new', isLoggedIn, campgrounds.renderNewForm);

router.route('/:id')
    .get(catchAsync(campgrounds.showCampground)) // SHOW a SPECIFIC campground by clicking on a link from all campgrounds page
    .put(isLoggedIn, isAuthor, upload.array('image'), validateCampground, catchAsync(campgrounds.updateCampground)) // EDIT/UPDATE a campground - SUBMIT FORM
    .delete(isLoggedIn, isAuthor, catchAsync(campgrounds.deleteCampground)) // DELETE a campground

// EDIT/UPDATE a campground - route that SERVES THE FORM
router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(campgrounds.renderEditForm));

module.exports = router;