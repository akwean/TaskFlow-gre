const Card = require("../models/Card");
const List = require("../models/List");
const { emitToBoard } = require("../realtime/socket");

// @desc    Get all cards for a list
// @route   GET /api/lists/:listId/cards
// @access  Private
const getCards = async (req, res) => {
    try {
        const cards = await Card.find({ list: req.params.listId })
            .sort("order")
            .populate("members", "username email avatar")
            .lean();
        res.json(cards);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Create new card
// @route   POST /api/lists/:listId/cards
// @access  Private
const createCard = async (req, res) => {
    const { title } = req.body;

    try {
        // Get the highest order number
        const lastCard = await Card.findOne({ list: req.params.listId }).sort(
            "-order",
        );
        const order = lastCard ? lastCard.order + 1 : 0;

        const card = await Card.create({
            title,
            list: req.params.listId,
            order,
        });
        // Determine board id for realtime broadcast
        const list = await List.findById(req.params.listId);

        if (list) {
            emitToBoard(list.board.toString(), "card:created", {
                card,
                user: req.user && {
                    id: req.user._id,
                    username: req.user.username,
                    email: req.user.email,
                    avatar: req.user.avatar,
                },
            });
        }

        res.status(201).json(card);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Update card
// @route   PUT /api/cards/:id
// @access  Private
const updateCard = async (req, res) => {
    const {
        title,
        description,
        list,
        order,
        labels,
        members,
        dueDate,
        checklists,
    } = req.body;

    // Only log if checklists is missing or malformed
    if (
        req.body.checklists !== undefined &&
        !Array.isArray(req.body.checklists)
    ) {
        console.warn(
            "Malformed checklists payload:",
            req.body.checklists,
            "Full payload:",
            req.body,
        );
    }

    try {
        // Find the card first to get old list/order for reordering logic
        const card = await Card.findById(req.params.id);
        if (!card) {
            return res.status(404).json({ message: "Card not found" });
        }

        const oldListId = card.list?.toString();
        const newListId = list !== undefined ? list.toString() : oldListId;
        const orderChanged = order !== undefined || list !== undefined;

        let updatedFields = {};
        if (title !== undefined) updatedFields.title = title;
        if (description !== undefined) updatedFields.description = description;
        if (labels !== undefined) updatedFields.labels = labels;
        if (members !== undefined) updatedFields.members = members;
        if (dueDate !== undefined) updatedFields.dueDate = dueDate;
        if (checklists !== undefined) updatedFields.checklists = checklists;

        // Handle list/order changes with full reordering
        if (orderChanged) {
            const movingBetweenLists = oldListId !== newListId;

            if (movingBetweenLists) {
                // Remove from old list (shift down remaining cards)
                const oldListCards = await Card.find({
                    list: oldListId,
                    _id: { $ne: card._id },
                }).sort("order");
                await Promise.all(
                    oldListCards.map((c, i) =>
                        Card.findByIdAndUpdate(c._id, { order: i }),
                    ),
                );

                // Insert into new list at specified position
                updatedFields.list = newListId;
                const newListCards = await Card.find({ list: newListId }).sort(
                    "order",
                );
                const targetIndex =
                    order !== undefined
                        ? Math.min(order, newListCards.length)
                        : newListCards.length;

                // Shift cards at/after insertion point
                await Promise.all(
                    newListCards.map((c, i) => {
                        if (i >= targetIndex) {
                            return Card.findByIdAndUpdate(c._id, {
                                order: i + 1,
                            });
                        }
                        return Promise.resolve();
                    }),
                );

                updatedFields.order = targetIndex;
            } else {
                // Reordering within same list
                const listCards = await Card.find({
                    list: oldListId,
                    _id: { $ne: card._id },
                }).sort("order");
                const targetIndex =
                    order !== undefined
                        ? Math.min(order, listCards.length)
                        : listCards.length;

                // Renumber all cards to make room at targetIndex
                await Promise.all(
                    listCards.map((c, i) => {
                        if (i >= targetIndex) {
                            return Card.findByIdAndUpdate(c._id, {
                                order: i + 1,
                            });
                        } else {
                            return Card.findByIdAndUpdate(c._id, { order: i });
                        }
                    }),
                );

                updatedFields.order = targetIndex;
            }
        }

        // Atomic update to avoid VersionError
        const updatedCard = await Card.findByIdAndUpdate(
            req.params.id,
            { $set: updatedFields },
            { new: true, runValidators: true },
        ).populate("members", "username email avatar");

        // Realtime: broadcast update (including potential move across lists)
        let boardId = null;
        try {
            const targetList = await List.findById(updatedCard.list);
            if (targetList) boardId = targetList.board.toString();
        } catch {}

        if (boardId) {
            emitToBoard(boardId, "card:updated", {
                card: updatedCard,
                oldListId,
                newListId: updatedCard.list?.toString(),
                user: req.user && {
                    id: req.user._id,
                    username: req.user.username,
                    email: req.user.email,
                    avatar: req.user.avatar,
                },
            });

            // If order or list changed, broadcast authoritative snapshots
            if (orderChanged) {
                try {
                    const targetListId = updatedCard.list?.toString();
                    if (targetListId) {
                        const targetCards = await Card.find({
                            list: targetListId,
                        })
                            .sort("order")
                            .populate("members", "username email avatar")
                            .lean();
                        emitToBoard(boardId, "cards:reordered", {
                            listId: targetListId,
                            cards: targetCards,
                        });
                    }
                    if (oldListId && oldListId !== targetListId) {
                        const sourceCards = await Card.find({ list: oldListId })
                            .sort("order")
                            .populate("members", "username email avatar")
                            .lean();
                        emitToBoard(boardId, "cards:reordered", {
                            listId: oldListId,
                            cards: sourceCards,
                        });
                    }
                } catch (e) {
                    console.error(
                        "Failed to emit cards:reordered snapshot:",
                        e,
                    );
                }
            }
        }

        res.json(updatedCard);
    } catch (error) {
        // Log the error with full details for debugging
        console.error("UpdateCard error:", error, "Payload was:", req.body);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Delete card
// @route   DELETE /api/cards/:id
// @access  Private
const deleteCard = async (req, res) => {
    try {
        const card = await Card.findById(req.params.id);

        if (!card) {
            return res.status(404).json({ message: "Card not found" });
        }

        const list = await List.findById(card.list);
        await Card.findByIdAndDelete(req.params.id);

        // Realtime: notify board listeners

        if (list) {
            emitToBoard(list.board.toString(), "card:deleted", {
                cardId: card._id,
                listId: card.list?.toString(),
                user: req.user && {
                    id: req.user._id,
                    username: req.user.username,
                    email: req.user.email,
                    avatar: req.user.avatar,
                },
            });
        }

        res.json({ message: "Card removed" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

module.exports = {
    getCards,
    createCard,
    updateCard,
    deleteCard,
};
