import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket } from '@/lib/realtime';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { X, Tag, Calendar, CheckSquare, Trash2, Plus } from 'lucide-react';
import api from '@/lib/api';

const LABEL_COLORS = [
    { name: 'Green', color: '#61bd4f' },
    { name: 'Yellow', color: '#f2d600' },
    { name: 'Orange', color: '#ff9f1a' },
    { name: 'Red', color: '#eb5a46' },
    { name: 'Purple', color: '#c377e0' },
    { name: 'Blue', color: '#0079bf' },
    { name: 'Sky', color: '#00c2e0' },
    { name: 'Lime', color: '#51e898' },
    { name: 'Pink', color: '#ff78cb' },
    { name: 'Black', color: '#344563' },
];

const CardModal = ({ card, isOpen, onClose, onUpdate, boardId }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [labels, setLabels] = useState([]);
    const [checklists, setChecklists] = useState([]);
    const [showLabelPicker, setShowLabelPicker] = useState(false);
    const [newChecklistTitle, setNewChecklistTitle] = useState('');
    const [showNewChecklist, setShowNewChecklist] = useState(false);

    const debounceTimeout = useRef(null);
    const initialDataRef = useRef(null);
    const isMounted = useRef(true);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState(null);
    const titleInputRef = useRef(null);
    const descriptionRef = useRef(null);
    const [descTypingUsers, setDescTypingUsers] = useState(new Set());
    const typingTimeoutRef = useRef(null);

    const debouncedUpdate = useCallback(async () => {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(async () => {
            if (!card || !card._id) return;
            const currentSnapshot = { title, description, dueDate: dueDate || null, labels, checklists };
            if (initialDataRef.current && JSON.stringify(initialDataRef.current) === JSON.stringify(currentSnapshot)) {
                // nothing changed, skip update
                return;
            }
            try {
                setIsSaving(true);
                const updates = {
                    title,
                    description,
                    dueDate: dueDate || null,
                    labels,
                    checklists,
                };
                const { data } = await api.put(`/cards/${card._id}`, updates);
                if (isMounted.current) {
                    setIsSaving(false);
                    setLastSavedAt(new Date());
                    onUpdate(data);
                    // update baseline
                    initialDataRef.current = {
                        title: data.title || '',
                        description: data.description || '',
                        dueDate: data.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : '',
                        labels: data.labels || [],
                        checklists: data.checklists || [],
                    };
                }
            } catch (error) {
                console.error('Error updating card:', error);
                if (isMounted.current) setIsSaving(false);
            }
        }, 500);
    }, [title, description, dueDate, labels, checklists, card?._id, onUpdate]);

    useEffect(() => {
        if (card) {
            setTitle(card.title || '');
            setDescription(card.description || '');
            setDueDate(card.dueDate ? new Date(card.dueDate).toISOString().split('T')[0] : '');
            setLabels(card.labels || []);
            setChecklists(card.checklists || []);
            initialDataRef.current = {
                title: card.title || '',
                description: card.description || '',
                dueDate: card.dueDate ? new Date(card.dueDate).toISOString().split('T')[0] : '',
                labels: card.labels || [],
                checklists: card.checklists || []
            };
        }
    }, [card]);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
            if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, []);

    useEffect(() => {
        // Prevent auto-focus on the title input by shifting focus to a hidden div
        const focusableElement = document.getElementById('focus-trap');
        if (focusableElement) {
            focusableElement.focus();
        }
    }, []);

    useEffect(() => {
        if (isOpen && titleInputRef.current) {
            setTimeout(() => titleInputRef.current?.blur(), 0);
        }
    }, [isOpen]);

    const flushUpdate = async () => {
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
            debounceTimeout.current = null;
        }
        if (!card || !card._id) return;
        const currentSnapshot = {
            title,
            description,
            dueDate: dueDate || null,
            labels,
            checklists,
        };
        if (initialDataRef.current && JSON.stringify(initialDataRef.current) === JSON.stringify(currentSnapshot)) {
            // nothing changed, skip update
            return;
        }
        try {
            setIsSaving(true);
            const updates = { title, description, dueDate: dueDate || null, labels, checklists };
            const { data } = await api.put(`/cards/${card._id}`, updates);
            if (isMounted.current) {
                setIsSaving(false);
                setLastSavedAt(new Date());
                onUpdate(data);
                // update baseline
                initialDataRef.current = {
                    title: data.title || '',
                    description: data.description || '',
                    dueDate: data.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : '',
                    labels: data.labels || [],
                    checklists: data.checklists || [],
                };
            }
        } catch (error) {
            console.error('Error flushing card update:', error);
            if (isMounted.current) setIsSaving(false);
        }
    };

    // Typing indicator for description
    useEffect(() => {
        const s = getSocket();
        const onTyping = ({ userId, cardId, isTyping }) => {
            if (!card || cardId !== card._id) return;
            setDescTypingUsers((prev) => {
                const next = new Set(prev);
                if (isTyping) next.add(userId);
                else next.delete(userId);
                return next;
            });
        };
        s.on('typing:card', onTyping);
        return () => {
            s.off('typing:card', onTyping);
        };
    }, [card]);

    const emitTyping = (isTyping) => {
        if (!card || !boardId) return;
        const s = getSocket();
        s.emit('typing:card', { boardId, cardId: card._id, isTyping });
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this card?')) {
            try {
                await api.delete(`/cards/${card._id}`);
                onUpdate(null, true); // Signal deletion
                onClose();
            } catch (error) {
                console.error(error);
            }
        }
    };

    const addLabel = (labelColor) => {
        const existingLabel = labels.find(l => l.color === labelColor.color);
        if (!existingLabel) {
            setLabels([...labels, { name: labelColor.name, color: labelColor.color }]);
        }
        setShowLabelPicker(false);
    };

    const removeLabel = (color) => {
        setLabels(labels.filter(l => l.color !== color));
    };

    const addChecklist = () => {
        if (newChecklistTitle.trim()) {
            setChecklists([...checklists, { title: newChecklistTitle, items: [] }]);
            setNewChecklistTitle('');
            setShowNewChecklist(false);
        }
    };

    const addChecklistItem = (checklistIndex, text) => {
        const newChecklists = [...checklists];
        newChecklists[checklistIndex].items.push({ text, completed: false });
        setChecklists(newChecklists);
    };

    const toggleChecklistItem = (checklistIndex, itemIndex) => {
        const newChecklists = [...checklists];
        newChecklists[checklistIndex].items[itemIndex].completed =
            !newChecklists[checklistIndex].items[itemIndex].completed;
        setChecklists(newChecklists);
    };

    const deleteChecklistItem = (checklistIndex, itemIndex) => {
        const newChecklists = [...checklists];
        newChecklists[checklistIndex].items.splice(itemIndex, 1);
        setChecklists(newChecklists);
    };

    const deleteChecklist = (checklistIndex) => {
        const newChecklists = [...checklists];
        newChecklists.splice(checklistIndex, 1);
        setChecklists(newChecklists);
    };

    if (!card) return null;

    const handleDialogOpenChange = async (open) => {
        if (!open) {
            await flushUpdate();
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
            <div id="focus-trap" tabIndex="-1" className="hidden" /> {/* Hidden focus trap */}
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto"
                onOpenAutoFocus={(event) => {
                    event.preventDefault(); // stops Radix from auto-focusing
                    const descriptionElement = document.getElementById('description');
                    if (descriptionElement) {
                        descriptionElement.focus(); // manually set focus to the description
                    }
                }}
            >
                <DialogHeader>
                    <DialogTitle>
                        <Input
                            ref={titleInputRef}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="text-xl font-semibold border-none px-0 focus-visible:ring-0 max-w-lg"
                            autoFocus={false} // Prevent auto-focus when the modal opens
                            onFocus={(e) => e.target.select()} // Ensure the text is selectable only when manually focused
                            id="card-title"
                            name="title"
                            aria-label="Card Title"
                        />
                    </DialogTitle>
                    <DialogDescription>
                        Edit the details of this card.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Labels */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <Label className="flex items-center gap-2">
                                <Tag className="w-4 h-4" />
                                Labels
                            </Label>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowLabelPicker(!showLabelPicker)}
                            >
                                <Plus className="w-4 h-4 mr-1" />
                                Add
                            </Button>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-2">
                            {labels.map((label, idx) => (
                                <div
                                    key={idx}
                                    className="px-3 py-1 rounded-full text-white text-sm flex items-center gap-2"
                                    style={{ backgroundColor: label.color }}
                                >
                                    {label.name}
                                    <button onClick={() => removeLabel(label.color)}>
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {showLabelPicker && (
                            <div className="grid grid-cols-5 gap-2 p-3 bg-gray-50 rounded-lg">
                                {LABEL_COLORS.map((labelColor) => (
                                    <button
                                        key={labelColor.color}
                                        onClick={() => addLabel(labelColor)}
                                        className="h-8 rounded hover:opacity-80 transition-opacity"
                                        style={{ backgroundColor: labelColor.color }}
                                        title={labelColor.name}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Due Date */}
                    <div>
                        <Label htmlFor="due-date" className="flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4" />
                            Due Date
                        </Label>
                        <Input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="max-w-xs"
                            id="due-date"
                            name="dueDate"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Label htmlFor="description">Description</Label>
                            {descTypingUsers.size > 0 && (
                                <span className="text-xs text-gray-500 italic">{descTypingUsers.size > 1 ? 'Multiple people' : 'Someone'} typing…</span>
                            )}
                        </div>
                        <Textarea
                            ref={descriptionRef}
                            value={description}
                            onFocus={() => emitTyping(true)}
                            onBlur={() => emitTyping(false)}
                            onChange={(e) => {
                                setDescription(e.target.value);
                                emitTyping(true);
                                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                                typingTimeoutRef.current = setTimeout(() => emitTyping(false), 800);
                            }}
                            placeholder="Add a more detailed description..."
                            rows={4}
                            className="w-full max-w-2xl"
                            id="description"
                            name="description"
                        />
                    </div>

                    {/* Checklists */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <Label className="flex items-center gap-2">
                                <CheckSquare className="w-4 h-4" />
                                Checklists
                            </Label>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowNewChecklist(!showNewChecklist)}
                            >
                                <Plus className="w-4 h-4 mr-1" />
                                Add Checklist
                            </Button>
                        </div>

                        {showNewChecklist && (
                            <div className="flex gap-2 mb-4">
                                <Input
                                    value={newChecklistTitle}
                                    onChange={(e) => setNewChecklistTitle(e.target.value)}
                                    placeholder="Checklist title..."
                                    onKeyPress={(e) => e.key === 'Enter' && addChecklist()}
                                    className="max-w-md"
                                    id="new-checklist-title"
                                    name="newChecklistTitle"
                                />
                                <Button onClick={addChecklist} size="sm">Add</Button>
                                <Button onClick={() => setShowNewChecklist(false)} size="sm" variant="ghost">
                                    Cancel
                                </Button>
                            </div>
                        )}

                        {checklists.map((checklist, checklistIdx) => (
                            <ChecklistSection
                                key={checklistIdx}
                                checklist={checklist}
                                checklistIndex={checklistIdx}
                                onAddItem={addChecklistItem}
                                onToggleItem={toggleChecklistItem}
                                onDeleteItem={deleteChecklistItem}
                                onDeleteChecklist={deleteChecklist}
                            />
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t">
                        <Button variant="destructive" onClick={handleDelete}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Card
                        </Button>
                        <span className="text-sm text-gray-500">{isSaving ? 'Saving...' : lastSavedAt ? 'Saved' : ''}</span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const ChecklistSection = ({
    checklist,
    checklistIndex,
    onAddItem,
    onToggleItem,
    onDeleteItem,
    onDeleteChecklist
}) => {
    const [newItemText, setNewItemText] = useState('');
    const [showAddItem, setShowAddItem] = useState(false);

    const handleAddItem = () => {
        if (newItemText.trim()) {
            onAddItem(checklistIndex, newItemText);
            setNewItemText('');
            setShowAddItem(false);
        }
    };

    const completedCount = checklist.items.filter(item => item.completed).length;
    const totalCount = checklist.items.length;
    const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    return (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">{checklist.title}</h4>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDeleteChecklist(checklistIndex)}
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>

            {totalCount > 0 && (
                <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>{Math.round(progress)}%</span>
                        <span>{completedCount}/{totalCount}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            <div className="space-y-2">
                {checklist.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="flex items-center gap-2 group">
                        <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => onToggleItem(checklistIndex, itemIdx)}
                            className="w-4 h-4 rounded"
                        />
                        <span className={`flex-1 ${item.completed ? 'line-through text-gray-500' : ''}`}>
                            {item.text}
                        </span>
                        <button
                            onClick={() => onDeleteItem(checklistIndex, itemIdx)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="w-4 h-4 text-gray-500 hover:text-red-500" />
                        </button>
                    </div>
                ))}
            </div>

            {showAddItem ? (
                <div className="flex gap-2 mt-3">
                    <Input
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                        placeholder="Add an item..."
                        onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                        autoFocus
                        className="max-w-xl"
                        id={`new-item-${checklistIndex}`}
                        name={`newItem-${checklistIndex}`}
                    />
                    <Button onClick={handleAddItem} size="sm">Add</Button>
                    <Button onClick={() => setShowAddItem(false)} size="sm" variant="ghost">
                        Cancel
                    </Button>
                </div>
            ) : (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddItem(true)}
                    className="mt-2 w-full"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                </Button>
            )}
        </div>
    );
};

export default CardModal;
