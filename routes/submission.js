const express = require('express');
require('dotenv').config();
const router = express.Router();
const User = require('../models/user');
const Contest = require('../models/contest');
const Problem = require('../models/problem');
const axios = require('axios');
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

const judge = async function (solution, language, expectedOutput, tests, timeLimit, spaceLimit) {

    const options = {
        method: 'POST',
        url: 'https://judge0-ce.p.rapidapi.com/submissions',
        params: {
            base64_encoded: 'true',
            fields: '*'
        },
        headers: {
            'content-type': 'application/json',
            'Content-Type': 'application/json',
            'X-RapidAPI-Key': process.env.RAPID_API_KEY,
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        },
        data: {
            language_id: language,
            source_code: Buffer.from(solution).toString('base64'),
            stdin: Buffer.from(tests).toString('base64'),
            expected_output: Buffer.from(expectedOutput).toString('base64'),
            cpu_time_limit: timeLimit / 1000,
            memory_limit: 1024 * spaceLimit,
        }
    };

    try {
        const response = await axios.request(options);
        console.log(response.data);
        return response.data.token;
    } catch (error) {
        console.error(error);
    }
}

const verdicts = async function (token) {
    const options = {
        method: 'GET',
        url: `https://judge0-ce.p.rapidapi.com/submissions/${token}`,
        params: {
            base64_encoded: 'true',
            fields: '*'
        },
        headers: {
            'X-RapidAPI-Key': process.env.RAPID_API_KEY,
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        }
    };

    try {
        const response = await axios.request(options);
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.error(error);
    }
}

router.post('/submission/:problemId', authenticateToken, updateLastActive, async (req, res) => {
    try {
        const {
            problemId
        } = req.params;
        const {
            solution,
            language
        } = req.body;
        const problem = await Problem.findById(problemId);
        const token = await judge(solution, language, problem.expectedOutput, problem.tests, problem.timeLimit, problem.spaceLimit);
        const verdict = await verdicts(token);
        // console.log(Buffer.from(verdict.stdout, 'base64').toString('utf8'));
        const user = await User.findOne({username: req.user.username});
        if (verdict.status.id==3)
        problem.submissions = problem.submissions + 1;
        await problem.save();
        // submit only running is true
        // console.log('hi');
        const contest = await Contest.findById(problem.contestID);
        if (contest.registrations.includes(user._id) && contest.running){
            let isProblemAlreadyAccepted = false;
            isProblemAlreadyAccepted = user.submissions.some((element) => {
                // return false;
                return String(element.problemId) == String(problem._id);
            });
            // console.log(isProblemAlreadyAccepted);
            // console.log(user._id);
            if (!isProblemAlreadyAccepted || verdict.status.id!=3){
                contest.leaderBoard.forEach(ele=>{
                    // console.log("checking");
                    // console.log(ele);
                    if (String(ele.participant)==String(user._id)){
                        // console.log("pushing in submissions");
                        ele.submissions.push({problemId: problem._id, ...verdict});
                    }
                });
                await contest.save();
            }
        }
        user.submissions.push({problemId: problem._id, ...verdict});
        await user.save();
        res.json(verdict);
    }
    catch(err){
        console.log(err);
    }
})

router.post('/submission/:problemId/verdict', authenticateToken, updateLastActive, async (req, res)=>{
    try{
        const {
            problemId
        } = req.params;
        const {
            solution,
            language
        } = req.body;
        const problem = await Problem.findById(problemId);
        const token = await judge(solution, language, problem.expectedOutput, problem.tests, problem.timeLimit, problem.spaceLimit);
        const verdict = await verdicts(token);
        return res.json(verdict);
    }
    catch(err){
        console.log(err);
    }
})

module.exports = {
    submissionRouter: router
};