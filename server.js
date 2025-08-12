const express = require('express');
const app = express();
const path = require('path');

app.use(express.json())

const PORT = 3000;
app.use(express.static(__dirname))

app.get('/',(req,res)=>{
    res.sendFile(path.join(__dirname,'index.html'));
});

app.listen(PORT,()=>{
    console.log(`Server running at http://localhost:${PORT}`);
})

app.post('/add-teacher',(req,res)=>{
    const receivedData = req.body;
    console.log('Recieved Data: ',receivedData);
    res.json({ message: 'Success' });
})
