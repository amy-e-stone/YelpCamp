const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    }
});

// we are passing in the result from requiring the package that we installed to UserSchema.plugin
// this is going to add on to our schema - a field for a username, a field for a password, will make sure 
// the username is unique, it's also going to give us some additional methods that we can use
// See docs for more info
UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);