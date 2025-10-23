//Importing the models
const Users = require("../models/userModel");

//functions
exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await Users.findOne({ userId: username });
    if (user && user.password === password) {
      req.session.user = {
        id: user._id,
        name: user.name,
        role: user.role,
        department: user.department
      };
      
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ 
            success: false, 
            message: 'Failed to create session' 
          });
        }
        
        console.log('✅ Session saved successfully:', req.session.user);
        console.log('Session ID:', req.sessionID);
        
        res.json({
          success: true,
          message: 'User Successfully Logged in',
          role: user.role,
          userId: user._id,
          userName: user.name, 
        });
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid Credentials'
      });
    }
  } catch (err) {
    console.error("Database error during login:", err.message);
    return res.status(500).json({ 
      success: false, 
      message: "Something went wrong!"
    });
  }
}