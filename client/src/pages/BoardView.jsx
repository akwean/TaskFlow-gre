import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus } from 'lucide-react';
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
                cardsData[list._id] = data;
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
                [listId]: [...(cards[listId] || []), data]
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

        // Move card between lists or reorder
        if (sourceListId !== targetListId) {
            const sourceCards = [...cards[sourceListId]];
            const targetCards = [...cards[targetListId]];

            const cardIndex = sourceCards.findIndex(c => c._id === activeId);
            const [movedCard] = sourceCards.splice(cardIndex, 1);

            targetCards.push(movedCard);

            setCards({
                ...cards,
                [sourceListId]: sourceCards,
                [targetListId]: targetCards
            });

            // Update on server
            try {
                await api.put(`/cards/${activeId}`, { list: targetListId });
            } catch (error) {
                console.error(error);
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
                    <ShareBoardDialog board={board} onUpdate={setBoard} />
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
        </div>
    );
};

export default BoardView;
