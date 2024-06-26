// require JOI, a JavaScript validation tool
// validation for non-client side (AJAX, Postman, etc...), this is here just in case the validations on the client side fail
const BaseJoi = require('joi');
const sanitizeHtml = require('sanitize-html');

// we added this code to make our own methods for sanitization/escape html
// we are defining an extension on joi.string(), called escapeHTML
// this would allow us to do this Joi.string().required().escapeHTML()
const extension = (joi) => ({
    type: 'string',
    base: joi.string(),
    messages: {
        'string.escapeHTML': '{{#label}} must not include HTML!'
    },
    rules: {
        escapeHTML: {
            validate(value, helpers) {
                const clean = sanitizeHtml(value, {
                    // nothing is allowed
                    allowedTags: [],
                    allowedAttributes: {},
                });
                // check to see if there is a difference between the input that was passed in with the sanitized output
                // if it is different then something has been removed and we output the following error
                if (clean !== value) return helpers.error('string.escapeHTML', { value })
                return clean;
            }
        }
    }
});

// we write the following line so that we do not have to change our original campground joi validation schema below
// then we add on .escapeHTML() anytime we have a text input
const Joi = BaseJoi.extend(extension);

module.exports.campgroundSchema = Joi.object({
    campground: Joi.object({
        title: Joi.string().required().escapeHTML(),
        price: Joi.number().required().min(0),
        // image: Joi.string().required(),
        location: Joi.string().required().escapeHTML(),
        description: Joi.string().required().escapeHTML()
    }).required(),
    deleteImages: Joi.array()
});

module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().required().min(1).max(5),
        body: Joi.string().required().escapeHTML()
    }).required()
});

// if the data does not pass this validation, the error will read "<> is not allowed...."