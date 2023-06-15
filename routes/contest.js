const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Contest = require('../models/contest');
const Problem = require('../models/problem');
const {authenticateToken} = require('./auth');
const { updateLastActive } = require('./user');
const auth = require('./auth');
const AppError = require('./AppError');

const checkAccountType = async function(req, res, next){
    try{
        if (!req.user) res.send('user not logged in');
        const {username, accountType} = req.user;
        if (accountType!='organiser') throw new AppError('user is not an organiser', 401);
        return next();
    }
    catch(err){
        return next(err);
    }
}

router.use(express.urlencoded({ extended: true, limit: '50mb' }));
router.use(express.json({limit: '50mb'}));

function runAtDate(date, func) {
    var now = (new Date()).getTime();
    var then = date.getTime();
    var diff = Math.max((then - now), 0);
    if (diff > 0x7FFFFFFF) //setTimeout limit is MAX_INT32=(2^31-1)
        setTimeout(function() {runAtDate(date, func);}, 0x7FFFFFFF);
    else
        setTimeout(func, diff);
}

router.get('/contests/organiser', authenticateToken, updateLastActive, checkAccountType, async(req, res, next)=>{
    try{
        const {username} = req.user;
        const user = await User.findOne({username});
        if (!user) throw new AppError("user not logged in", 401);
        let response = [];
        const contests = await Contest.find();
        // console.log(contests);
        for (let contest of contests){
            if (contest.authors.includes(user._id)) response.push(await contest.populate("authors"));
        }
        res.json({contests: response});
    }
    catch(err){
        return next(err);
    }
})

