const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Contest = require('../models/contest');
const Problem = require('../models/problem');
const {authenticateToken} = require('./auth');
const AppError = require('./AppError');
const auth = require('./auth');

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
        return next(err);
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
        // console.log('in updateOnlineStatus');
        // await Contest.updateMany({$and: [{startsAt: {$lte: Date.now()}}, {endsAt: {$gte: Date.now()}}]}, {$set: {running: true}}); 
        // await Contest.updateMany({$or: [{startsAt: {$gt: Date.now()}}, {endsAt: {$lt: Date.now()}}]}, {$set: {running: false}}); 
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


router.get("/profile/liveUser", authenticateToken, updateLastActive, async(req, res, next)=>{
    try{    
        const {username} = req.user;
        // console.log("helelelel");
        const user = await User.findOne({username});
        res.json({liveUser: user.username, unseenNotifications: user.messages.length-user.seenNotificationsCount, accountType: user.accountType});
    }   
    catch(err){
        return next(err);
    }
})
router.get('/profile/:username', authenticateToken, updateLastActive, async (req, res,next)=>{
    try{
        const {username} = req.params;
        const user = await User.findOne({username});
        if (!user) throw new Error('user does not exist');
        let liveUser = req.user.username;
        let accountType2 = await User.findOne({username: liveUser}).accountType;
        const {name, email, accountType, country, city, registeredAt, lastActive, organisation, birthDate, followers, following, online} = user;
        res.json({liveUser, name, username, email, accountType, accountType2, registeredAt, lastActive, friends: following.length, country, city, organisation, birthDate, followers: followers.length, online});
    }
    catch(err){
        return next(err);
    }
})

router.get('/multisearch/:query', authenticateToken, updateLastActive, async(req, res, next)=>{
    try{
        const {query} = req.params;
        let list = [];
        const users = await User.find({username: {$regex: query, $options: 'i'}});
        for (let user of users){
            list.push({type: 'User', title: user.username, id: user._id});
        }
        const contests = await Contest.find({name: {$regex: query, $options: 'i'}});
        for (let contest of contests){
            list.push({type: 'Contest', title: `${contest.name} #${contest.number}`, id: contest._id});
        }
        const problems = await Problem.find({name: {$regex: query, $options: 'i'}});
        for (let problem of problems){
            list.push({type: 'Problem', title: `${problem.code}. ${problem.name}`, id: problem._id});
        }
        res.json({list});
    }
    catch(err){
        return next(err);
    }
})

router.get('/friends', authenticateToken, updateLastActive, async (req, res,next)=>{
    try{
        const {username} = req.user;
        const user = await User.findOne({username}).populate("following");
        if (!user) throw new Error('user not logged in');
        res.json({following: user.following});
    }
    catch(err){
        return next(err);
    }
})

router.get('/profile/:username/addFriend', authenticateToken, updateLastActive, async(req,res,next)=>{
    try{
        const {username: username1} = req.user;
        const {username: username2} = req.params;
        const user1 = await User.findOne({username: username1});
        const user2 = await User.findOne({username: username2})
        if (!user1.following.includes(user2._id) && user1.username!==user2.username){
            console.log(user1, user2);
            user1.following.push(user2);
            user2.followers.push(user1);
            await user1.save();
            await user2.save();
        }
        else{
            throw new AppError("user already in friend or you can't friend yourself", 403);
        }
        res.send("added to friend list");
    }
    catch(err){
        return next(err);
    }
})

router.get('/contests', authenticateToken, updateLastActive, async(req, res, next)=>{
    try{
        const {username} = req.user;
        const user = await User.findOne({username});
        if (!user) throw new Error('user does not exist');
        let response = [];
        for (let contestID of user.contests){
            const contest = await Contest.findById(contestID);
            // console.log(contest);
            for (let usr of contest.leaderBoard){
                if (String(usr.participant)==String(user._id)){
                    let acceptedCount = 0;
                    for (let submission of usr.submissions)
                    if (submission.status.id==3) acceptedCount = acceptedCount + 1;

                    response.push({name: contest.name, contestId: contestID, acceptedCount});
                }
            }
        }
        // console.log(response[0].name);
        res.json({contests: response});
    }
    catch(err){
        return next(err);
    }
})

router.get('/favourites', authenticateToken, updateLastActive, async(req, res ,next)=>{
    try{
        const {username} = req.user;
        if (!username) throw new Error('user not logged in');
        const user = await User.findOne({username}).populate('favourites');
        if (!user) throw new Error('user does not exist');
        res.json({favourites: user.favourites});
    }
    catch(err){
        return next(err);
    }
})

router.get('/', authenticateToken, updateLastActive, async(req, res, next)=>{
    try{
        const contests = await Contest.find({endsAt: {$gt: Date.now()}}).sort({startsAt: 1});
        let response = [];
        for (let contest of contests){
            let {name, number, announcement, _id, upvotes, comments, startsAt} = contest;
            response.push({name, number, announcement, _id, upvotes: upvotes.length, comments: comments.length, startsAt});
        }
        res.json({contests: response});
    }
    catch(err){
        return  next(err);
    }
})

router.get('/settings', authenticateToken, updateLastActive, async(req,res,next)=>{
    try{
        const {username} = req.user;
        if (!username) throw new Error('user not logged in');
        const user = await User.findOne({username});
        if (!user) throw new Error('user does not exist');
        const {name, city, organisation, country, birthDate} = user;
        res.json({name, city, organisation, country, birthDate});
    }
    catch(err){
        // console.log(err);
        return next(err);
    }
})

router.put('/settings', authenticateToken, updateLastActive, async(req, res, next)=>{
    try{
        const {username} = req.user;
        console.log("hello");
        const {name, city, organisation, country, birthDate} = req.body;
        if (!username) throw new Error('user not logged in');
        const user = await User.findOne({username});
        if (!user) throw new Error('user does not exist');
        await User.findOneAndUpdate({username}, {name, city, organisation, country, birthDate}, {runValidators: true});
        res.json({'status': 'successfully updated settings'});
    }
    catch(err){
        console.log(err);
        return next(err);
    }
})

// #################################UNCHECKED

router.get('/comments/:username', authenticateToken, updateLastActive, async(req, res,next)=>{
    try{
        const {username} = req.params;
        const user = await User.findOne({username});
        if (!user) return res.send('user not found');
        res.json({comments: user.comments});
    }
    catch(err){
        return next(err);
    }
})

module.exports = {userRouter: router, updateOnlineStatus, runInterval, updateLastActive};