const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js")
const {isLoggedIn, isOwner, validateListing, validateReview} =  require("../middleware.js")
const listingController = require("../controllers/listings.js");

const multer = require('multer');
const {storage} = require("../cloudConfig.js")
const upload = multer({storage});


//index route and Create/Post Route
router
    .route("/")
    .get(wrapAsync(listingController.index))
    .post(
        isLoggedIn,
        (req, res, next) => {
            console.log("Request Body:", req.body); // Log request body
            console.log("Uploaded File:", req.file); // Log uploaded file
            next();
        },
        (req, res, next) => {
            upload.single("listing[image][url]")(req, res, (err) => {
                if (err) {
                    console.error(err);
                    return res.status(400).send(err.message);
                }
                next();
            });
        },
        wrapAsync(listingController.createListing) // Call your createListing method
    );
    
 

//New or create Route
router.get("/new", isLoggedIn,listingController.renderNewForm) 

//Show route and Update route and delete route
router
    .route("/:id")
    .get(wrapAsync(listingController.showListing))
    .put(
        isLoggedIn,isOwner,
        upload.single("listing[image][url]"),
        // validateListing,
        wrapAsync(listingController.updateListing)
    )
    .delete(
        isLoggedIn,isOwner, wrapAsync(listingController.destroyListing)
    );


//edit Route
router.get("/:id/edit",
    isLoggedIn,isOwner,
    wrapAsync(listingController.renderEditForm)
);

module.exports = router;