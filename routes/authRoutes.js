const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));


mongoose.connect('mongodb://localhost:27017/school_db', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((error) => {
    console.error('MongoDB connection error:', error);
});


const patterns = {
    username: /^[a-zA-Z0-9_-]{3,20}$/,
    password: /^.{6,}$/
};


function validateLoginInput(req, res, next) {
    const { username, password } = req.body;
    

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: 'Username and password are required'
        });
    }

    if (!patterns.username.test(username.trim())) {
        return res.status(400).json({
            success: false,
            message: 'Invalid username format'
        });
    }
    
    if (!patterns.password.test(password)) {
        return res.status(400).json({
            success: false,
            message: 'Password must be at least 6 characters'
        });
    }
    
    next();
}


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'))
});

app.post('/login', validateLoginInput, async (req, res) => {
    const { username, password } = req.body;
    
    try {

        const teacher = await Teacher.findOne({ username: username.trim() });
        
        if (teacher && teacher.password === password) {
            res.json({
                success: true,
                message: 'User Successfully Logged in',
                teacher: {
                    id: teacher._id,
                    username: teacher.username,
                    firstName: teacher.firstName,
                    lastName: teacher.lastName,
                    subject: teacher.subject
                }
            });
        } else {
            res.status(401).json({
                success: false,
                message: 'Invalid Credentials'
            });
        }
    } catch (error) {
        console.log('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!'
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});