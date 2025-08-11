//Importing necessary modules
const express = require("express");
const path = require("path");
const connectDb = require("./config/db");

//Initializing the express app
const app = express();

//connect to mongodb
connectDb();

const PORT = 3000;

app.listen(PORT, (err) => {
  if(err) throw err;
  console.log(`The server has hosted on http://localhost:${PORT}`);
});



