const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');

const PORT = 3000;

//Connect to MongoDB
/*mongoose.connect('mongodb://localhost:27017/yourDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});*/

//Define Teacher schema and model
const teacherSchema = new mongoose.Schema({
  teacherid: { type: String, required: true, unique: true }}, 
  { collection: 'teacher' }); 

const Teacher = mongoose.model('Teacher', teacherSchema);

app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html')); //loading the default page
});

app.post('/add-teacher', async (req, res) => {
  try {
    const receivedData = req.body;
    const teacherId = receivedData['teacherid'];
    console.log('Received teacherId:', teacherId);

    //Check if teacher already exists
    const existingRecord = await Teacher.findOne({ teacherid: teacherId });

    if (existingRecord) {
      //Teacher exists, send error response
      return res.status(400).json({ message: 'Teacher already exists' });
    }

    //Teacher does not exist, create new
    const newTeacher = new Teacher(receivedData);
    await newTeacher.save();

    res.json({ message: 'Teacher added successfully' });
  } catch (error) {
    console.error('Error adding teacher:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
