const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Contest = require('../models/contest');
const Problem = require('../models/problem');
const {authenticateToken} = require('./auth');

const updateLastActive = async function (req, res, next){
    try{
        if (!req.user) return next();
        const {username} = req.user;
        const user = await User.findOne({username});
        user.lastActive = Date.now();
        await user.save();
        return next();
    }
    catch(err){
        console.log(err, "this is updateLastActive function");
    }
}

const intervalTime = 20*1000;

const runInterval = ()=>{
    setInterval(()=>{
        updateOnlineStatus();
    }, intervalTime);
}

const updateOnlineStatus = async function(){
    try{
        console.log('in updateOnlineStatus');
        await Contest.updateMany({$and: [{startsAt: {$lte: Date.now()}}, {endsAt: {$gte: Date.now()}}]}, {$set: {running: true}}); 
        await Contest.updateMany({$or: [{startsAt: {$gt: Date.now()}}, {endsAt: {$lt: Date.now()}}]}, {$set: {running: false}}); 
        await User.updateMany(
            {lastActive: {$lt : Date.now()-5*60*1000}},
            {$set: {online: false}}
        );
        await User.updateMany(
            {lastActive: {$gt : Date.now()-5*60*1000}},
            {$set: {online: true}}
        );
    }
    catch(err){
        console.log(err);
    }
}

router.use(express.urlencoded({extended: true}));
router.use(express.json());


router.get('/profile/:username', async (req, res)=>{
    try{
        const {username} = req.params;
        const user = await User.findOne({username});
        if (!user) throw new Error('user does not exist');
        console.log(user);
        const {name, email, accountType, country, city, organisation, birthDate, followers, online} = user;
        res.json({name, username, email, accountType, country, city, organisation, birthDate, followers: followers.length, online});
    }
    catch(err){
        console.log(err);
    }
})

router.get('/friends', authenticateToken, updateLastActive, async (req, res)=>{
    try{
        const {username} = req.user;
        const user = await User.findOne({username});
        if (!user) throw new Error('user not logged in');
        res.json({following: user.following});
    }
    catch(err){
        console.log(err);
    }
})

router.get('/submissions/:username', async(req, res)=>{
    try{
        const {username} = req.params;
        const user = await User.findOne({username}).populate('submissions');
        if (!user) throw new Error('user does not exist');
        res.json({submissions: user.submissions});
    }
    catch(err){
        console.log(err);
    }
})

router.get('/contests/:username', async(req, res)=>{
    try{
        const {username} = req.params;
        const user = await User.findOne({username}).populate('contests');
        if (!user) throw new Error('user does not exist');
        res.json({contests: user.contests});
    }
    catch(err){
        console.log(err);
    }
})

router.get('/favourites', authenticateToken, updateLastActive, async(req, res)=>{
    try{
        const {username} = req.user;
        if (!username) throw new Error('user not logged in');
        const user = await User.findOne({username}).populate('favourites');
        if (!user) throw new Error('user does not exist');
        res.json({favourites: user.favourites});
    }
    catch(err){
        console.log(err);
    }
})

router.get('/settings', authenticateToken, updateLastActive, async(req,res)=>{
    try{
        const {username} = req.user;
        if (!username) throw new Error('user not logged in');
        const user = await User.findOne({username});
        if (!user) throw new Error('user does not exist');
        const {name, city, organisation, country, birthDate} = user;
        res.json({name, city, organisation, country, birthDate});
    }
    catch(err){
        console.log(err);
    }
})

router.put('/settings', authenticateToken, updateLastActive, async(req, res)=>{
    try{
        const {username} = req.user;
        const {name, city, organisation, country, birthDate} = req.body;
        if (!username) throw new Error('user not logged in');
        const user = await User.findOne({username});
        if (!user) throw new Error('user does not exist');
        await User.findOneAndUpdate({username}, {name, city, organisation, country, birthDate}, {runValidators: true});
        res.json({'status': 'successfully updated settings'});
    }
    catch(err){
        console.log(err);
    }
})

module.exports = {userRouter: router, updateOnlineStatus, runInterval, updateLastActive};