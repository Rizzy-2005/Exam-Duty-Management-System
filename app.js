//Importing necessary modules
const express = require("express");
const session = require("express-session");
const cors = require("cors");
const path = require("path");

//Importing user-defined modules
const connectDb = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const coeRoutes = require("./routes/coeRoutes");
const teachRoutes = require("./routes/teacherRoutes");
const reqRoutes = require('./routes/requestRoutes');
const checkSession = require('./middlewares/authMiddleware');

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
app.use('/coe', checkSession, coeRoutes);
app.use('/teacher',checkSession, teachRoutes);
app.use('/requests',reqRoutes);

const PORT = 5000;

app.get('/coeHome', checkSession, (req,res) => {
  res.redirect("/coeHome copy.html");
});

app.get('/teacherHome', checkSession, (req,res) => {
  res.redirect("/home.html");
});

//Error-handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  const msg = err.message || "Something went wrong";

  if (req.headers.accept?.includes("application/json")) {
    return res.status(status).json({ success: false, message: msg });
  }

  res.status(status).send(`
    <div style="font-family:sans-serif;text-align:center;padding:50px;">
      <h1 style="color:red;">Error ${status}</h1>
      <p>${msg}</p>
      <p>Path: ${req.originalUrl}</p>
      <p>${new Date().toLocaleString()}</p>
    </div>
  `);
});


app.listen(PORT, (err) => {
  if(err) throw err;
  console.log(`The server has hosted on http://localhost:${PORT}`);
});



