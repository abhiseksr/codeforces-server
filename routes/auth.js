const express = require('express');
const router = express.Router();
require('dotenv').config();
const User = require('../models/user');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const AppError = require("./AppError");

router.use(express.urlencoded({extended: true}));
router.use(express.json());
router.use(cookieParser());

function authenticateToken(req, res, next) {
    // console.log(req.cookies);
    // res.send('hi');
    const {accessToken: token} = req.cookies;
    // console.log(token);
    if (token == null) return res.sendStatus(401)
  
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    //   console.log(err)
      if (err) return next(err);
      req.user = user
      next()
    })
}

function generateAccessToken(user) {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '55m' })
}

async function getHashedPassword(password){
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
}

router.post('/register',async (req,res, next)=>{
    try{
        // console.log(req.body);
        const {username, password, email, accountType = 'contestant'} = req.body;
        const user = new User({username, password: await getHashedPassword(password), email, accountType});
        await user.save();
        const accessToken = generateAccessToken({username, email, accountType});
        res.cookie('accessToken', accessToken);
        res.json({accessToken});
    }
    catch(err){
        // console.log("duplicate");
        next(err);
        // res.send("duplicate person");
    }
})

router.post('/login', async (req, res, next)=>{
    try{
        // console.log(req.body);
        const {username, password}  = req.body;
        const user = await User.findOne({username: username});
        if (!user) throw new AppError('user not found', 404);
        // console.log(user);
        // res.send('hi');
        const verified = await bcrypt.compare(password, user.password);
        if (verified){
            const accessToken = generateAccessToken({username, email: user.email, accountType: user.accountType});
            user.lastActive = Date.now();
            await user.save();
            res.cookie('accessToken', accessToken);
            return res.json({accessToken});
        }
        else{
            throw new AppError("username or password wrong", 401);
            // res.json({'verified': false});
        }
    }
    catch(err){
        return next(err);
    }

})

router.get('/logout', async (req, res, next)=>{
    try{
        res.clearCookie('accessToken');
        req.user = undefined;
        res.send('logged out successfully');
    }
    catch(err){
        return next(err);
    }
})

router.post('/passwordRecovery', async(req, res, next)=>{
    try{
        // console.log(req.body);
        const {username,email} = req.body;
        const user = await User.findOne({email,username});
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
              user: 'abhishekkumartbbt@gmail.com',
              pass: process.env.GMAIL_APP_PASSWORD 
            }
        });
        const accessToken = jwt.sign({username: user.username, email: user.email, accountType: user.accountType}, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '5m' });
        const info = await transporter.sendMail({
            from: 'abhishekkumartbbt@gmail.com',
            to: email,
            subject: 'Password Recovery',
            html: `<p>Click the link below for password recovery:</p><a href="http://localhost:3000/updatePassword/${user._id}/${accessToken}">Click to recover your codeforces account</a>`
        });
        // console.log('Email sent:', info.response);
        res.send('successfully send mail');
    }
    catch(err){
        return next(err);
    }
})

router.patch('/updatePassword/:userId/:accessToken', async(req,res,next)=>{
    try{
        const {userId, accessToken: token} = req.params;
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            // console.log(err)
            if (err) return res.sendStatus(403)
            req.user = user
        })
        const user = await User.findById(userId);
        const {password} = req.body;
        user.password = await getHashedPassword(password);
        await user.save();
        // const accessToken = generateAccessToken({username: user.username, email: user.email, accountType: user.accountType});
        // res.cookie('accessToken', accessToken);
        res.send("updated password");
    }
    catch(err){
        return next(err);
    }
})

router.get('/updatePassword/:userId/:accessToken', async(req,res,next)=>{
    try{
        const {userId, accessToken: token} = req.params;
        res.json({userId, accessToken});
    }
    catch(err){
        return next(err);
    }
})



module.exports = {authRouter: router, authenticateToken};