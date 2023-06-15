const mongoose = require('mongoose');
const User = require("./user");
const Problem = require("./problem");
const {Schema} = mongoose;

const commentSchema = Schema({
    comment: {
        type: String,
        minlength: 1
    },
    author : {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    time: {
        type: Date,
        default: Date.now
    },
    upvotes: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    ]
})

const contestSchema = Schema({
    name: {
        type: String,
        required: [true, 'Contest name cannot be left blank']
    },
    number: {
        type: Number,
        required: [true, 'Contest number is required'],
    },
    authors: [{
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    registrations: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    problems: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Problem'
        }
    ],
    editorial: {
        type: String,
        default: ""
    },
    announcement: {
        type: String,
        default: ""
    },
    startsAt: {
        type: Date,
        required: [true, 'Date and time of contest is required']
    },
    endsAt: {
        type: Date,
    },
    // running: {
    //     type: Boolean,
    //     default: false
    // },
    duration: {
        type: Number, //  in minutes
        required: [true, 'Duration of contest is required']
    },
    upvotes: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    comments: [commentSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    leaderBoard: [
        {
            participant: {
                type: Schema.Types.ObjectId,
                ref: 'User'
            },
            submissions: [
                {
                    type: mongoose.Schema.Types.Mixed,
                }
            ],
        }
    ]
})

const Contest = mongoose.model('Contest', contestSchema);
module.exports = Contest;