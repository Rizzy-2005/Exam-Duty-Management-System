//Importing necessary modules
const express = require("express");
const path = require("path");
const connectDb = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const coeRoutes = require("./routes/coeRoutes");
const teachRoutes = require("./routes/teacherRoutes");

//Initializing the express app
const app = express();
app.use(express.json());

//Connect to mongodb
connectDb();

//Using different routes and static pages
app.use(express.static(path.join(__dirname, "./views")));
app.use('/login', authRoutes);
app.use('/coe', coeRoutes);
app.use('/teacher',teachRoutes);

const PORT = 3000;

app.get('/', (req,res) => {
  res.redirect("/login.html");
});

app.listen(PORT, (err) => {
  if(err) throw err;
  console.log(`The server has hosted on http://localhost:${PORT}`);
});



