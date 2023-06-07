const express = require('express');
require('dotenv').config();
const app = express();
const path = require('path');
const {authRouter, authenticateToken} = require('./routes/auth');
const {contestRouter} = require("./routes/contest");
const {problemRouter} = require("./routes/problem");
const {submissionRouter} = require("./routes/submission");
const {messageRouter} = require("./routes/message");
const {commentRouter} = require("./routes/comment");
const {userRouter, runInterval, updateLastActive} = require('./routes/user');
const methodOverride = require("method-override");
const cors = require("cors");
const mongoose = require('mongoose');
const User = require('./models/user');

mongoose.connect('mongodb://localhost:27017/codeforces',{
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(()=>{
    runInterval();
    console.log("CONNECTION OPEN");
})  
.catch((err)=>{
    console.log("ERROR! NO DATABASE CONNECTION");
    console.log(err);
})

app.use('/api', authRouter);
app.use('/api', userRouter);
app.use('/api', contestRouter);
app.use('/api', problemRouter);
app.use('/api', submissionRouter);
app.use('/api', messageRouter);
app.use('/api', commentRouter);
app.use(cors());
app.use(methodOverride('_method'));

app.get('/api/dummy', authenticateToken, updateLastActive , (req,res)=>{
    res.json({'message': 'hello'});
})

const PORT = process.env.PORT || 4000;

app.listen(PORT, ()=>{
    console.log(`Listening on Port ${PORT}`);
})