const mongoose = require('mongoose');
const Contest = require("./contest");
const Problem = require("./problem");
const {Schema} = mongoose;

const messageSchema = Schema({
    message: {
        type: String,
        minlength: 1
    },
    author : {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    recipient : {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    time: {
        type: Date,
        default: Date.now
    },
})

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
    contestId: {
        type: Schema.Types.ObjectId,
        ref: 'Contest'
    }
})

const userSchema = Schema({
    name: {
        type: String
    },
    username: {
        type: String,
        required: true,
        unique: true,
        validate: {
          validator: function (value) {
            return /^[a-zA-Z0-9_]+$/.test(value);
          },
          message: 'Username can only contain alphanumeric characters and underscores'
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    email: {
        type: String,
        required: true,
        unique: false,
        validate: {
          validator: function (value) {
            return /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(value);
          },
          message: 'Invalid email address'
        }
    },
    accountType: {
        type: String,
        default: 'contestant',
        enum: ['contestant', 'organiser'],
    },
    contests: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Contest'
        }
    ],
    country: {
        type: String,
        default: ''
    },
    city: {
        type: String,
        default: ''
    },
    organisation: {
        type: String,
        default: ''
    },
    birthDate: {
        type: Date,
        default: Date.now
    },
    messages: [messageSchema],
    seenNotificationsCount: {
        type: Number,
        default : 0
    },
    favourites: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Problem'
        }
    ],
    following: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    followers: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    submissions: [
        {
            type: mongoose.Schema.Types.Mixed
        }
    ],
    comments: [commentSchema],
    online: {
        type: Boolean,
        default: true
    },
    lastActive: {
        type: Date,
        default: Date.now
    },
    registeredAt: {
        type: Date,
        default: Date.now
    }
})

const User = mongoose.model('User', userSchema);
module.exports = User;