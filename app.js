//Importing necessary modules
const express = require("express");
const session = require("express-session");
const cors = require("cors");
const path = require("path");
const connectDb = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const coeRoutes = require("./routes/coeRoutes");
const teachRoutes = require("./routes/teacherRoutes");
const reqRoutes = require('./routes/requestRoutes');

//Initializing the express app
const app = express();
app.use(express.json());
app.use(cors({
  origin: "http://localhost:3000", // React frontend URL
  credentials: true
}));

//Initializing the session
app.use(session({
    secret: "exam-duty",  // replace with a secure secret
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60, // 1 hour
        httpOnly: true,
        secure: false // true only if using HTTPS
    }
}));

//Connect to mongodb
connectDb();

//Using different routes and static pages
app.use(express.static(path.join(__dirname, "./views")));
app.use('/login', authRoutes);
app.use('/coe', coeRoutes);
app.use('/teacher',teachRoutes);
app.use('/requests',reqRoutes);

const PORT = 5000;

app.get('/coeHome', (req,res) => {
  res.redirect("/coeHome.html");
});

app.get('/teacherHome', (req,res) => {
  res.redirect("/home.html");
});

app.listen(PORT, (err) => {
  if(err) throw err;
  console.log(`The server has hosted on http://localhost:${PORT}`);
});



