var express     = require("express"),
    router      = express.Router(),
    HolyGround  = require("../models/holyground"),
    middleware  = require("../middleware");


// Config Cloudinary

var multer = require('multer');
var storage = multer.diskStorage({
    filename: function(req, file, callback) {
        callback(null, Date.now() + file.originalname);
    }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter});

var cloudinary = require('cloudinary');

cloudinary.config({
    cloud_name: 'holyground-dev',
    api_key: '229344786956653',
    api_secret: 'r5GYn8fNMRX8Azw0kwz1bGzqRLc'
});


//INDEX - show all holygrounds
router.get("/", function (req, res) {
    //Get all holygrounds fom DB
    HolyGround.find({}, function (err, allHolyGrounds) {
        if(err){
            console.log(err);
        } else {
            res.render("holygrounds/index", {holygrounds: allHolyGrounds, page: 'campgrounds'});
        }
    });
});

//NEW - show form to create new campground
router.get("/new", middleware.isLoggedIn, function (req, res) {
    res.render("holygrounds/new");
});

//CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res) {
    cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
        if(err) {
            req.flash('error', err.message);
            return res.redirect('back');
        }
        // add cloudinary url for the image to the campground object under image property
        req.body.holyground.image = result.secure_url;
        // add image's public_id to campground object
        req.body.holyground.imageId = result.public_id;
        // add author to campground
        req.body.holyground.author = {
            id: req.user._id,
            username: req.user.username
        }
        HolyGround.create(req.body.holyground, function(err, holyground) {
            if (err) {
                req.flash('error', err.message);
                return res.redirect('back');
            }
            res.redirect('/holygrounds/' + holyground.id);
        });
    });
});

//SHOW - show more info about one holyground
router.get("/:id", function (req, res) {
    HolyGround.findOne({_id: req.params.id}).populate("comments").exec(function (err, foundHolyGround) {
        if (err || !foundHolyGround) {
            req.flash("error", "HolyGround not found");
            res.redirect("back");
        } else {
            res.render("holygrounds/show", {holyground: foundHolyGround});
        }
    });
});

// EDIT HolyGround
router.get("/:id/edit", middleware.checkHolyGroundOwnership, function (req, res) {
    HolyGround.findOne({_id: req.params.id}, function (err, foundHolyGround) {
    res.render("holygrounds/edit", {holyground: foundHolyGround});
   });
});

//UPDATE HolyGround
router.put("/:id", upload.single('image'), middleware.checkHolyGroundOwnership, function(req, res){
    HolyGround.findById(req.params.id, async function(err, holyground){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            if (req.file) {
                try {
                    await cloudinary.v2.uploader.destroy(holyground.imageId);
                    var result = await cloudinary.v2.uploader.upload(req.file.path);
                    holyground.imageId = result.public_id;
                    holyground.image = result.secure_url;
                } catch(err) {
                    req.flash("error", err.message);
                    return res.redirect("back");
                }
            }
            holyground.name = req.body.holyground.name;
            holyground.description = req.body.holyground.description;
            holyground.price = req.body.holyground.price;
            holyground.save();
            req.flash("success","Successfully Updated!");
            res.redirect("/holygrounds/" + holyground._id);
        }
    });
});

//DESTROY HolyGround
router.delete("/:id", middleware.checkHolyGroundOwnership, function (req, res) {
    HolyGround.findOne({_id: req.params.id}, async function(err, holyground) {
        if(err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        try {
            await cloudinary.v2.uploader.destroy(holyground.imageId);
            holyground.remove();
            req.flash('success', 'Holyground deleted successfully!');
            res.redirect('/holygrounds');
        } catch(err) {
            if(err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
        }
    });
});

module.exports = router;