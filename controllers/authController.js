//Importing the models
const Users = require("../models/userModel");

//functions
exports.login = async (req, res) => {
  const { username, password } = req.body;
  try{
    const user = await Users.findOne({ userId: username });
    if (user && user.password === password) {
    res.json({
        success: true,
        message: 'User Successfully Logged in',
        user: {
            role: user.role
        }
    });
    } else {
    res.status(401).json({
        success: false,
        message: 'Invalid Credentials'
    });
    }
  }
  catch(err){
    console.error("Database error during login:", err.message);
    return res.status(500).json({ success: false, message: "Something went wrong!"});
  }
}
