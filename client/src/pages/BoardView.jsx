import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DndContext, DragOverlay, closestCorners, closestCenter, pointerWithin, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { arrayMove } from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, Plus, MoreHorizontal, Trash2 } from 'lucide-react';
import api, { queuedPut, setOnlineState } from '@/lib/api';
import useToasts from '@/components/ui/toast';
import { getSocket, joinBoard, leaveBoard, on as onSocket, off as offSocket } from '@/lib/realtime';
import { useAuth } from '../context/AuthContext';
import ListColumn from '../components/ListColumn';
import CardItem from '../components/CardItem';
import CardModal from '../components/CardModal';
import ShareBoardDialog from '../components/ShareBoardDialog';
import Tooltip from '@/components/ui/tooltip';
import ActivityFeed from '@/components/ActivityFeed';

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
    const [presenceCount, setPresenceCount] = useState(0);
    const [onlineUserIds, setOnlineUserIds] = useState([]);
    const [cursors, setCursors] = useState({}); // socketId -> {x,y,name,color}
    const [boardTypingUsers, setBoardTypingUsers] = useState(new Set());
    const [listPresence, setListPresence] = useState({}); // listId -> count
    const boardAreaRef = useRef(null);
    const cursorThrottleRef = useRef(false);
    const activeDragCardIdRef = useRef(null);
    const [activityOpen, setActivityOpen] = useState(false);
    const [activityItems, setActivityItems] = useState([]);

    // Forced leave dialog state (must be at top level)
    const [showForceLeaveDialog, setShowForceLeaveDialog] = useState(false);
    const [forceLeaveMessage, setForceLeaveMessage] = useState('');

    // Deterministic pastel color from a string
    function stringToColor(str = '') {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash) % 360;
        return `hsl(${hue}, 70%, 45%)`;
    }

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    // Custom collision detection with logging
    const customCollisionDetection = useCallback((args) => {
        // Use closestCorners for cards, it works better for nested sortable contexts
        const collisions = closestCorners(args);
        
        // Log collision details occasionally to avoid spam
        if (Math.random() < 0.01) { // Reduced from 5% to 1% to avoid spam
            console.log('🎲 Collision Detection:', {
                activeId: args.active?.id,
                droppableContainers: args.droppableContainers?.length,
                collisionsFound: collisions?.length,
                topMatch: collisions?.[0]?.id
            });
        }
        
        return collisions;
    }, []);

    // Toasts
    const { add, ToastContainer } = useToasts();

    useEffect(() => {
        const onOnline = () => { setOnlineState(true); add('Reconnected', 'success'); };
        const onOffline = () => { setOnlineState(false); add('You are offline. Changes will retry.', 'error'); };
        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);
        return () => {
            window.removeEventListener('online', onOnline);
            window.removeEventListener('offline', onOffline);
        };
    }, [add]);

    const fetchBoardData = useCallback(async () => {
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
    }, [id]);

    useEffect(() => {
        fetchBoardData();
    }, [fetchBoardData]);

    // Realtime: join board room and register listeners
    useEffect(() => {
        if (!id) return;

        // Ensure socket exists
        const sock = getSocket();

        const handleListCreated = ({ list }) => {
            setLists((prev) => (prev.find((l) => l._id === list._id) ? prev : [...prev, list]));
            setCards((prev) => ({ ...prev, [list._id]: prev[list._id] || [] }));
        };

        const handleListUpdated = ({ list }) => {
            setLists((prev) => prev.map((l) => (l._id === list._id ? list : l)));
        };

        const handleListDeleted = ({ listId }) => {
            setLists((prev) => prev.filter((l) => l._id !== listId));
            setCards((prev) => {
                const next = { ...prev };
                delete next[listId];
                return next;
            });
        };

        const handleCardCreated = ({ card }) => {
            setCards((prev) => {
                const current = prev[card.list] || [];
                const without = current.filter((c) => c._id !== card._id);
                const next = [...without, card].sort((a, b) => a.order - b.order);
                return { ...prev, [card.list]: next };
            });
        };

        const handleCardUpdated = ({ card, oldListId, newListId }) => {
            // Ignore only the card currently being dragged locally
            if (activeDragCardIdRef.current === card._id) {
                return;
            }

            setCards((prev) => {
                const next = { ...prev };
                const fromId = oldListId || card.list;
                const toId = newListId || card.list;

                // Remove from old list if moved
                if (fromId && fromId !== toId && next[fromId]) {
                    next[fromId] = next[fromId].filter((c) => c._id !== card._id);
                }
                // Upsert into target list
                const inList = next[toId] || [];
                const without = inList.filter((c) => c._id !== card._id);
                next[toId] = [...without, card].sort((a, b) => a.order - b.order);
                return next;
            });
        };

        const handleCardDeleted = ({ cardId, listId }) => {
            setCards((prev) => {
                const next = { ...prev };
                if (next[listId]) next[listId] = next[listId].filter((c) => c._id !== cardId);
                return next;
            });
        };

        // Authoritative per-list snapshot: replace list cards with server order
        const handleCardsReordered = ({ listId, cards: serverCards }) => {
            setCards((prev) => ({
                ...prev,
                [listId]: (serverCards || []).slice().sort((a, b) => a.order - b.order)
            }));
        };

        const handleBoardUpdated = ({ board }) => {
            setBoard(board);
            setEditingTitle(board.title);
        };

        const handleBoardDeleted = ({ boardId }) => {
            if (boardId === id) {
                navigate('/');
            }
        };

        const handlePresence = ({ count, userIds }) => {
            setPresenceCount(count || 0);
            setOnlineUserIds(Array.isArray(userIds) ? userIds : []);
        };

        onSocket('list:created', (payload) => {
            handleListCreated(payload);
            setActivityItems((prev) => [{ title: 'List created', detail: payload.list?.title, at: Date.now(), user: payload.user }, ...prev].slice(0, 100));
        });
        onSocket('list:updated', (payload) => {
            handleListUpdated(payload);
            setActivityItems((prev) => [{ title: 'List updated', detail: payload.list?.title, at: Date.now(), user: payload.user }, ...prev].slice(0, 100));
        });
        onSocket('list:deleted', (payload) => {
            handleListDeleted(payload);
            setActivityItems((prev) => [{ title: 'List deleted', detail: '', at: Date.now(), user: payload.user }, ...prev].slice(0, 100));
        });
        onSocket('card:created', (payload) => {
            handleCardCreated(payload);
            setActivityItems((prev) => [{ title: 'Card created', detail: payload.card?.title, at: Date.now(), user: payload.user }, ...prev].slice(0, 100));
        });
        onSocket('card:updated', (payload) => {
            handleCardUpdated(payload);
            setActivityItems((prev) => [{ title: 'Card updated', detail: payload.card?.title, at: Date.now(), user: payload.user }, ...prev].slice(0, 100));
        });
        onSocket('card:deleted', (payload) => {
            handleCardDeleted(payload);
            setActivityItems((prev) => [{ title: 'Card deleted', detail: '', at: Date.now(), user: payload.user }, ...prev].slice(0, 100));
        });
        onSocket('board:updated', (payload) => {
            handleBoardUpdated(payload);
            setActivityItems((prev) => [{ title: 'Board updated', detail: payload.board?.title, at: Date.now(), user: payload.user }, ...prev].slice(0, 100));
        });
        onSocket('board:deleted', handleBoardDeleted);
        onSocket('board:forceLeave', ({ boardId, message }) => {
            if (boardId === id) {
                setForceLeaveMessage(message || 'You have been removed from this board.');
                setShowForceLeaveDialog(true);
            }
        });
        onSocket('presence:update', handlePresence);
        onSocket('cursor:move', (data) => {
            setCursors((prev) => ({ ...prev, [data.socketId]: data }));
        });
        onSocket('cursor:leave', ({ socketId }) => {
            setCursors((prev) => {
                const next = { ...prev };
                delete next[socketId];
                return next;
            });
        });
        onSocket('typing:boardTitle', ({ userId, isTyping }) => {
            setBoardTypingUsers((prev) => {
                const next = new Set(prev);
                if (isTyping) next.add(userId);
                else next.delete(userId);
                return next;
            });
        });
        onSocket('list:presence', ({ listId, count }) => {
            setListPresence((prev) => ({ ...prev, [listId]: Math.max(0, count || 0) }));
        });
        onSocket('lists:reordered', ({ lists: serverLists }) => {
            setLists(serverLists);
        });
        onSocket('cards:reordered', handleCardsReordered);

        // Join after listeners are registered to catch initial presence
        joinBoard(id);

        return () => {
            offSocket('list:created', handleListCreated);
            offSocket('list:updated', handleListUpdated);
            offSocket('list:deleted', handleListDeleted);
            offSocket('card:created', handleCardCreated);
            offSocket('card:updated', handleCardUpdated);
            offSocket('card:deleted', handleCardDeleted);
            offSocket('board:updated', handleBoardUpdated);
            offSocket('board:deleted', handleBoardDeleted);
            offSocket('board:forceLeave');
            offSocket('presence:update', handlePresence);
            offSocket('cursor:move');
            offSocket('cursor:leave');
            offSocket('typing:boardTitle');
            offSocket('list:presence');
            offSocket('lists:reordered');
            offSocket('cards:reordered', handleCardsReordered);
            leaveBoard(id);
        };
    }, [id, navigate]);

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

    // Compute online users (ensure hooks are before any conditional returns)
    const onlineUsers = useMemo(() => {
        const all = [];
        const pushUser = (u) => {
            if (!u) return;
            all.push({ _id: String(u._id), username: u.username, email: u.email, avatar: u.avatar });
        };
        if (board?.owner) pushUser(board.owner);
        if (Array.isArray(board?.members)) {
            for (const m of board.members) pushUser(m?.user);
        }
        const byId = new Map(all.map((u) => [u._id, u]));
        let list = (onlineUserIds || []).map((id) => byId.get(String(id))).filter(Boolean);
        if (user?._id) {
            const me = String(user._id);
            // Put current user first if present
            list = list.sort((a, b) => (a._id === me ? -1 : b._id === me ? 1 : 0));
        }
        return list;
    }, [board, onlineUserIds, user?._id]);

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

    const handleDragStart = useCallback((event) => {
        const { active } = event;
        const activeId = active.id;
        const isListDrag = lists.some((l) => l._id === activeId);
        const isCardDrag = Object.values(cards).flat().some((c) => c._id === activeId);
        
        console.group('🎯 DRAG START');
        console.log('Active ID:', activeId);
        console.log('Is List Drag:', isListDrag);
        console.log('Is Card Drag:', isCardDrag);
        console.log('Active Data:', active.data?.current);
        console.groupEnd();
        
        setActiveId(activeId);
        if (isCardDrag) {
            activeDragCardIdRef.current = activeId;
        }
    }, [lists, cards]);

    const handleDragOver = useCallback((event) => {
        const { active, over, collisions } = event;
        // Only log if over changes or every 10th call to avoid console spam
        const shouldLog = Math.random() < 0.1; // 10% of the time
        
        if (shouldLog) {
            console.log('🔄 DRAG OVER:', {
                active: active.id,
                over: over?.id || 'null',
                collisionsCount: collisions?.length || 0,
                topCollision: collisions?.[0]?.id
            });
        }
    }, []);

    const handleCardDragEnd = useCallback(async (event) => {
        const { active, over } = event;

        console.group('🎴 CARD DRAG END - Server-Authoritative');
        console.log('Active ID:', active.id);
        console.log('Over ID:', over?.id || 'null');

        if (!over) {
            console.log('❌ No over target');
            console.groupEnd();
            return;
        }

        const activeId = active.id;
        const overId = over.id;

        // Find which list the active card belongs to
        let sourceListId = null;
        let targetListId = null;

        for (const [listId, listCards] of Object.entries(cards)) {
            if (listCards.some(c => c._id === activeId)) {
                sourceListId = listId;
            }
            if (listCards.some(c => c._id === overId)) {
                targetListId = listId;
            }
            if (listId === overId) {
                targetListId = listId;
            }
            if (overId === `${listId}__end`) {
                targetListId = listId;
            }
        }

        if (!sourceListId) {
            console.log('❌ Could not find source list!');
            console.groupEnd();
            return;
        }
        if (!targetListId) {
            targetListId = sourceListId;
        }

        const sourceCards = cards[sourceListId] || [];
        const targetCards = cards[targetListId] || [];

        const activeIndex = sourceCards.findIndex(c => c._id === activeId);
        const overIndex = targetCards.findIndex(c => c._id === overId);
        const isOverEndTarget = overId === `${targetListId}__end`;
        const isOverList = overId === targetListId || isOverEndTarget;
        
        // Calculate target index: where we want to insert in the target list
        let newIndex;
        if (isOverEndTarget || isOverList) {
            // Dropped on list container or end target → insert at end
            newIndex = targetCards.length;
        } else if (overIndex >= 0) {
            // Dropped on another card → insert at that position
            newIndex = overIndex;
        } else {
            // Fallback: append
            newIndex = targetCards.length;
        }

        console.log('📍 Move details:', {
            from: lists.find(l => l._id === sourceListId)?.title,
            to: lists.find(l => l._id === targetListId)?.title,
            activeIndex,
            newIndex,
            sourceCount: sourceCards.length,
            targetCount: targetCards.length
        });

        // Send update to server immediately; let server broadcast authoritative state
        try {
            if (sourceListId !== targetListId) {
                // Moving between lists
                console.log('🔄 MOVING BETWEEN LISTS - sending to server');
                await queuedPut(`/cards/${activeId}`, { list: targetListId, order: newIndex });
            } else {
                // Reordering within same list
                console.log('🔃 REORDERING WITHIN SAME LIST - sending to server');
                if (activeIndex !== newIndex) {
                    await queuedPut(`/cards/${activeId}`, { order: newIndex });
                } else {
                    console.log('⚠️ No-op: same position');
                }
            }
            console.log('✅ Server request sent; awaiting cards:reordered broadcast');
        } catch (error) {
            console.error('❌ Server update failed:', error);
            add('Reorder failed.', 'error');
        }

        console.groupEnd();
    }, [cards, lists, add]);

    // Reorder lists horizontally (dragging list headers)
    const handleListDragEnd = useCallback(async ({ active, over }) => {
        console.group('📋 LIST DRAG END');
        console.log('Active ID:', active?.id);
        console.log('Over ID:', over?.id);

        if (!over) {
            console.log('❌ No over target');
            console.groupEnd();
            return;
        }

        // Only proceed if drag item and over target are lists
        const isActiveList = lists.some((l) => l._id === active.id);
        const isOverList = lists.some((l) => l._id === over.id);

        console.log('Is Active a List:', isActiveList);
        console.log('Is Over a List:', isOverList);
        console.log('Same ID:', active.id === over.id);

        if (!isActiveList || !isOverList || active.id === over.id) {
            console.log('⚠️ Skipping list reorder: validation failed');
            console.groupEnd();
            return;
        }

        const oldIndex = lists.findIndex((l) => l._id === active.id);
        const newIndex = lists.findIndex((l) => l._id === over.id);

        console.log('Old Index:', oldIndex);
        console.log('New Index:', newIndex);

        if (oldIndex < 0 || newIndex < 0) {
            console.log('❌ Invalid indices');
            console.groupEnd();
            return;
        }

        const moved = arrayMove(lists, oldIndex, newIndex).map((l, i) => ({ ...l, order: i }));
        console.log('New list order:', moved.map(l => l.title));
        setLists(moved);
        try {
            const payload = { order: moved.map((l, i) => ({ id: l._id, order: i })) };
            await api.post(`/boards/${id}/lists/reorder`, payload);
            console.log('✅ List reorder saved to server');
        } catch (e) {
            console.error('❌ List reorder failed:', e);
            fetchBoardData();
            add('List reorder failed. Restoring.', 'error');
        }
        console.groupEnd();
    }, [lists, id, fetchBoardData, add]);

    // Unified drag end: route to card or list handler
    const handleDragEnd = useCallback(async (event) => {
        const { active, over, collisions } = event;

        console.group('🎬 DRAG END - Main Handler');
        console.log('Active ID:', active.id);
        console.log('Over ID:', over?.id || 'null');
        console.log('Collisions:', collisions);

        if (!over) {
            console.log('❌ No drop target - aborting');
            console.groupEnd();
            setActiveId(null);
            return;
        }

        const activeId = active.id;
        // Determine if dragging a list or a card by matching list ids
        const isListDrag = lists.some((l) => l._id === activeId);
        const isCardDrag = Object.values(cards).flat().some((c) => c._id === activeId);

        console.log('Is List Drag:', isListDrag);
        console.log('Is Card Drag:', isCardDrag);

        if (isListDrag) {
            console.log('📋 Routing to LIST drag handler');
            console.groupEnd();
            await handleListDragEnd(event);
        } else if (isCardDrag) {
            console.log('🎴 Routing to CARD drag handler');
            console.groupEnd();
            await handleCardDragEnd(event);
        } else {
            console.log('⚠️ Unknown drag type - aborting');
            console.groupEnd();
        }
        activeDragCardIdRef.current = null;
        setActiveId(null);
    }, [lists, cards, handleListDragEnd, handleCardDragEnd]);

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

    // Emit board title typing
    useEffect(() => {
        if (!isEditingTitle) return;
        const s = getSocket();
        s.emit('typing:boardTitle', { boardId: id, isTyping: true });
        const onBlur = () => s.emit('typing:boardTitle', { boardId: id, isTyping: false });
        return () => onBlur();
    }, [isEditingTitle, id]);

    const onListFocus = (listId, focused) => {
        const s = getSocket();
        s.emit('list:focus', { boardId: id, listId, focused });
    };

    // Cursor tracking within board area
    const displayName = user?.username || user?.email || 'User';
    const displayColor = stringToColor(displayName);
    const handleMouseMove = (e) => {
        if (!boardAreaRef.current) return;
        if (cursorThrottleRef.current) return;
        cursorThrottleRef.current = true;
        const rect = boardAreaRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        getSocket().emit('cursor:move', { boardId: id, x, y, name: displayName, color: displayColor });
        requestAnimationFrame(() => { cursorThrottleRef.current = false; });
    };
    const handleMouseLeaveBoard = () => {
        getSocket().emit('cursor:leave', { boardId: id });
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
        <>
        <div className="min-h-screen" style={{ backgroundColor: board.background }}>
            {/* Header */}
            <header className="bg-black bg-opacity-20 backdrop-blur-sm border-b border-white border-opacity-20 relative z-10">
                <div className="px-3 sm:px-4 py-2 sm:py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-4">
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
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl font-bold text-white cursor-pointer" onClick={() => setIsEditingTitle(true)}>{board.title}</h1>
                                    {boardTypingUsers.size > 0 && (
                                        <span className="text-xs text-white/80 italic">{boardTypingUsers.size > 1 ? 'Multiple people' : 'Someone'} typing…</span>
                                    )}
                                </div>
                            )
                        ) : (
                            <h1 className="text-xl font-bold text-white">{board.title}</h1>
                        )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex -space-x-2 mr-2 flex-wrap">
                            {onlineUsers.slice(0, 5).map((u) => (
                                <Tooltip key={u._id} content={u._id === (user?._id || '') ? `${u.username || u.email} (You)` : (u.username || u.email)}>
                                    <span className="relative inline-flex ring-2 ring-white rounded-full">
                                        <div
                                            className="inline-flex items-center justify-center w-7 h-7 rounded-full overflow-hidden text-white text-xs font-medium"
                                            style={{ backgroundColor: u.avatar ? undefined : stringToColor(u.username || u.email || u._id) }}
                                        >
                                            {u.avatar ? (
                                                <img src={u.avatar} alt={u.username || 'User'} className="w-full h-full object-cover" />
                                            ) : (
                                                <span>{(u.username || u.email || 'U').charAt(0).toUpperCase()}</span>
                                            )}
                                        </div>
                                        {u._id === (user?._id || '') && (
                                            <span className="absolute -bottom-1 right-0 translate-y-0.5 rounded bg-indigo-600 text-white text-[9px] leading-none px-1 py-[2px] shadow">
                                                You
                                            </span>
                                        )}
                                    </span>
                                </Tooltip>
                            ))}
                            {onlineUsers.length > 5 && (
                                <div className="inline-flex items-center justify-center w-7 h-7 rounded-full ring-2 ring-white bg-gray-200 text-gray-700 text-xs font-medium">
                                    +{onlineUsers.length - 5}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center px-2 py-1 text-xs font-medium rounded-md bg-white bg-opacity-20 text-white">
                            <span className="relative flex h-2 w-2 mr-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                            </span>
                            Online {presenceCount}
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-white hover:bg-white hover:bg-opacity-20"
                            onClick={() => setActivityOpen((v) => !v)}
                        >
                            Activity
                        </Button>
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
                collisionDetection={customCollisionDetection}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className="p-2 sm:p-4 overflow-x-auto" ref={boardAreaRef} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeaveBoard}>
                    <div className="relative">
                        {/* Cursor overlay */}
                        <div className="pointer-events-none absolute inset-0 z-30">
                            {Object.values(cursors).map((c) => (
                                <div key={c.socketId} className="absolute" style={{ left: c.x, top: c.y }}>
                                    <div className="flex items-center gap-1 translate-x-2 -translate-y-5">
                                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }}></span>
                                        <span className="px-1.5 py-0.5 text-[10px] rounded bg-black/70 text-white">{c.name}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex space-x-3 sm:space-x-4 min-h-[calc(100vh-120px)]">
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
                                        onListFocus={onListFocus}
                                        listPresenceCount={listPresence[list._id] || 0}
                                />
                            ))}
                        </SortableContext>

                        {/* Add List Form */}
                        <div className="flex-shrink-0 w-64 sm:w-72">
                            <form onSubmit={handleCreateList} className="bg-white bg-opacity-90 rounded-lg p-2 sm:p-3">
                                <Input
                                    type="text"
                                    value={newListTitle}
                                    onChange={(e) => setNewListTitle(e.target.value)}
                                    placeholder="Enter list title..."
                                    className="mb-2 text-sm"
                                />
                                <Button type="submit" size="sm" className="w-full">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add List
                                </Button>
                            </form>
                        </div>
                        </div>
                    </div>
                </div>

                <DragOverlay>
                    {activeCard ? (
                        <div className="pointer-events-none">
                            <CardItem card={activeCard} isDragging />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* Card Modal */}
            <CardModal
                card={selectedCard}
                isOpen={isCardModalOpen}
                onClose={() => setIsCardModalOpen(false)}
                onUpdate={handleCardUpdate}
                boardId={id}
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
        <ActivityFeed items={activityItems} open={activityOpen} onClose={() => setActivityOpen(false)} />
        {/* Forced Leave Board Dialog */}
        <Dialog open={showForceLeaveDialog} onOpenChange={setShowForceLeaveDialog}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Access Removed</DialogTitle>
                    <DialogDescription>
                        {forceLeaveMessage}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => { setShowForceLeaveDialog(false); navigate('/'); }}>
                        OK
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        <ToastContainer />
        </>
    );
};

export default BoardView;
