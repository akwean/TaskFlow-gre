const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        default: '',
    },
    list: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'List',
        required: true,
    },
    order: {
        type: Number,
        required: true,
    },
    labels: [{
        name: String,
        color: String,
    }],
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    dueDate: {
        type: Date,
    },
    attachments: [{
        name: String,
        url: String,
    }],
    checklists: [{
        title: {
            type: String,
            required: true,
        },
        items: [{
            text: {
                type: String,
                required: true,
            },
            completed: {
                type: Boolean,
                default: false,
            },
        }],
    }],
}, {
    timestamps: true,
});

const Card = mongoose.model('Card', cardSchema);

module.exports = Card;
