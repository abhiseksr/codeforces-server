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
const AppError = require('./AppError');

router.use(express.urlencoded({
    extended: true
}));
router.use(express.json());

router.post('/message/:username', authenticateToken, updateLastActive, async(req, res, next)=>{
    try{
        const {username} = req.params;
        const {message} = req.body;
        const user = await User.findOne({username: req.user.username});
        const user2 = await User.findOne({username});
        if (!user2) throw new AppError(`${username} doesn't exist`, 404);
        const objectId = new mongoose.Types.ObjectId()
        const msgObj = {message, author: user._id, recipient: user2._id, _id: objectId};
        user.messages.push(msgObj);
        user2.messages.push(msgObj);
        await user.save();
        await user2.save();
        res.send('message sent');
    }
    catch(err){
        return next(err);
    }
})

router.get('/talks', authenticateToken, updateLastActive, async(req, res, next)=>{
    try{
        const user = await User.findOne({username: req.user.username});
        user.seenNotificationsCount = user.messages.length;
        await user.save();
        let messages = [];
        for (let message of user.messages){
            const author  = await User.findById(message.author);
            const recipient  = await User.findById(message.recipient);
            const tempObj = {};
            tempObj.author = message.author;
            tempObj.recipient = message.recipient;
            tempObj.message = message.message;
            tempObj.time = message.time;
            tempObj.authorName = author.username;
            tempObj.recipientName = recipient.username;
            messages.push(tempObj);
        }
        messages.reverse();
        res.json({talks: messages, username: req.user.username});
    }   
    catch(err){
        return next(err);
    }
})



module.exports = {
    messageRouter: router
};
