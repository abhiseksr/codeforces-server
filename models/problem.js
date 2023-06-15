const mongoose  = require("mongoose");
const Contest = require("./contest");
const User = require("./user");
const {Schema} = mongoose;

const tagSchema = Schema({
    type: [String],
    enum: ['greedy', 'dp', 'trees', 'graphs', 'number theory',
    'maths', 'brute force', 'implementation', 'backtracking', 'dsu',
    'data structures', 'binary search', 'combinatorics', 'sortings',
    'strings', 'two pointers', 'bitmasks', 'probabilities'],
    default: []
})

const solutionSchema = Schema({
    language: Number,
    content: String
})


const problemSchema = Schema({
    code: { // problem A,B,etc
        type: String,
        required: [true, 'Problem code cannot be blank']
    },
    name: {
        type: String,
        required: [true, 'Problem name cannot be blank']
    },
    timeLimit: {
        type: Number,
        default: 2000,
    },
    spaceLimit: {
        type: Number,
        default: 256
    },
    expectedOutput: {
        type: String,
        required: [true, "expectedOutput is required"]
    },
    sampleOutput: {
        type: String,
        required: [true, "sampleOutput is required"]
    },
    sampleInput: {
        type: String,
        required: [true, "sampleInput is required"]
    },
    tests: {
        type: String,
        required: [true, "tests is required"]
    },
    authorID: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    legend: {
        type: String,
        required: [true, 'Problem description cannot be blank']
    },
    inputFormat: {
        type: String,
    },
    outputFormat: {
        type: String,
    },
    notes: {
        type: String,
    },
    contestID: {
        type: Schema.Types.ObjectId,
        ref: 'Contest'
    },
    scoreDecreaseRate:{
        type: Number, // per minute
        required: [true, "scoreDecreaseRate is required"]
    },
    difficulty: {
        type: Number,
    },
    scores: {
        type: Number,
        required: [true, 'Maximum points for the problem is required']
    },
    submissions: {
        type: Number,
        default: 0
    },
    tags:{
        tagSchema
    },
    solution: {
        type: solutionSchema,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    modifiedAt: {
        type: Date,
        default: Date.now
    }
})

const Problem = mongoose.model('Problem', problemSchema);
module.exports = Problem;