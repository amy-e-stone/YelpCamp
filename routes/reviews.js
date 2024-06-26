const express = require('express');
// we use mergeParams here because the id is not defined in the routes/paths
const router = express.Router({ mergeParams: true });
const { validateReview, isLoggedIn, isReviewAuthor } = require('../middleware')
const Campground = require('../models/campground');
const Review = require('../models/review');
const reviews = require('../controllers/reviews');
const ExpressError = require('../utils/ExpressError');
const catchAsync = require('../utils/catchAsync');

// Associate a single campground with some NEW REVIEW
router.post('/', isLoggedIn, validateReview, catchAsync (reviews.createReview));

// DELETE a review
router.delete('/:reviewId', isLoggedIn, isReviewAuthor, catchAsync(reviews.deleteReview));

module.exports = router;