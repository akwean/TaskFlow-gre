const Card = require('../models/Card');
const List = require('../models/List');
const { emitToBoard } = require('../realtime/socket');

// @desc    Get all cards for a list
// @route   GET /api/lists/:listId/cards
// @access  Private
const getCards = async (req, res) => {
    try {
        const cards = await Card.find({ list: req.params.listId })
            .sort('order')
            .populate('members', 'username email avatar')
            .lean();
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
        // Determine board id for realtime broadcast
        const list = await List.findById(req.params.listId);
        if (list) {
            emitToBoard(list.board.toString(), 'card:created', { card });
        }

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
    const { title, description, list, order, labels, members, dueDate, checklists } = req.body;

    try {
        const card = await Card.findById(req.params.id);

        if (!card) {
            return res.status(404).json({ message: 'Card not found' });
        }

        const oldListId = card.list?.toString();
        const newListId = list !== undefined ? list.toString() : oldListId;
        const orderChanged = order !== undefined || list !== undefined;

        // Simple field updates
        if (title !== undefined) card.title = title;
        if (description !== undefined) card.description = description;
        if (labels !== undefined) card.labels = labels;
        if (members !== undefined) card.members = members;
        if (dueDate !== undefined) card.dueDate = dueDate;
        if (checklists !== undefined) card.checklists = checklists;

        // Handle list/order changes with full reordering
        if (orderChanged) {
            const movingBetweenLists = oldListId !== newListId;
            
            if (movingBetweenLists) {
                // Moving to different list: remove from old, insert into new
                // 1. Remove from old list (shift down remaining cards)
                const oldListCards = await Card.find({ list: oldListId, _id: { $ne: card._id } }).sort('order');
                await Promise.all(oldListCards.map((c, i) => Card.findByIdAndUpdate(c._id, { order: i })));

                // 2. Insert into new list at specified position
                card.list = newListId;
                const newListCards = await Card.find({ list: newListId }).sort('order');
                const targetIndex = order !== undefined ? Math.min(order, newListCards.length) : newListCards.length;
                
                // Shift cards at/after insertion point
                await Promise.all(newListCards.map((c, i) => {
                    if (i >= targetIndex) {
                        return Card.findByIdAndUpdate(c._id, { order: i + 1 });
                    }
                    return Promise.resolve();
                }));
                
                card.order = targetIndex;
            } else {
                // Reordering within same list
                const listCards = await Card.find({ list: oldListId, _id: { $ne: card._id } }).sort('order');
                const targetIndex = order !== undefined ? Math.min(order, listCards.length) : listCards.length;
                
                // Renumber all cards to make room at targetIndex
                await Promise.all(listCards.map((c, i) => {
                    if (i >= targetIndex) {
                        return Card.findByIdAndUpdate(c._id, { order: i + 1 });
                    } else {
                        return Card.findByIdAndUpdate(c._id, { order: i });
                    }
                }));
                
                card.order = targetIndex;
            }
        }

        await card.save();

        const updatedCard = await Card.findById(card._id)
            .populate('members', 'username email avatar');

        // Realtime: broadcast update (including potential move across lists)
        let boardId = null;
        try {
            const targetList = await List.findById(updatedCard.list);
            if (targetList) boardId = targetList.board.toString();
        } catch {}
        
        if (boardId) {
            emitToBoard(boardId, 'card:updated', {
                card: updatedCard,
                oldListId,
                newListId: updatedCard.list?.toString(),
            });

            // If order or list changed, broadcast authoritative snapshots
            if (orderChanged) {
                try {
                    const targetListId = updatedCard.list?.toString();
                    if (targetListId) {
                        const targetCards = await Card.find({ list: targetListId })
                            .sort('order')
                            .populate('members', 'username email avatar')
                            .lean();
                        emitToBoard(boardId, 'cards:reordered', { listId: targetListId, cards: targetCards });
                    }
                    if (oldListId && oldListId !== targetListId) {
                        const sourceCards = await Card.find({ list: oldListId })
                            .sort('order')
                            .populate('members', 'username email avatar')
                            .lean();
                        emitToBoard(boardId, 'cards:reordered', { listId: oldListId, cards: sourceCards });
                    }
                } catch (e) {
                    console.error('Failed to emit cards:reordered snapshot:', e);
                }
            }
        }

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

        const list = await List.findById(card.list);
        await Card.findByIdAndDelete(req.params.id);

        // Realtime: notify board listeners
        if (list) {
            emitToBoard(list.board.toString(), 'card:deleted', { cardId: card._id, listId: card.list?.toString() });
        }

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
