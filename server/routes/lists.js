const express = require('express');
const router = express.Router({ mergeParams: true });
const {
    getLists,
    createList,
    updateList,
    deleteList,
} = require('../controllers/listController');
const { protect } = require('../middleware/authMiddleware');

// /api/boards/:boardId/lists
router.route('/')
    .get(protect, getLists)
    .post(protect, createList);

// /api/lists/:id
router.route('/:id')
    .put(protect, updateList)
    .delete(protect, deleteList);

module.exports = router;
