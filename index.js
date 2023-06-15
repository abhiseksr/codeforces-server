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

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000'); // Replace with your React client's domain and port
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true'); // If you need to include cookies in cross-origin requests
  
    next();
  });
// app.use(cors());
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
    next(err);
})

app.use('/api', authRouter);
app.use('/api', userRouter);
app.use('/api', contestRouter);
app.use('/api', problemRouter);
app.use('/api', submissionRouter);
app.use('/api', messageRouter);
app.use('/api', commentRouter);
app.use(methodOverride('_method'));


app.use((err, req, res, next)=>{
    // console.log("hello");
    const {status = 500, message="something went wrong"} = err;
    res.status(status).send(message);
})

const PORT = process.env.PORT || 4000;

app.listen(PORT, ()=>{
    console.log(`Listening on Port ${PORT}`);
})