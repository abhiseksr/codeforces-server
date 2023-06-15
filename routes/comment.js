const express = require('express');
require('dotenv').config();
const router = express.Router();
const User = require('../models/user');
const Contest = require('../models/contest');
const Problem = require('../models/problem');
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



router.post('/contest/:contestId/comment', authenticateToken, updateLastActive, async(req, res, next)=>{
    try{
        const {contestId} = req.params;
        const {comment} = req.body;
        const contest = await Contest.findById(contestId);
        const user = await User.findOne({username: req.user.username});
        const objectId = new mongoose.Types.ObjectId()
        contest.comments.push({comment, author: user._id, _id: objectId});
        user.comments.push({comment, author: user._id, contestId, _id: objectId});
        await contest.save();
        await user.save();
        res.send(`${user.username} commented`);
    }
    catch(err){
        return next(err);
    }
})

router.get('/contest/:contestId/comment/:commentId/upvote', authenticateToken, updateLastActive, async(req, res,next)=>{
    try{
        const {contestId, commentId} = req.params;
        const contest = await Contest.findById(contestId);
        const user = await User.findOne({username: req.user.username});
        // throw new AppError("helloerror", 403);   
        contest.comments.forEach(comment=>{
            if (String(comment._id)==String(commentId)){
                if (!comment.upvotes.includes(user._id)) {
                    comment.upvotes.push(user._id);
                }
            }
        })
        await contest.save();
        res.send('upvoted');
    }
    catch(err){
        return next(err);
    }
})

router.get('/contest/:contestId/comment/:commentId/delete', authenticateToken, updateLastActive, async(req, res)=>{
    const {contestId, commentId} = req.params;
    const contest = await Contest.findById(contestId);
    const user = await User.findOne({username: req.user.username});
    const comment = contest.comments.find(com=> {
        if (String(com._id)==String(commentId))
        return String(com.author)==String(user._id)
        return false;
    });
    if (!comment) return res.send('you are not author of the comment');
    let newContestComments = contest.comments.filter((com)=>{
        if (String(com._id)==String(commentId)) return false;
        return true;
    })
    let newUserComments = user.comments.filter((com)=>{
        if (String(com._id)==String(commentId)) return false;
        return true;
    })
    user.comments = newUserComments;
    contest.comments = newContestComments;
    await user.save();
    await contest.save();
    res.send('comment deleted');
})

module.exports = {
    commentRouter: router
};