router.post('/contest', authenticateToken, updateLastActive, checkAccountType, async(req,res,next)=>{
    try{
        let {authors} = req.body;
        // console.log(req.body);
        let user = await User.findOne({username: 'abhishek'});
        // console.log(user);
        let tempAuthors = [];
        for (let author of authors) {
            const user = await User.findOne({username: author});
            // console.log(author);
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
        // runAtDate(contest.startsAt, async()=>{
        //     contest.running = true;
        //     await contest.save();
        // })
        // runAtDate(contest.endsAt, async()=>{
        //     contest.running = false;
        //     await contest.save();
        // })
        // setTimeout(async () => {
        //     contest.running = true;
        //     await contest.save();
        // }, contest.startsAt-Date.now());
        // setTimeout(async () => {
        //     contest.running = false;
        //     await contest.save();
        // }, contest.endsAt-Date.now());
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
        return next(err);
    }
})


router.put('/contest/:contestID/edit', authenticateToken, updateLastActive, checkAccountType, async(req,res,next)=>{
    try{
        let {authors} = req.body;
        let {contestID} = req.params;
        let user = await User.findOne({username: 'abhishek'});
        let tempAuthors = [];
        for (let author of authors) {
            const user = await User.findOne({username: author});
            if (user.accountType=='organiser')
            tempAuthors.push(user._id);
        };
        authors = tempAuthors;
        req.body.authors = authors;
        await Contest.findByIdAndUpdate(contestID, req.body);
        const contest = await Contest.findById(contestID);
        contest.endsAt = contest.startsAt.getTime() + contest.duration*60*1000;
        contest.authors = authors;
        // runAtDate(contest.startsAt, async()=>{
        //     contest.running = true;
        //     await contest.save();
        // })
        // runAtDate(contest.endsAt, async()=>{
        //     contest.running = false;
        //     await contest.save();
        // })
        await contest.save();
        for (let author of authors) {
            user = await User.findById(author)  
            if (user.accountType=='organiser'){
                user.contests.push(contest._id);
                await user.save();
            }
        };
        res.send('contest edited successfully');
    }
    catch(err){
        return next(err);
    }
})

// GET contest/problems
// POST contest/problem

router.get('/contest/:contestID', authenticateToken, updateLastActive, checkAccountType, async(req,res,next)=>{
    try{
        const {contestID} = req.params;
        // if (req.user.accountType!='organiser') return next();
        const contest = await Contest.findById(contestID).populate("problems").populate("authors");
        res.json({contest});
    }
    catch(err){
        return next(err);
    }
})

router.get('/contest/:contestID/problem', authenticateToken, updateLastActive, checkAccountType, async(req,res,next)=>{
    try{
        const {contestID} = req.params;
        res.json({contestID});
    }
    catch(err){
        return next(err);
    }
});

router.post('/contest/:contestID/problem', authenticateToken, updateLastActive, checkAccountType, async(req,res,next)=>{
    try{
        const {contestID} = req.params;
        const problem = new Problem(req.body);
        const user = await User.findOne({username: req.user.username});
        const contest = await Contest.findById(contestID);
        problem.authorID = user._id;
        problem.contestID = contestID;
        await problem.save();
        await Problem.findByIdAndUpdate(problem._id, {tags: req.body.tags});
        contest.problems.push(problem._id);
        await contest.save();
        res.send('problem added successfully');
    }
    catch(err){
        return next(err);
    }
});


router.get('/contest/:contestID/register', authenticateToken, updateLastActive, async(req, res,next)=>{
    try{
        const {contestID} = req.params;
        if (req.user.accountType!='contestant') throw new AppError('you are not a contestant',500);
        const contest = await Contest.findById(contestID);
        const user = await User.findOne({username: req.user.username});
        if (Date.now()>contest.startsAt) throw new AppError('contest is already started! cannot register.', 500);
        if (contest.registrations.includes(user._id)) throw new AppError("user already registered", 500);
        contest.registrations.push(user._id);
        const tempObj = {participant: user._id, submissions: []};
        contest.leaderBoard.push(tempObj);
        user.contests.push(contest._id);
        await contest.save();
        await user.save();
        res.send("successfully registered");
    }
    catch(err){
        return next(err);
    }
})

router.get('/allContests', authenticateToken, updateLastActive, async(req, res, next)=>{
    try{
        const historyContests = await Contest.find({startsAt: {$lt: Date.now()}});
        const upcommingContests = await Contest.find({startsAt: {$gte: Date.now()}});
        let history = [], upcomming = [];
        for (let contest of historyContests){
            let populatedContest = await contest.populate("authors");
            history.push(populatedContest); 
        }
        history.sort((a,b)=>a.startsAt-b.startsAt);
        for (let contest of upcommingContests){
            let populatedContest = await contest.populate("authors");
            upcomming.push(populatedContest); 
        }
        upcomming.sort((a,b)=>a.startsAt-b.startsAt);
        res.json({historyContests : history, upcommingContests : upcomming});
    }
    catch(err){
        return next(err);
    }
})

router.get('/contest/:contestID/enter', authenticateToken, updateLastActive, async(req, res, next)=>{
    try{
        const {contestID} = req.params;
        const contest = await Contest.findById(contestID).populate("problems");
        let problems = contest.problems;
        contest.problems = [];
        if (contest.startsAt>=Date.now())
        return res.json({contest,problems:[]});
        problems.sort((a,b)=> a.code-b.code);
        return res.json({contest,problems});
    }
    catch(err){
        return next(err);
    }
});

// editorial

router.get('/contest/:contestID/editorial', updateLastActive, async(req, res,next)=>{
    try{
        const {contestID} = req.params;
        const contest = await Contest.findById(contestID);
        res.json({editorial: contest.editorial});
    }
    catch(err){
        return next(err);
    }
})

router.put('/contest/:contestID/editorial', authenticateToken, updateLastActive, checkAccountType, async(req,res,next)=>{
    try{
        const {contestID} = req.params;
        const contest = await Contest.findById(contestID);
        const user = await User.findOne({username: req.user.username});
        if (!contest.authors.includes(user._id)) return res.send("organiser is not listed in contest authors")
        await Contest.findByIdAndUpdate(contestID, {editorial: req.body.editorial});
        res.send("editorial edited successfully");
    }
    catch(err){
        return next(err);
    }
})

// announcement

router.get('/contest/:contestID/announcement', updateLastActive, async(req,res,next)=>{
    try{
        const {contestID} = req.params;
        const contest = await Contest.findById(contestID);
        let usernames = [];
        for (let comment of contest.comments){
            const user = await User.findById(comment.author);
            usernames.push(user.username);

        }
        res.json({contest, usernames});
    }
    catch(err){
        return next(err);
    }
})

router.put('/contest/:contestID/announcement', authenticateToken, updateLastActive, checkAccountType, async(req,res,next)=>{
    try{
        const {contestID} = req.params;
        const contest = await Contest.findById(contestID);
        const user = await User.findOne({username: req.user.username});
        if (!contest.authors.includes(user._id)) return res.send("organiser is not listed in contest authors")
        await Contest.findByIdAndUpdate(contestID, {announcement: req.body.announcement});
        res.send("announcement edited successfully");
    }
    catch(err){
        return next(err);
    }
})


router.get('/contest/:contestID/upvote', authenticateToken, updateLastActive, async(req, res, next)=>{
    try{
        const {contestID} = req.params;
        const contest = await Contest.findById(contestID);
        const user = await User.findOne({username: req.user.username});
        if (contest.upvotes.includes(user._id)) return res.send("already upvoted");
        contest.upvotes.push(user._id);
        await contest.save();
        return res.send("upvoted");
    }
    catch(err){
        return next(err);
    }
});

router.get('/contest/:contestID/standings', authenticateToken, updateLastActive, async(req, res,next)=>{
    try{
        const {contestID} = req.params;
        const contest = await Contest.findById(contestID);
        let standings = [];
        const leaderBoard = contest.leaderBoard;
        for (let user of leaderBoard){
            const usr = await User.findById(user.participant);
            let obj = {acceptedCount: 0, points: 0, username: usr.username, userId: user.participant};
            for (let submission of user.submissions){
                const problem = await Problem.findById(submission.problemId);
                // console.log(problem);
                if (submission.status.id==3){
                    obj.acceptedCount = obj.acceptedCount + 1;
                    // console.log(problem.scores, Date.now()-contest.startsAt, problem.scoreDecreaseRate, submission.created_at);
                    obj.points = obj.points + Math.max(300, problem.scores-((new Date(submission.created_at).getTime()-contest.startsAt.getTime())/60000)*problem.scoreDecreaseRate);
                }
            }
            standings.push(obj);
        }
        // console.log(standings);
        standings.sort((a,b)=>{
            if (a.acceptedCount==b.acceptedCount) return b.points - a.points;
            return b.acceptedCount - a.acceptedCount;
        })
        // console.log(standings);
        res.json({standings});
    }
    catch(err){
        return next(err);
    }
})



//################################################## UNCHECKED
module.exports = {contestRouter: router, checkAccountType};