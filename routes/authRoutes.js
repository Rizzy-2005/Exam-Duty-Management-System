const Teacher = require('./models/teacherModel');


function validateLoginInput(req, res, next) {
    const { username, password } = req.body;

    if (!username?.trim() || !password) {
        return res.status(400).json({
            success: false,
            message: 'Username and password are required'
        });
    }

    req.body.username = username.trim();
    next();
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.post('/login', validateLoginInput, async (req, res, next) => {
    const { username, password } = req.body;

    try {
        const teacher = await Teacher.findOne({ username });

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
        next(error);
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
