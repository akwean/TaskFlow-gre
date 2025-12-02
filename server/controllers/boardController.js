const Board = require('../models/Board');
const List = require('../models/List');
const Card = require('../models/Card');
const User = require('../models/User');

// @desc    Get all boards for user
// @route   GET /api/boards
// @access  Private
const getBoards = async (req, res) => {
    try {
        const boards = await Board.find({
            $or: [
                { owner: req.user._id },
                { 'members.user': req.user._id }
            ]
        }).populate('owner', 'username email avatar')
            .populate('members.user', 'username email avatar');

        res.json(boards);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get single board
// @route   GET /api/boards/:id
// @access  Private
const getBoard = async (req, res) => {
    try {
        const board = await Board.findById(req.params.id)
            .populate('owner', 'username email avatar')
            .populate('members.user', 'username email avatar');

        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }

        // Check if user has access
        const hasAccess = board.owner._id.toString() === req.user._id.toString() ||
            board.members.some(m => m.user._id.toString() === req.user._id.toString());

        if (!hasAccess) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(board);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create new board
// @route   POST /api/boards
// @access  Private
const createBoard = async (req, res) => {
    const { title, background } = req.body;

    try {
        const board = await Board.create({
            title,
            background: background || '#0079bf',
            owner: req.user._id,
            members: [{
                user: req.user._id,
                role: 'admin'
            }]
        });

        const populatedBoard = await Board.findById(board._id)
            .populate('owner', 'username email avatar')
            .populate('members.user', 'username email avatar');

        res.status(201).json(populatedBoard);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update board
// @route   PUT /api/boards/:id
// @access  Private
const updateBoard = async (req, res) => {
    const { title, background, visibility } = req.body;

    try {
        const board = await Board.findById(req.params.id);

        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }

        // Check if user is owner or admin
        const isAdmin = board.owner.toString() === req.user._id.toString() ||
            board.members.some(m => m.user.toString() === req.user._id.toString() && m.role === 'admin');

        if (!isAdmin) {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (title) board.title = title;
        if (background) board.background = background;
        if (visibility) board.visibility = visibility;

        await board.save();

        const updatedBoard = await Board.findById(board._id)
            .populate('owner', 'username email avatar')
            .populate('members.user', 'username email avatar');

        res.json(updatedBoard);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete board
// @route   DELETE /api/boards/:id
// @access  Private
const deleteBoard = async (req, res) => {
    try {
        const board = await Board.findById(req.params.id);

        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }

        // Only owner can delete
        if (board.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only owner can delete board' });
        }

        // Delete all lists and cards associated with this board
        const lists = await List.find({ board: req.params.id });
        const listIds = lists.map(list => list._id);
        await Card.deleteMany({ list: { $in: listIds } });
        await List.deleteMany({ board: req.params.id });

        await Board.findByIdAndDelete(req.params.id);

        res.json({ message: 'Board removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Add member to board
// @route   POST /api/boards/:id/members
// @access  Private
const addBoardMember = async (req, res) => {
    const { email } = req.body;

    try {
        const board = await Board.findById(req.params.id);

        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }

        // Check if user is owner or admin
        const isAdmin = board.owner.toString() === req.user._id.toString() ||
            board.members.some(m => m.user.toString() === req.user._id.toString() && m.role === 'admin');

        if (!isAdmin) {
            return res.status(403).json({ message: 'Only admins can add members' });
        }

        // Find user by email
        const userToAdd = await User.findOne({ email });

        if (!userToAdd) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if user is already a member
        const alreadyMember = board.members.some(m => m.user.toString() === userToAdd._id.toString());

        if (alreadyMember) {
            return res.status(400).json({ message: 'User is already a member' });
        }

        board.members.push({
            user: userToAdd._id,
            role: 'member'
        });

        await board.save();

        const updatedBoard = await Board.findById(board._id)
            .populate('owner', 'username email avatar')
            .populate('members.user', 'username email avatar');

        res.json(updatedBoard);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Remove member from board
// @route   DELETE /api/boards/:id/members/:userId
// @access  Private
const removeBoardMember = async (req, res) => {
    try {
        const board = await Board.findById(req.params.id);

        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }

        // Check if user is owner or admin
        const isAdmin = board.owner.toString() === req.user._id.toString() ||
            board.members.some(m => m.user.toString() === req.user._id.toString() && m.role === 'admin');

        if (!isAdmin) {
            return res.status(403).json({ message: 'Only admins can remove members' });
        }

        // Can't remove the owner
        if (req.params.userId === board.owner.toString()) {
            return res.status(400).json({ message: 'Cannot remove board owner' });
        }

        board.members = board.members.filter(m => m.user.toString() !== req.params.userId);

        await board.save();

        const updatedBoard = await Board.findById(board._id)
            .populate('owner', 'username email avatar')
            .populate('members.user', 'username email avatar');

        res.json(updatedBoard);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getBoards,
    getBoard,
    createBoard,
    updateBoard,
    deleteBoard,
    addBoardMember,
    removeBoardMember,
};
