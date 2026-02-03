const path = require('path');
const fs = require("fs");

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);

const errorController = require('./controllers/error');
const User = require('./models/user');
const multer = require("multer");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");

const app = express();
require("dotenv").config();

const store = new MongoDBStore({
  uri: process.env.DATABASE_CONFIG,
  collection: "sessions",

})

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require("./routes/auth");
const flash = require("connect-flash");

const imagePath = path.join(__dirname, "image");

if (!fs.existsSync(imagePath)) {
  fs.mkdirSync(imagePath);
}

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imagePath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g,"_"));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "image/png" || file.mimetype === "image/jpg" || file.mimetype === "image/jpeg") {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const accessLogStream = fs.createWriteStream(path.join(__dirname, "access.log"), {flags: "a"});

app.use(helmet());
app.use(compression());
app.use(morgan("combined", {stream: accessLogStream}));



// Parsing is the process of turning one form of data (usually a string of text or numbers or whatever) into a data structure.
app.use(bodyParser.urlencoded({ extended: false }));

app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single("image"));

app.use(express.static(path.join(__dirname, 'public')));

app.use("/image", express.static(path.join(__dirname, "image")))


app.use(session({secret: process.env.SECRET, resave: false, saveUninitialized: false, store: store, cookie: {sameSite: "lax", secure: false}})); 

app.use(flash());

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session?.isLoggedIn || false;
  next();
})

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
  .then(user => {
      if (!user) {
        return next()
      }
      req.user = user;
      console.log("REG>USER:", req.user);
      next();
    })
    .catch((err) => {
      next(new Error(err));
    });
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get("/500", errorController.get500);
app.use(errorController.get404);

// Error handling middleware
app.use((error, req, res, next) => {
  console.log("SERVER-ERROR:", error)
  res.status(500).render('500', {
    pageTitle: 'Server Error!',
    path: '/500',
    isAuthenticated: req.session?.isLoggedIn || false
  });
})

mongoose
  .connect(process.env.DATABASE_CONFIG)
  .then(result => {
  app.listen(process.env.PORT || 3000);
  })
  .catch(err => {
    console.log(err);
  });
