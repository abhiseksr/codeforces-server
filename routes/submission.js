const express = require('express');
require('dotenv').config();
const router = express.Router();
const User = require('../models/user');
const Contest = require('../models/contest');
const Problem = require('../models/problem');
const axios = require('axios');
const performPlagiarismCheck = require("./PlagCheck");
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

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const judge = async function (solution, language, expectedOutput, tests, timeLimit, spaceLimit) {

    const options = {
        method: 'POST',
        url: 'https://judge0-ce.p.rapidapi.com/submissions',
        params: {
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
            source_code: solution,
            stdin: tests,
            expected_output: expectedOutput,
            cpu_time_limit: timeLimit / 1000,
            memory_limit: 1024 * spaceLimit,
        }
    };

    try {
        const response = await axios.request(options);
        // console.log(response.data);
        return response.data.token;
    } catch (error) {
        console.log(error);
    }
}

const verdicts = async function (token) {
    const options = {
        method: 'GET',
        url: `https://judge0-ce.p.rapidapi.com/submissions/${token}`,
        params: {
            // base64_encoded: 'true',
            fields: '*'
        },
        headers: {
            'X-RapidAPI-Key': process.env.RAPID_API_KEY,
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        }
    };

    try {
        const response = await axios.request(options);
        // console.log(response.data);
        return response.data;
    } catch (error) {
        // console.error(error);
    }
}

router.post('/submission/:problemId', authenticateToken, updateLastActive, async (req, res, next) => {
    try {
        const {
            problemId
        } = req.params;
        const {
            solution,
            language
        } = req.body;
        // console.log(req.body);
        const problem = await Problem.findById(problemId);
        const token = await judge(solution, language, problem.expectedOutput, problem.tests, problem.timeLimit, problem.spaceLimit);
        await delay(5000);
        let verdict = await verdicts(token);
        if (!verdict) verdict = { created_at: new Date(), status_id: 6, status: { id: 6, description: "Compilation Error" }, language: { id: 53, name: "C++ (GCC 8.3.0)" } };
        const contest = await Contest.findById(problem.contestID);
        const user = await User.findOne({ username: req.user.username });
        // console.log(Buffer.from(verdict.stdout, 'base64').toString('utf8'));
        // console.log(token);
        if (contest.registrations.includes(user._id))
            for (let person of contest.leaderBoard) {
                // console.log(person.participant);
                for (let submission of person.submissions) {
                    if (!submission.hasOwnProperty("source_code")) continue;
                    // console.log(performPlagiarismCheck(solution, submission.source_code));
                    // console.log(person.participant, user._id, verdict.status.id);
                    // console.log(submission.problemId);
                    if ((String(person.participant) !== String(user._id) && verdict.status.id == 3) && performPlagiarismCheck(solution, submission.source_code) > 0.9) {
                        // console.log("hi");
                        verdict.status.id = -1, verdict.status.description = "Plagiarised", verdict.status_id = -1;
                        // break;
                    }
                }
            }
        // console.log(verdict);
        if (verdict.status.id == 3)
            problem.submissions = problem.submissions + 1;
        await problem.save();
        // console.log(verdict);
        // submit only running is true
        // console.log('hi');
        if (contest.registrations.includes(user._id) && contest.startsAt <= Date.now() && contest.endsAt >= Date.now()) {
            let isProblemAlreadyAccepted = false;
            isProblemAlreadyAccepted = user.submissions.some((element) => {
                // return false;
                return ((String(element.problemId) == String(problem._id)) && element.status_id == 3);
            });
            // console.log(isProblemAlreadyAccepted);
            // console.log(user._id);
            if (!isProblemAlreadyAccepted || verdict.status.id != 3) {
                contest.leaderBoard.forEach(ele => {
                    // console.log("checking");
                    // console.log(ele);
                    if (String(ele.participant) == String(user._id)) {
                        // console.log("pushing in submissions");
                        ele.submissions.push({ problemId: problem._id, ...verdict });
                    }
                });
                await contest.save();
            }
        }
        user.submissions.push({ problemId: problem._id, ...verdict });
        await user.save();
        // console.log(verdict);
        res.json(verdict);
    }
    catch (err) {
        // console.error(err);
        return next(err);
    }
})

router.get('/submissions/:username', authenticateToken, updateLastActive, async (req, res, next) => {
    try {
        // console.log("in submissons");
        const { username } = req.params;
        const user = await User.findOne({ username });
        let problems = [];
        for (let submission of user.submissions) {
            const problem = await Problem.findById(submission.problemId);
            problems.push(problem);
        }
        let verdicts = user.submissions;
        verdicts.reverse();
        problems.reverse();
        res.json({ problems, verdicts });
    }
    catch (err) {
        return next(err);
    }
})


module.exports = {
    submissionRouter: router
};