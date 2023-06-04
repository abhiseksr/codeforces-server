const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Contest = require('../models/contest');
const Problem = require('../models/problem');
const {authenticateToken} = require('./auth');
const { updateLastActive } = require('./user');
const {checkAccountType} = require("./contest");

router.use(express.urlencoded({extended: true}));
router.use(express.json());

// POST /problem
// GET /problem/:problemID/edit
// PUT /problem/:problemID

router.get('/problem/:problemID/edit', authenticateToken, updateLastActive, checkAccountType, async(req,res)=>{
    try{
        const {problemID} = req.params;
        const problem  = await Problem.findById(problemID);
        res.json(problem);
    }
    catch(err){
        console.log(err);
    }
});

router.put('/problem/:problemID', authenticateToken, updateLastActive, checkAccountType, async(req,res)=>{
    try{
        const {problemID} = req.params;
        if (!problemID) return res.send("problem not found");
        const temp  = await Problem.findByIdAndUpdate(problemID, req.body, {runValidators: true, new: true});
        res.send("problem updated successfully");
    }
    catch(err){
        console.log(err);
    }
});

router.get('/problem/:problemID', updateLastActive, async(req, res)=>{
    try{
        const {problemID} = req.params;
        const problem = await Problem.findById(problemID);
        res.json(problem);
    }
    catch(err){
        console.log(err);
    }
});

module.exports = {problemRouter: router};