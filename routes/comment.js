const express = require('express');
require('dotenv').config();
const router = express.Router();
const User = require('../models/user');
const Contest = require('../models/contest');
const Problem = require('../models/problem');
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



module.exports = {
    commentRouter: router
};
