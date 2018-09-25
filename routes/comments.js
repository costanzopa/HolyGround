var express       = require("express"),
    router        = express.Router({mergeParams: true}),
    HolyGround    = require("../models/holyground"),
    Comment       = require("../models/comment");

// Comments New
router.get("/new", isLoggedIn, function(req, res) {
    HolyGround.findOne({_id: req.params.id}, function (err, holyground) {
        if (err) {
            console.log(err);
        } else {
            res.render("comments/new", {holyground: holyground});
        }
    });
}) ;


//Comments Create
router.post("/", isLoggedIn,function (req, res) {
    HolyGround.findOne({_id: req.params.id}, function (err, holyground) {
        if (err) {
            console.log(err);
            res.redirect("/holygrounds");
        } else {
            Comment.create(req.body.comment, function (err, comment) {
                if (err) {
                    console.log(err);
                } else {
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    comment.save();
                    holyground.comments.push(comment);
                    holyground.save();
                    res.redirect("/holygrounds/" + holyground._id);
                }
            });
        }
    });
});


router.get("/:comment_id/edit", function (req, res) {
    Comment.findOne({_id: req.params.comment_id}, function (err, foundComment) {
        if (err) {
            res.redirect("back");
        } else {
            res.render("comments/edit", {holyground_id: req.params.id, comment: foundComment});
        }
    });
});

router.put("/:comment_id", function (req, res) {
    Comment.findOneAndUpdate({_id: req.params.comment_id}, req.body.comment, function (err, updatedComment) {
        if (err) {
            res.redirect("back");
        } else {
            res.redirect('/holygrounds/' + req.params.id);
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