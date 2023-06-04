const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Contest = require('../models/contest');
const Problem = require('../models/problem');
const {authenticateToken} = require('./auth');
const { updateLastActive } = require('./user');

const checkAccountType = async function(req, res, next){
    try{
        if (!req.user) res.send('user not logged in');
        const {username, accountType} = req.user;
        if (accountType!='organiser') res.send(`${username} user is not an organiser`);
        return next();
    }
    catch(err){
        console.log(err);
    }
}

router.use(express.urlencoded({extended: true}));
router.use(express.json());

router.post('/contest', authenticateToken, updateLastActive, checkAccountType, async(req,res)=>{
    try{
        let {authors} = req.body;
        // console.log(req.body);
        let user = await User.findOne({username: 'abhishek'});
        // console.log(user);
        let tempAuthors = [];
        for (let author of authors) {
            const user = await User.findOne({username: author});
            console.log(author);
            if (user.accountType=='organiser')
            tempAuthors.push(user._id);
        };
        authors = tempAuthors;
        req.body.authors = authors;
        // console.log(authors);
        const contest = new Contest(req.body);
        // console.log(contest.startsAt);
        // console.log(Date.now());
        // console.log(contest.createdAt);
        // console.log(req.body);
        contest.endsAt = contest.startsAt.getTime() + contest.duration*60*1000;
        await contest.save();
        // console.log(contest);
        for (let author of authors) {
            user = await User.findById(author)  
            if (user.accountType=='organiser'){
                user.contests.push(contest._id);
                await user.save();
            }
        };
        res.send('contest created successfully');
    }
    catch(err){
        console.log(err);
    }
})

// GET contest/problems
// POST contest/problem

router.get('/contest/:contestID', authenticateToken, updateLastActive, checkAccountType, async(req,res)=>{
    try{
        const {contestID} = req.params;
        // if (req.user.accountType!='organiser') return next();
        const contest = await Contest.findById(contestID).populate('problems');
        res.json({problems: contest.problems, contestID});
    }
    catch(err){
        console.log(err);
    }
})

router.get('/contest/:contestID/problem', authenticateToken, updateLastActive, checkAccountType, async(req,res)=>{
    try{
        const {contestID} = req.params;
        res.json({contestID});
    }
    catch(err){
        console.log(err);
    }
});

router.post('/contest/:contestID/problem', authenticateToken, updateLastActive, checkAccountType, async(req,res)=>{
    try{
        const {contestID} = req.params;
        const problem = new Problem(req.body);
        const user = await User.findOne({username: req.user.username});
        const contest = await Contest.findById(contestID);
        problem.authorID = user._id;
        problem.contestID = contestID;
        await problem.save();
        contest.problems.push(contest._id);
        await contest.save();
        res.send('problem added successfully');
    }
    catch(err){
        console.log(err);
    }
});


router.get('/contest/:contestID/register', authenticateToken, updateLastActive, async(req, res)=>{
    try{
        const {contestID} = req.params;
        if (req.user.accountType!='contestant') return res.send('you are not a contestant');
        const contest = await Contest.findById(contestID);
        const user = await User.findOne({username: req.user.username});
        if (Date.now()>contest.startsAt) return res.send('contest is already started! cannot register.');
        if (contest.registrations.includes(user._id)) return res.send("user already registered");
        contest.registrations.push(user._id);
        const tempObj = {participant: user._id, submissions: []};
        contest.leaderBoard.push(tempObj);
        user.contests.push(contest._id);
        await contest.save();
        await user.save();
        res.send("successfully registered");
    }
    catch(err){
        console.log(err);
    }
})

router.get('/contests', updateLastActive, async(req, res)=>{
    try{
        const historyContests = await Contest.find({startsAt: {$lt: Date.now()}});
        const upcommingContests = await Contest.find({startsAt: {$gte: Date.now()}});
        res.json({historyContests, upcommingContests});
    }
    catch(err){
        console.log(err);
    }
})

router.get('/contest/enter/:contestID', authenticateToken, updateLastActive, async(req, res)=>{
    try{
        const {contestID} = req.params;
        const contest = await Contest.findById(contestID);
        res.json(contest);
    }
    catch(err){
        console.log(err);
    }
});

// editorial

router.get('/contest/:contestID/editorial', updateLastActive, async(req, res)=>{
    try{
        const {contestID} = req.params;
        const contest = await Contest.findById(contestID);
        res.json({editorial: contest.editorial});
    }
    catch(err){
        console.log(err);
    }
})

router.put('/contest/:contestID/editorial', authenticateToken, updateLastActive, checkAccountType, async(req,res)=>{
    try{
        const {contestID} = req.params;
        const contest = await Contest.findById(contestID);
        const user = await User.findOne({username: req.user.username});
        if (!contest.authors.includes(user._id)) return res.send("organiser is not listed in contest authors")
        await Contest.findByIdAndUpdate(contestID, {editorial: req.body.editorial});
        res.send("editorial edited successfully");
    }
    catch(err){
        console.log(err);
    }
})

// announcement

router.get('/contest/:contestID/announcement', updateLastActive, async(req,res)=>{
    try{
        const {contestID} = req.params;
        const contest = await Contest.findById(contestID);
        res.json({announcement: contest.announcement});
    }
    catch(err){
        console.log(err);
    }
})

router.put('/contest/:contestID/announcement', authenticateToken, updateLastActive, checkAccountType, async(req,res)=>{
    try{
        const {contestID} = req.params;
        const contest = await Contest.findById(contestID);
        const user = await User.findOne({username: req.user.username});
        if (!contest.authors.includes(user._id)) return res.send("organiser is not listed in contest authors")
        await Contest.findByIdAndUpdate(contestID, {announcement: req.body.announcement});
        res.send("announcement edited successfully");
    }
    catch(err){
        console.log(err);
    }
})
//################################################## UNCHECKED

module.exports = {contestRouter: router, checkAccountType};