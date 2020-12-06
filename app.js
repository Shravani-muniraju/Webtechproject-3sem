const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");


const app = express();
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
app.set("view engine","ejs");

app.use(session({
    secret:"Creative Secrets.",
    resave:false,
    saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/gameDB',{useNewUrlParser:true, useUnifiedTopology:true});
mongoose.set('useFindAndModify', false);


const userSchema = new mongoose.Schema({
    username:{type:String,trim:true,default:''},
    password:{type:String,default:''},
    bio:{type:String,default:''},
    score:{type:Number,default:0}
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User',userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
    done(null, user.id);
});
  
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
});





app.get("/signup",(req,res) => {
    res.render("signup");
})

app.post("/signup",(req,res) => {
    User.register({username:req.body.username},req.body.password,function(err,user){
        if(err){
            console.log(err);
            res.redirect("/signup");
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/profile");
            })
        }
    })
});


app.get("/login",(req,res) => {
    res.render("login");
})

app.post("/login",(req,res) => {
    const user = new User({
        username:req.body.username,
        password:req.body.password
    });
    req.login(user,function(err){
        if(!err){
            passport.authenticate("local")(req,res,function(){
                res.redirect("/");
            })
        }
    })
});




app.get("/",(req,res) => {
    if(req.isAuthenticated()){
        res.render("play")
    }else{
        res.redirect("/login");
    }
    
});


app.post("/",(req,res) => {
    const scoreData = Number(req.body.highScore);
    User.findById(req.user.id,function(err,foundUser){
        if(!err){
            foundUser.score = scoreData;
            foundUser.save();
        }
    });
})

app.get("/profile",(req,res) => {
    if(req.isAuthenticated()){
        User.findById(req.user.id,function(err,foundUser){
            if(!err){
                res.render("profile",{user:foundUser});
            }
        })
    }else{
        res.redirect("/login");
    }
});

app.get("/profile/edit",(req,res) => {
    if(req.isAuthenticated()){
        res.render("edit");
    }else{
        res.redirect("/login");
    }
});

app.post("/profile/edit",(req,res) => {
    const editedBio = req.body.bioPara;
    User.findById(req.user.id,function(err,foundUser){
        if(!err){
            foundUser.bio = editedBio;
            foundUser.save(function(){
                res.redirect("/");
            });
        }
    });
})

app.get("/rank",(req,res) => {
    User.find({"score":{$ne:null}},function(err,result){
        if(!err){
            res.render("rank",{profile:result});
        }else{
            console.log(err);
        }
    });
});

app.get("/logout",function(req,res){
    req.logout();
    res.redirect("/");
});



app.listen(3000,function(){
    console.log("Port started on 3000");
});