const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Contest = require('../models/contest');
const Problem = require('../models/problem');
const {authenticateToken} = require('./auth');
const { updateLastActive } = require('./user');
const {checkAccountType} = require("./contest");
const AppError = require('./AppError');

router.use(express.urlencoded({extended: true}));
router.use(express.json());

// POST /problem
// GET /problem/:problemID/edit
// PUT /problem/:problemID

router.get('/problem/:problemID/edit', authenticateToken, updateLastActive, checkAccountType, async(req,res,next)=>{
    try{
        const {problemID} = req.params;
        const problem  = await Problem.findById(problemID);
        res.json(problem);
    }
    catch(err){
        return next(err);
    }
});

router.get('/problem/:problemId/addToFavourites', authenticateToken, updateLastActive, async(req, res, next)=>{
    try{
        const {problemId} = req.params;
        const {username} = req.user;
        const user = await User.findOne({username});
        const problem = await Problem.findById(problemId);
        if (user.favourites.includes(problem._id))  throw new AppError("problem already in favourites", 403);
        user.favourites.push(problem._id);
        await user.save();
        res.send("added to favourites");
    }
    catch(err){
        return next(err);
    }
})

router.put('/problem/:problemID', authenticateToken, updateLastActive, checkAccountType, async(req,res, next)=>{
    try{
        const {problemID} = req.params;
        if (!problemID) return res.send("problem not found");
        const temp  = await Problem.findByIdAndUpdate(problemID, req.body, {runValidators: true, new: true});
        res.send("problem updated successfully");
    }
    catch(err){
        return next(err);
    }
});

router.get('/problem/:problemID', authenticateToken, updateLastActive, async(req, res, next)=>{
    try{
        const {problemID} = req.params;
        const problem = await Problem.findById(problemID);
        res.json({problem, username: req.user.username});
    }
    catch(err){
        return next(err);
    }
});

router.get("/problems", authenticateToken, updateLastActive, async(req, res, next)=>{
    try{
        const problems = await Problem.find();
        let response = [];
        // console.log(problems.length);
        for (let problem of problems){
            const populatedProblem = await problem.populate("contestID");
            if (populatedProblem.contestID.startsAt<Date.now()) response.push(populatedProblem);
        }
        res.json({problems: response});
    }
    catch(err){
        return next(err);
    }
})

module.exports = {problemRouter: router};