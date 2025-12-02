const List = require('../models/List');
const Card = require('../models/Card');
const Board = require('../models/Board');

// @desc    Get all lists for a board
// @route   GET /api/boards/:boardId/lists
// @access  Private
const getLists = async (req, res) => {
    try {
        const lists = await List.find({ board: req.params.boardId }).sort('order');
        res.json(lists);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create new list
// @route   POST /api/boards/:boardId/lists
// @access  Private
const createList = async (req, res) => {
    const { title } = req.body;

    try {
        // Get the highest order number
        const lastList = await List.findOne({ board: req.params.boardId }).sort('-order');
        const order = lastList ? lastList.order + 1 : 0;

        const list = await List.create({
            title,
            board: req.params.boardId,
            order,
        });

        res.status(201).json(list);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update list
// @route   PUT /api/lists/:id
// @access  Private
const updateList = async (req, res) => {
    const { title, order } = req.body;

    try {
        const list = await List.findById(req.params.id);

        if (!list) {
            return res.status(404).json({ message: 'List not found' });
        }

        if (title !== undefined) list.title = title;
        if (order !== undefined) list.order = order;

        await list.save();
        res.json(list);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete list
// @route   DELETE /api/lists/:id
// @access  Private
const deleteList = async (req, res) => {
    try {
        const list = await List.findById(req.params.id);

        if (!list) {
            return res.status(404).json({ message: 'List not found' });
        }

        // Delete all cards in this list
        await Card.deleteMany({ list: req.params.id });
        await List.findByIdAndDelete(req.params.id);

        res.json({ message: 'List removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getLists,
    createList,
    updateList,
    deleteList,
};
