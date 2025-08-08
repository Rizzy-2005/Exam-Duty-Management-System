const express = require('express')
const cors = required('cors')
const path = required('path')

const app = express()
const PORT = 3000

app.use(cors())


//Mongoose Code



app.post('/login', async (req , res) =>{
    const {username,password} = req.body

    

    try{

        const user = await teacher.findOne({username});

        if(user && user.password == password){
            res.json({success: true, message: 'User Successfully Logged in'});
        }else{
            res.status(401).json({success:false,message:'Invalid Credentials'})
        }
    }catch(error){
        console.log('Login error: ',error)
        res.status(500).json({success: false, message: 'Server not found'})
    }


});


app.listen(PORT,()=>{
    console.log(`Server is Running on https://localhost:&{PORT}`);
})