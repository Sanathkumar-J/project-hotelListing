// if(process.env.NODE_ENV != "production"){ //we are in developing state so we use it if we are in deploying or production state we won't use this
require('dotenv').config(); 
// }

console.log(process.env.secret);

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const async = require("./utils/wrapAsync.js"); 
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require('connect-mongo'); //this should be after express-session every time
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js")

const listingRouter =  require("./routes/listing.js");
const reviewsRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");


const dbUrl = process.env.ATLASDB_URL

main()
    .then(()=>{
        console.log("connected to DB");
    })
    .catch((err)=>{
        console.log(err); 
    })

async function main() {
    await mongoose.connect(dbUrl);
}

app.set("view engine","ejs");
app.set("views", path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto:{
        secret:process.env.SECRET,         
    },
    touchAfter:24*3600, //interval between session updates
});

store.on("error",()=>{
    console.log("Error in MONGO session Store",err);
});  

const sessionOptions = {
    store,
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized: true,
    cookie:{
        expires: Date.now()+ 7*24*60*60*1000,//no.ofmilliseconds for expiration of cookies
        maxAge :7*24*60*60*1000,
        httpOnly:true, 
    }
}


app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
})

app.get("/demouser",async(req,res) =>{
   let fakeUser = new User ({
    email:"usr@gmail.com",
    username:"delta-student",
   })

   let registerdUser = await User.register(fakeUser,"helloworld"); //user,password
   res.send(registerdUser);
})

app.use("/listings",listingRouter); 
app.use("/listings/:id/reviews",reviewsRouter);
app.use("/",userRouter);


app.all("*",(req,res,next) => {
    next(new ExpressError(404,"PAGE NOT FOUND!!"));
})

//Middlewear
app.use((err,req,res,next)=>{
    let{statusCode=500,message="FUCK U BITCH!!"} = err;
    res.status(statusCode).render("error.ejs",{message});
    // res.status(statusCode).send(message);
})
  
app.listen(8080,(req,res) => {
    console.log("Server is listening to port",8080);
}) 