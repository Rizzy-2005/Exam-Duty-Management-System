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

//CORS configuration - MUST come BEFORE session
const allowedOrigins = ['http://localhost:3000', 'http://localhost:5000'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like Postman, mobile apps, or same-origin)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

//Initializing the session
app.use(session({
    secret: "exam-duty",  
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60, // 1 hour
        httpOnly: true,
        secure: false, // true only if using HTTPS
        sameSite: 'lax' // IMPORTANT: Add this for cross-origin
    }
}));

//Connect to mongodb
connectDb();

//API routes
app.use('/login', authRoutes);
app.use('/coe', checkSession, coeRoutes);
app.use('/teacher', checkSession, teachRoutes);
app.use('/requests', reqRoutes);

//Serving view files
app.use(express.static(path.join(__dirname, "./views")));

//HTML page routes frrom react
app.get('/coeHome', checkSession, (req, res) => {
  res.sendFile(path.join(__dirname, "./views/coeHome copy.html"));
});

app.get('/teacherHome', checkSession, (req, res) => {
  res.sendFile(path.join(__dirname, "./views/home.html"));
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

const PORT = 5000;

app.listen(PORT, (err) => {
  if(err) throw err;
  console.log(`The server has hosted on http://localhost:${PORT}`);
});