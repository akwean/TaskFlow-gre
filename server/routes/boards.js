const express = require('express');
const router = express.Router();
const {
    getBoards,
    getBoard,
    createBoard,
    updateBoard,
    deleteBoard,
    addBoardMember,
    removeBoardMember,
} = require('../controllers/boardController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getBoards)
    .post(protect, createBoard);

router.route('/:id')
    .get(protect, getBoard)
    .put(protect, updateBoard)
    .delete(protect, deleteBoard);

router.route('/:id/members')
    .post(protect, addBoardMember);

router.route('/:id/members/:userId')
    .delete(protect, removeBoardMember);

module.exports = router;
