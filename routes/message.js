const express = require('express');
require('dotenv').config();
const router = express.Router();
const User = require('../models/user');
const Contest = require('../models/contest');
const Problem = require('../models/problem');
const axios = require('axios');
const mongoose = require('mongoose');
const {
    authenticateToken
} = require('./auth');
const {
    updateLastActive
} = require('./user');
const {
    checkAccountType
} = require("./contest");
const {
    verify
} = require('jsonwebtoken');

router.use(express.urlencoded({
    extended: true
}));
router.use(express.json());

router.post('/message/:username', authenticateToken, updateLastActive, async(req, res)=>{
    try{
        const {username} = req.params;
        const {message} = req.body;
        const user = await User.findOne({username: req.user.username});
        const user2 = await User.findOne({username});
        if (!user2) return res.send(`${username} doesn't exist`);
        const objectId = new mongoose.Types.ObjectId()
        const msgObj = {message, author: user._id, recipient: user2._id, _id: objectId};
        user.messages.push(msgObj);
        user2.messages.push(msgObj);
        await user.save();
        await user2.save();
        res.send('message sent');
    }
    catch(err){
        console.log(err);
    }
})

router.get('/talks', authenticateToken, updateLastActive, async(req, res)=>{
    try{
        const user = await User.findOne({username: req.user.username});
        user.seenNotificationsCount = user.messages.length;
        await user.save();
        res.json({messages: user.messages});
    }   
    catch(err){
        console.log(err);
    }
})



module.exports = {
    messageRouter: router
};
