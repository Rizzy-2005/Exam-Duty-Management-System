//Importing necessary modules
const express = require("express");
const path = require("path");
const connectDb = require("./config/db");

//Initializing the express app
const app = express();

//Connect to mongodb
connectDb();

//Using different routes and static pages
app.use(express.static(path.join(__dirname, "./public")));

const PORT = 3000;

app.get('/', (req,res) => {
  res.sendFile(path.join(__dirname,"./views/login.html"));
});

app.listen(PORT, (err) => {
  if(err) throw err;
  console.log(`The server has hosted on http://localhost:${PORT}`);
});



