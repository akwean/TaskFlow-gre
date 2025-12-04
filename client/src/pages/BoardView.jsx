import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, Plus, MoreHorizontal, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '../context/AuthContext';
import ListColumn from '../components/ListColumn';
import CardItem from '../components/CardItem';
import CardModal from '../components/CardModal';
import ShareBoardDialog from '../components/ShareBoardDialog';

const BoardView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [board, setBoard] = useState(null);
    const [lists, setLists] = useState([]);
    const [cards, setCards] = useState({});
    const [loading, setLoading] = useState(true);
    const [newListTitle, setNewListTitle] = useState('');
    const [activeId, setActiveId] = useState(null);
    const [selectedCard, setSelectedCard] = useState(null);
    const [isCardModalOpen, setIsCardModalOpen] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editingTitle, setEditingTitle] = useState('');
    const [showMenu, setShowMenu] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const menuRef = useRef(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    useEffect(() => {
        fetchBoardData();
    }, [id]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const fetchBoardData = async () => {
        try {
            const [boardRes, listsRes] = await Promise.all([
                api.get(`/boards/${id}`),
                api.get(`/boards/${id}/lists`)
            ]);

            setBoard(boardRes.data);
            setLists(listsRes.data);
            setEditingTitle(boardRes.data.title);

            // Fetch cards for each list
            const cardsData = {};
            for (const list of listsRes.data) {
                const { data } = await api.get(`/lists/${list._id}/cards`);
                // Sort cards by order
                cardsData[list._id] = data.sort((a, b) => a.order - b.order);
            }
            setCards(cardsData);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const handleCreateList = async (e) => {
        e.preventDefault();
        if (!newListTitle.trim()) return;

        try {
            const { data } = await api.post(`/boards/${id}/lists`, { title: newListTitle });
            setLists([...lists, data]);
            setCards({ ...cards, [data._id]: [] });
            setNewListTitle('');
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreateCard = async (listId, title) => {
        try {
            const { data } = await api.post(`/lists/${listId}/cards`, { title });
            setCards({
                ...cards,
                [listId]: [...(cards[listId] || []), data].sort((a, b) => a.order - b.order)
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;

        if (!over) {
            setActiveId(null);
            return;
        }

        const activeId = active.id;
        const overId = over.id;

        // Find which list the active card belongs to
        let sourceListId = null;
        let targetListId = null;

        for (const [listId, listCards] of Object.entries(cards)) {
            if (listCards.find(c => c._id === activeId)) {
                sourceListId = listId;
            }
            if (listCards.find(c => c._id === overId)) {
                targetListId = listId;
            }
            // Check if dropping on a list
            if (listId === overId) {
                targetListId = listId;
            }
        }

        if (!sourceListId) return;
        if (!targetListId) targetListId = sourceListId;

        const sourceCards = [...cards[sourceListId]];
        const targetCards = [...cards[targetListId]];

        const activeIndex = sourceCards.findIndex(c => c._id === activeId);
        const overIndex = targetCards.findIndex(c => c._id === overId);

        // Determine drop position relative to the target card
        const isBelow = event.delta.y > 0; // Check if dragging downwards
        const newIndex = isBelow ? overIndex + 1 : overIndex;

        // Move card between lists or reorder within same list
        if (sourceListId !== targetListId) {
            // Moving between lists
            const [movedCard] = sourceCards.splice(activeIndex, 1);
            targetCards.splice(newIndex, 0, movedCard);

            // Update orders for target list
            const updatedTargetCards = targetCards.map((card, index) => ({
                ...card,
                order: index
            }));

            setCards({
                ...cards,
                [sourceListId]: sourceCards,
                [targetListId]: updatedTargetCards
            });

            // Update on server
            try {
                await api.put(`/cards/${activeId}`, { list: targetListId, order: newIndex });
                // Update orders for remaining cards in target list
                for (let i = newIndex + 1; i < updatedTargetCards.length; i++) {
                    await api.put(`/cards/${updatedTargetCards[i]._id}`, { order: i });
                }
            } catch (error) {
                console.error(error);
                // Revert on error
                fetchBoardData();
            }
        } else {
            // Reordering within same list
            const oldIndex = activeIndex;

            if (oldIndex !== newIndex) {
                const [movedCard] = sourceCards.splice(oldIndex, 1);
                sourceCards.splice(newIndex, 0, movedCard);

                // Update orders
                const updatedCards = sourceCards.map((card, index) => ({
                    ...card,
                    order: index
                }));

                setCards({
                    ...cards,
                    [sourceListId]: updatedCards
                });

                // Update on server
                try {
                    await api.put(`/cards/${activeId}`, { order: newIndex });
                    // Update orders for affected cards
                    for (let i = Math.min(oldIndex, newIndex); i <= Math.max(oldIndex, newIndex); i++) {
                        if (i !== newIndex) {
                            await api.put(`/cards/${updatedCards[i]._id}`, { order: i });
                        }
                    }
                } catch (error) {
                    console.error(error);
                    // Revert on error
                    fetchBoardData();
                }
            }
        }

        setActiveId(null);
    };

    const handleCardClick = (card) => {
        setSelectedCard(card);
        setIsCardModalOpen(true);
    };

    const handleCardUpdate = (updatedCard, isDeleted = false) => {
        if (isDeleted) {
            // Remove card from state
            const newCards = { ...cards };
            for (const listId in newCards) {
                newCards[listId] = newCards[listId].filter(c => c._id !== selectedCard._id);
            }
            setCards(newCards);
        } else {
            // Update card in state
            const newCards = { ...cards };
            for (const listId in newCards) {
                const cardIndex = newCards[listId].findIndex(c => c._id === updatedCard._id);
                if (cardIndex !== -1) {
                    newCards[listId][cardIndex] = updatedCard;
                    break;
                }
            }
            setCards(newCards);
        }
    };

    const handleUpdateList = async (listId, title) => {
        try {
            const { data } = await api.put(`/lists/${listId}`, { title });
            setLists(lists.map(l => l._id === listId ? data : l));
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteList = async (listId) => {
        try {
            await api.delete(`/lists/${listId}`);
            setLists(lists.filter(l => l._id !== listId));
            const newCards = { ...cards };
            delete newCards[listId];
            setCards(newCards);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSaveTitle = async () => {
        if (editingTitle.trim() === board.title) {
            setIsEditingTitle(false);
            return;
        }

        try {
            const { data } = await api.put(`/boards/${id}`, { title: editingTitle.trim() });
            setBoard(data);
            setEditingTitle(data.title);
            setIsEditingTitle(false);
        } catch (error) {
            console.error(error);
            setEditingTitle(board.title);
            setIsEditingTitle(false);
        }
    };

    const handleDeleteBoard = async () => {
        try {
            await api.delete(`/boards/${id}`);
            navigate('/');
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    if (!board) {
        return <div className="flex items-center justify-center min-h-screen">Board not found</div>;
    }

    const activeCard = activeId ? Object.values(cards).flat().find(c => c._id === activeId) : null;

    const canEdit = user && (board.owner._id === user._id || board.members.some(m => m.user._id === user._id && m.role === 'admin'));

    return (
        <div className="min-h-screen" style={{ backgroundColor: board.background }}>
            {/* Header */}
            <header className="bg-black bg-opacity-20 backdrop-blur-sm border-b border-white border-opacity-20">
                <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button onClick={() => navigate('/')} variant="ghost" size="sm" className="text-white hover:bg-white hover:bg-opacity-20">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                        {canEdit ? (
                            isEditingTitle ? (
                                <Input
                                    value={editingTitle}
                                    onChange={(e) => setEditingTitle(e.target.value)}
                                    onBlur={handleSaveTitle}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveTitle();
                                        if (e.key === 'Escape') {
                                            setEditingTitle(board.title);
                                            setIsEditingTitle(false);
                                        }
                                    }}
                                    className="text-xl font-bold text-white bg-transparent border-none outline-none p-0 h-auto"
                                    autoFocus
                                />
                            ) : (
                                <h1 className="text-xl font-bold text-white cursor-pointer" onClick={() => setIsEditingTitle(true)}>{board.title}</h1>
                            )
                        ) : (
                            <h1 className="text-xl font-bold text-white">{board.title}</h1>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                        {canEdit && (
                            <div className="relative" ref={menuRef}>
                                <Button
                                    onClick={() => setShowMenu(!showMenu)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-white hover:bg-white hover:bg-opacity-20"
                                >
                                    <MoreHorizontal className="w-4 h-4" />
                                </Button>
                                {showMenu && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50">
                                        <div className="py-1">
                                            <button
                                                onClick={() => {
                                                    setShowMenu(false);
                                                    setShowDeleteDialog(true);
                                                }}
                                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Move to Trash
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        <ShareBoardDialog board={board} onUpdate={setBoard} />
                    </div>
                </div>
            </header>

            {/* Board Content */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="p-4 overflow-x-auto">
                    <div className="flex space-x-4 min-h-[calc(100vh-120px)]">
                        <SortableContext items={lists.map(l => l._id)} strategy={horizontalListSortingStrategy}>
                            {lists.map((list) => (
                                <ListColumn
                                    key={list._id}
                                    list={list}
                                    cards={cards[list._id] || []}
                                    onCreateCard={handleCreateCard}
                                    onCardClick={handleCardClick}
                                    onUpdateList={handleUpdateList}
                                    onDeleteList={handleDeleteList}
                                />
                            ))}
                        </SortableContext>

                        {/* Add List Form */}
                        <div className="flex-shrink-0 w-72">
                            <form onSubmit={handleCreateList} className="bg-white bg-opacity-90 rounded-lg p-3">
                                <Input
                                    type="text"
                                    value={newListTitle}
                                    onChange={(e) => setNewListTitle(e.target.value)}
                                    placeholder="Enter list title..."
                                    className="mb-2"
                                />
                                <Button type="submit" size="sm" className="w-full">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add List
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>

                <DragOverlay>
                    {activeCard ? <CardItem card={activeCard} isDragging /> : null}
                </DragOverlay>
            </DndContext>

            {/* Card Modal */}
            <CardModal
                card={selectedCard}
                isOpen={isCardModalOpen}
                onClose={() => setIsCardModalOpen(false)}
                onUpdate={handleCardUpdate}
            />

            {/* Delete Board Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Move Board to Trash</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to move "{board?.title}" to trash? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteBoard}>
                            Move to Trash
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default BoardView;
