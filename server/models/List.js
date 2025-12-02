const mongoose = require('mongoose');

const listSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    board: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Board',
        required: true,
    },
    order: {
        type: Number,
        required: true,
    },
}, {
    timestamps: true,
});

const List = mongoose.model('List', listSchema);

module.exports = List;
