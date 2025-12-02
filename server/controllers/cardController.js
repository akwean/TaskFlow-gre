const Card = require('../models/Card');

// @desc    Get all cards for a list
// @route   GET /api/lists/:listId/cards
// @access  Private
const getCards = async (req, res) => {
    try {
        const cards = await Card.find({ list: req.params.listId })
            .sort('order')
            .populate('members', 'username email avatar');
        res.json(cards);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create new card
// @route   POST /api/lists/:listId/cards
// @access  Private
const createCard = async (req, res) => {
    const { title } = req.body;

    try {
        // Get the highest order number
        const lastCard = await Card.findOne({ list: req.params.listId }).sort('-order');
        const order = lastCard ? lastCard.order + 1 : 0;

        const card = await Card.create({
            title,
            list: req.params.listId,
            order,
        });

        res.status(201).json(card);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update card
// @route   PUT /api/cards/:id
// @access  Private
const updateCard = async (req, res) => {
    const { title, description, list, order, labels, members, dueDate } = req.body;

    try {
        const card = await Card.findById(req.params.id);

        if (!card) {
            return res.status(404).json({ message: 'Card not found' });
        }

        if (title !== undefined) card.title = title;
        if (description !== undefined) card.description = description;
        if (list !== undefined) card.list = list;
        if (order !== undefined) card.order = order;
        if (labels !== undefined) card.labels = labels;
        if (members !== undefined) card.members = members;
        if (dueDate !== undefined) card.dueDate = dueDate;

        await card.save();

        const updatedCard = await Card.findById(card._id)
            .populate('members', 'username email avatar');

        res.json(updatedCard);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete card
// @route   DELETE /api/cards/:id
// @access  Private
const deleteCard = async (req, res) => {
    try {
        const card = await Card.findById(req.params.id);

        if (!card) {
            return res.status(404).json({ message: 'Card not found' });
        }

        await Card.findByIdAndDelete(req.params.id);
        res.json({ message: 'Card removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getCards,
    createCard,
    updateCard,
    deleteCard,
};
