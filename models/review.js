const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
    body: String,
    rating: Number,
    author: {
        type: Schema.Types.ObjectId,
        // refer to the user model
        ref: 'User'
    }
});

module.exports = mongoose.model("Review", reviewSchema);