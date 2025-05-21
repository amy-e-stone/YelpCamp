const Campground = require('../models/campground');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapBoxToken = process.env.MAPBOX_TOKEN;
// instantiate a mapbox geocoding instance with the access token, the attribute name is gotten from docs
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });
const { cloudinary } = require('../cloudinary');

// bad language filter
const Filter = require('bad-words');
const filter = new Filter();

module.exports.index = async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index', { campgrounds });
}

module.exports.renderNewForm = (req, res) => {
    res.render('campgrounds/new');
}

module.exports.createCampground = async (req, res, next) => {

    // bad language filter
    const { title, description, location } = req.body.campground;
    if (filter.isProfane(title) || filter.isProfane(description) || filter.isProfane(location)) {
        req.flash('error', 'Inappropriate content detected.');
        return res.redirect('/campgrounds/new');
    }

    const geoData = await geocoder.forwardGeocode({
        // query: 'Yosemite, CA',
        query: req.body.campground.location,
        limit: 1
    }).send();
    // from this test, we can figure out that we want to use geoData.body, then we
    // print geoData.body.features to see what the feature object has in it
    // chain on geometry --> coordinates gotten from the object
    // console.log(geoData);
    const campground = new Campground(req.body.campground);
    campground.geometry = geoData.body.features[0].geometry;
    // multer gives us access to req.files
    // map the files into an object
    // for each file 'f', return an object (if you do an implicit return, you need parenthesis around the curly bracers)
    // if I uploaded some files, this should make us an array that contains these objects, each with a url and filename gotten from req.files (thanks to multer)
    //campground.images = req.files.map(f => ({ url: f.path, filename: f.filename})); // replaced this line with the code block below for image filtering

    // inappropriate image filtering with Cloudinary AWS add-on
    const safeImages = [];
    for (let file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
            moderation: 'aws_rek'
        });

        // for TESTING
        console.log('MODERATION RESULT:', result.moderation);
        console.log('FULL UPLOAD RESULT:', result);

        const status = result.moderation?.[0]?.status;

        if (status === 'rejected') {
            console.log(`Rejected image: ${file.originalname}`);
            continue; // Skip unsafe images
        }
        safeImages.push({ url: result.secure_url, filename: result.public_id });
    }

    if (safeImages.length === 0) {
        req.flash('error', 'Uploaded images were flagged as inappropriate.');
        return res.redirect('/campgrounds/new');
    }

    campground.images = safeImages;

    campground.author = req.user._id;
    await campground.save();
    // for TESTING
    console.log(campground);
    req.flash('success', 'Successfully made a new campground!');
    res.redirect(`/campgrounds/${campground._id}`);
}

module.exports.showCampground = async (req, res) => {
    const campground = await Campground.findById(req.params.id).populate({
        // populate all of the reviews on the reviews array on the one campground we are finding
        path: 'reviews',
        // on each one of the reviews, populate the author of the review
        populate: {
            path: 'author'
        }
        // and then separately, populate the one author on the campground we are viewing
    }).populate('author');
    if (!campground) {
        req.flash('error', 'Cannot find that campground!');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/show', { campground });
}

module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    if (!campground) {
        req.flash('error', 'Cannot find that campground!');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/edit', { campground });
}

module.exports.updateCampground = async (req, res) => {
    const { id } = req.params;

    // bad language filter
    const { title, description, location } = req.body.campground;
    if (filter.isProfane(title) || filter.isProfane(description) || filter.isProfane(location)) {
        req.flash('error', 'Inappropriate content detected.');
        return res.redirect(`/campgrounds/${id}/edit`);
    }

    console.log(req.body);
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
    // makes an array of files
    // replaced the following 2 lines of code with the code block below for image filtering
    //const imgs = req.files.map(f => ({ url: f.path, filename: f.filename })); 
    // RECALL spread operator, don't pass in the entire array, just take each item of the array and push 1 by 1
    //campground.images.push(...imgs);

    // inappropriate image filtering with Cloudinary AWS add-on
    const safeImages = [];
    for (let file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
            moderation: 'aws_rek'
        });
        const status = result.moderation?.[0]?.status;
        if (status === 'rejected') {
            console.log(`Rejected image: ${file.originalname}`);
            continue;
        }
        safeImages.push({ url: result.secure_url, filename: result.public_id });
    }

    if (safeImages.length === 0 && req.files.length > 0) {
        req.flash('error', 'Uploaded images were flagged as inappropriate.');
        return res.redirect(`/campgrounds/${id}/edit`);
    }

    campground.images.push(...safeImages);

    if (req.body.deleteImages) {
        // delete the images from Cloudinary
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        // update the campground we found
        // pull from the images array, all images where the filename of that image is in the req.body.deleteImages array
        // this deletes the images from Mongo
        await campground.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } });
        console.log(campground);
    }
    await campground.save();
    req.flash('success', 'Successfully updated campground!');
    res.redirect(`/campgrounds/${campground._id}`);
}

module.exports.deleteCampground = async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted campground');
    res.redirect('/campgrounds');
}