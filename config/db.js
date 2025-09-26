//Importing the mongoose module
const mongoose = require("mongoose");

const connectURL = "mongodb+srv://ririshikesh2005:rishi2005@cluster0.gxmk1re.mongodb.net/EDMS?retryWrites=true&w=majority&appName=Cluster0";

//Connecting to mongodb
const connectDb = async() => {
  try{
    await mongoose.connect(connectURL,{
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("Connected to MongoDB successfully");
    console.log("Connected to DB:", mongoose.connection.name);
  }
  catch(err){
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
}

module.exports = connectDb;