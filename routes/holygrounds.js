var express     = require("express"),
    router      = express.Router(),
    HolyGround  = require("../models/holyground");

//INDEX - show all holygrounds
router.get("/", function (req, res) {
    //Get all holygrounds fom DB
    HolyGround.find({}, function (err, allHolyGrounds) {
        if(err){
            console.log(err);
        } else {
            res.render("holygrounds/index", {holygrounds: allHolyGrounds, currentUser: req.user});
        }
    });
});

//NEW - show form to create new campground
router.get("/new", isLoggedIn, function (req, res) {
    res.render("holygrounds/new");
});

//CREATE - add new campground to DB
router.post("/", isLoggedIn, function (req, res) {
    var name = req.body.name;
    var image = req.body.image;
    var description = req.body.description;
    var author = {
      id: req.user._id,
      username: req.user.username
    };
    var newHolyGround = {name: name, image: image, description: description, author: author};
    HolyGround.create(newHolyGround, function (err, newlyCreated) {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/holygrounds");
        }
    });
});

//SHOW - show more info about one holyground
router.get("/:id", function (req, res) {
    HolyGround.findOne({_id: req.params.id}).populate("comments").exec(function (err, foundHolyGround) {
        if (err) {
            console.log(err);
        } else {
            res.render("holygrounds/show", {holyground: foundHolyGround});
        }
    });
});

// Middleware todo refactor own file
function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}

module.exports = router;