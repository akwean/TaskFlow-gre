const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    background: {
        type: String,
        default: '#0079bf',
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    members: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        role: {
            type: String,
            enum: ['admin', 'member'],
            default: 'member',
        },
    }],
    visibility: {
        type: String,
        enum: ['private', 'workspace', 'public'],
        default: 'private',
    },
}, {
    timestamps: true,
});

const Board = mongoose.model('Board', boardSchema);

module.exports = Board;
