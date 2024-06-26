const cloudinary = require('cloudinary').v2; // <--gotten from the docs, the .v2 is important
const { CloudinaryStorage } = require('multer-storage-cloudinary'); // <--also gotten from the docs

// the attribute names cloud_name, api_key and api_secret must not be changed
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
});

// instantiate an instance of Cloudinary Storage (whcat we imported above)
const storage = new CloudinaryStorage({
    // pass in the cloudinary object that we just configured (cloudinary.config)
    cloudinary,
    params: {
        // 'folder' will be the folder that cloudinary will use to store the files
        folder: 'YelpCamp',
        allowedFormats: ['jpeg', 'jpg', 'png']
    }
})

module.exports = {
    cloudinary,
    storage
}