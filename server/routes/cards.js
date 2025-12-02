const express = require('express');
const router = express.Router({ mergeParams: true });
const {
    getCards,
    createCard,
    updateCard,
    deleteCard,
} = require('../controllers/cardController');
const { protect } = require('../middleware/authMiddleware');

// /api/lists/:listId/cards
router.route('/')
    .get(protect, getCards)
    .post(protect, createCard);

// /api/cards/:id
router.route('/:id')
    .put(protect, updateCard)
    .delete(protect, deleteCard);

module.exports = router;
