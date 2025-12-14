import { useState, useEffect, useCallback, useRef } from "react";

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates

// Log incoming socket events for card updates
import { getSocket } from "@/lib/realtime";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    X,
    Tag,
    Calendar,
    CheckSquare,
    Trash2,
    Plus,
    User,
    MoreVertical,
} from "lucide-react";
import api from "@/lib/api";

const LABEL_COLORS = [
    { name: "Green", color: "#61bd4f" },
    { name: "Yellow", color: "#f2d600" },
    { name: "Orange", color: "#ff9f1a" },
    { name: "Red", color: "#eb5a46" },
    { name: "Purple", color: "#c377e0" },
    { name: "Blue", color: "#0079bf" },
    { name: "Sky", color: "#00c2e0" },
    { name: "Lime", color: "#51e898" },
    { name: "Pink", color: "#ff78cb" },
    { name: "Black", color: "#344563" },
];

const CardModal = ({ card, isOpen, onClose, onUpdate, boardId }) => {
    const [title, setTitle] = useState(card?.title || "");
    const [description, setDescription] = useState(card?.description || "");
    const [dueDate, setDueDate] = useState(
        card?.dueDate ? new Date(card.dueDate).toISOString().split("T")[0] : "",
    );
    const [labels, setLabels] = useState(card?.labels || []);
    const [checklists, setChecklists] = useState(card?.checklists || []);

    // Log checklists state whenever it changes
    useEffect(() => {
        console.log("Current checklists state:", checklists);
    }, [checklists]);

    // Log incoming socket events for card updates (must be inside component)
    useEffect(() => {
        const s = getSocket();
        const onCardUpdated = (payload) => {
            console.log("Received card:updated event:", payload);
            // Only update if the incoming card is newer
            if (
                payload.card &&
                payload.card._id === card?._id &&
                payload.card.updatedAt &&
                (!card.updatedAt ||
                    new Date(payload.card.updatedAt) > new Date(card.updatedAt))
            ) {
                if (payload.card.title !== undefined)
                    setTitle(payload.card.title);
                if (payload.card.description !== undefined)
                    setDescription(payload.card.description);
                if (payload.card.dueDate !== undefined) {
                    setDueDate(
                        payload.card.dueDate
                            ? new Date(payload.card.dueDate)
                                  .toISOString()
                                  .split("T")[0]
                            : "",
                    );
                }
                if (payload.card.labels !== undefined)
                    setLabels(payload.card.labels);
                // Only update checklists if different from local state (prevents overwriting optimistic UI)
                if (
                    payload.card.checklists !== undefined &&
                    JSON.stringify(payload.card.checklists) !==
                        JSON.stringify(checklists)
                ) {
                    setChecklists(payload.card.checklists);
                }
            }
        };
        s.on("card:updated", onCardUpdated);
        return () => s.off("card:updated", onCardUpdated);
    }, [card, checklists]);
    const [showLabelPicker, setShowLabelPicker] = useState(false);
    const [newChecklistTitle, setNewChecklistTitle] = useState("");
    const [showNewChecklist, setShowNewChecklist] = useState(false);

    const debounceTimeout = useRef(null);
    const initialDataRef = useRef({
        title: card?.title || "",
        description: card?.description || "",
        dueDate: card?.dueDate
            ? new Date(card.dueDate).toISOString().split("T")[0]
            : "",
        labels: card?.labels || [],
        checklists: card?.checklists || [],
    });
    const isMounted = useRef(true);
    const titleInputRef = useRef(null);
    const descriptionRef = useRef(null);
    const [descTypingUsers, setDescTypingUsers] = useState(new Set());
    const typingTimeoutRef = useRef(null);

    const debouncedUpdate = useCallback(async () => {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(async () => {
            if (!card || !card._id) return;

            // Prevent sending an update with an empty title (server validation will reject)
            if (!title || title.trim() === "") {
                const prevTitle = initialDataRef.current?.title || "";
                if (title !== prevTitle) setTitle(prevTitle);
                return;
            }

            const currentSnapshot = {
                title,
                description,
                dueDate: dueDate || null,
                labels,
                checklists,
            };
            if (
                initialDataRef.current &&
                JSON.stringify(initialDataRef.current) ===
                    JSON.stringify(currentSnapshot)
            ) {
                return;
            }

            try {
                const updates = {
                    title,
                    description,
                    dueDate: dueDate || null,
                    labels,
                    checklists,
                };
                console.log("Updating card (debouncedUpdate):", updates);
                const { data } = await api.put(`/cards/${card._id}`, updates);
                console.log("Card update response (debouncedUpdate):", data);
                if (isMounted.current) {
                    onUpdate(data);
                    initialDataRef.current = {
                        title: data.title || "",
                        description: data.description || "",
                        dueDate: data.dueDate
                            ? new Date(data.dueDate).toISOString().split("T")[0]
                            : "",
                        labels: data.labels || [],
                        checklists: data.checklists || [],
                    };
                }
            } catch (error) {
                console.error("Error updating card:", error);
            }
        }, 500);
    }, [title, description, dueDate, labels, checklists, card, onUpdate]);

    useEffect(() => {
        debouncedUpdate();
    }, [debouncedUpdate]);

    // Only sync local state from card prop when card id changes
    const lastCardId = useRef();
    useEffect(() => {
        if (!card || card._id === lastCardId.current) return;
        // Use a microtask to avoid cascading renders by deferring setState
        Promise.resolve().then(() => {
            setTitle(card.title || "");
            setDescription(card.description || "");
            setDueDate(
                card.dueDate
                    ? new Date(card.dueDate).toISOString().split("T")[0]
                    : "",
            );
            setLabels(card.labels || []);
            setChecklists(card.checklists || []);
            initialDataRef.current = {
                _id: card._id,
                title: card.title || "",
                description: card.description || "",
                dueDate: card.dueDate
                    ? new Date(card.dueDate).toISOString().split("T")[0]
                    : "",
                labels: card.labels || [],
                checklists: card.checklists || [],
            };
            lastCardId.current = card._id;
        });
    }, [card]);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
            if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
            if (typingTimeoutRef.current)
                clearTimeout(typingTimeoutRef.current);
        };
    }, [title, description, dueDate, labels, checklists]);

    useEffect(() => {
        const focusableElement = document.getElementById("focus-trap");
        if (focusableElement) {
            focusableElement.focus();
        }
    }, []);

    useEffect(() => {
        if (isOpen && titleInputRef.current) {
            setTimeout(() => titleInputRef.current?.blur(), 0);
        }
    }, [isOpen]);

    // Accepts optional override for batching (used by addChecklist)
    const flushUpdate = async (override) => {
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
            debounceTimeout.current = null;
        }
        if (!card || !card._id) return;
        const updates = override || {
            title,
            description,
            dueDate: dueDate || null,
            labels,
            checklists,
        };
        if (
            initialDataRef.current &&
            JSON.stringify(initialDataRef.current) === JSON.stringify(updates)
        ) {
            return;
        }
        try {
            if (!updates.title || updates.title.trim() === "") {
                const prevTitle = initialDataRef.current?.title || "";
                if (updates.title !== prevTitle) setTitle(prevTitle);
                return;
            }

            console.log("Updating card (flushUpdate):", updates);
            const { data } = await api.put(`/cards/${card._id}`, updates);
            console.log("Card update response (flushUpdate):", data);
            if (isMounted.current) {
                onUpdate(data);
                initialDataRef.current = {
                    title: data.title || "",
                    description: data.description || "",
                    dueDate: data.dueDate
                        ? new Date(data.dueDate).toISOString().split("T")[0]
                        : "",
                    labels: data.labels || [],
                    checklists: data.checklists || [],
                };
            }
        } catch (error) {
            console.error("Error flushing card update:", error);
        }
    };

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
        s.on("typing:card", onTyping);
        return () => {
            s.off("typing:card", onTyping);
        };
    }, [card]);

    const emitTyping = (isTyping) => {
        if (!card || !boardId) return;
        const s = getSocket();
        s.emit("typing:card", { boardId, cardId: card._id, isTyping });
    };

    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const handleDelete = async () => {
        try {
            await api.delete(`/cards/${card._id}`);
            onUpdate(null, true);
            onClose();
            setShowDeleteDialog(false);
        } catch (error) {
            console.error(error);
        }
    };

    const addLabel = (labelColor) => {
        const existingLabel = labels.find((l) => l.color === labelColor.color);
        if (!existingLabel) {
            setLabels([
                ...labels,
                { name: labelColor.name, color: labelColor.color },
            ]);
        }
        setShowLabelPicker(false);
    };

    const removeLabel = (color) => {
        setLabels(labels.filter((l) => l.color !== color));
    };

    const addChecklist = () => {
        if (newChecklistTitle.trim()) {
            // Optimistic update: update UI immediately
            const optimisticChecklist = { title: newChecklistTitle, items: [] };
            const newChecklists = [...checklists, optimisticChecklist];
            setChecklists(newChecklists);
            setNewChecklistTitle("");
            setShowNewChecklist(false);
            // Immediately flush to backend so checklist is persisted right away
            flushUpdate({
                title,
                description,
                dueDate: dueDate || null,
                labels,
                checklists: newChecklists,
            });
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
            <div id="focus-trap" tabIndex="-1" className="hidden" />
            <DialogContent
                className="max-w-md max-h-[90vh] overflow-y-auto p-4"
                onOpenAutoFocus={(event) => {
                    event.preventDefault();
                    const descriptionElement =
                        document.getElementById("description");
                    if (descriptionElement) {
                        descriptionElement.focus();
                    }
                }}
            >
                <DialogHeader className="mb-3">
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <DialogTitle>
                                <Input
                                    ref={titleInputRef}
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="text-lg font-semibold border-none px-0 focus-visible:ring-0 max-w-lg bg-transparent text-gray-800"
                                    autoFocus={false}
                                    onFocus={(e) => e.target.select()}
                                    id="card-title"
                                    name="title"
                                    aria-label="Card Title"
                                />
                            </DialogTitle>
                            <DialogDescription className="text-xs text-gray-600 mt-1">
                                Edit the details of this card.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-3">
                    {/* Labels */}
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                            <Label className="flex items-center gap-2 text-xs font-medium text-gray-700">
                                <Tag className="w-3 h-3" />
                                Labels
                            </Label>
                            <Button
                                size="xs"
                                variant="outline"
                                onClick={() =>
                                    setShowLabelPicker(!showLabelPicker)
                                }
                                className="text-xs px-2 py-1"
                            >
                                <Plus className="w-3 h-3 mr-1" />
                                Add
                            </Button>
                        </div>

                        <div className="flex flex-wrap gap-1 mb-2">
                            {labels.map((label, idx) => (
                                <div
                                    key={idx}
                                    className="px-2 py-1 rounded-full text-white text-xs flex items-center gap-1 shadow-sm"
                                    style={{ backgroundColor: label.color }}
                                >
                                    {label.name}
                                    <button
                                        onClick={() => removeLabel(label.color)}
                                        className="hover:opacity-80 transition-opacity"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {showLabelPicker && (
                            <div className="grid grid-cols-5 gap-1 p-2 bg-gray-50 rounded-lg border border-gray-200">
                                {LABEL_COLORS.map((labelColor) => (
                                    <button
                                        key={labelColor.color}
                                        onClick={() => addLabel(labelColor)}
                                        className="h-6 rounded hover:opacity-80 transition-opacity flex items-center justify-center"
                                        style={{
                                            backgroundColor: labelColor.color,
                                        }}
                                        title={labelColor.name}
                                    >
                                        <span className="sr-only">
                                            {labelColor.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Due Date */}
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <Label
                            htmlFor="due-date"
                            className="flex items-center gap-2 mb-1 text-xs font-medium text-gray-700"
                        >
                            <Calendar className="w-3 h-3" />
                            Due Date
                        </Label>
                        <Input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="max-w-xs border-gray-300 text-xs"
                            id="due-date"
                            name="dueDate"
                        />
                    </div>

                    {/* Description */}
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center gap-1 mb-1">
                            <Label
                                htmlFor="description"
                                className="text-xs font-medium text-gray-700"
                            >
                                Description
                            </Label>
                            {descTypingUsers.size > 0 && (
                                <div className="flex items-center gap-1 text-xs text-blue-600">
                                    <User className="w-3 h-3" />
                                    {descTypingUsers.size > 1
                                        ? `${descTypingUsers.size} people`
                                        : "Someone"}{" "}
                                    typing...
                                </div>
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
                                if (typingTimeoutRef.current)
                                    clearTimeout(typingTimeoutRef.current);
                                typingTimeoutRef.current = setTimeout(
                                    () => emitTyping(false),
                                    800,
                                );
                            }}
                            placeholder="Add a more detailed description..."
                            rows={3}
                            className="w-full max-w-2xl border-gray-300 text-sm resize-none"
                            id="description"
                            name="description"
                        />
                    </div>

                    {/* Checklists */}
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                            <Label className="flex items-center gap-2 text-xs font-medium text-gray-700">
                                <CheckSquare className="w-3 h-3" />
                                Checklists
                            </Label>
                            <Button
                                size="xs"
                                variant="outline"
                                onClick={() =>
                                    setShowNewChecklist(!showNewChecklist)
                                }
                                className="text-xs px-2 py-1"
                            >
                                <Plus className="w-3 h-3 mr-1" />
                                Add Checklist
                            </Button>
                        </div>

                        {showNewChecklist && (
                            <div className="flex gap-1 mb-2">
                                <Input
                                    value={newChecklistTitle}
                                    onChange={(e) =>
                                        setNewChecklistTitle(e.target.value)
                                    }
                                    placeholder="Checklist title..."
                                    onKeyPress={(e) =>
                                        e.key === "Enter" && addChecklist()
                                    }
                                    className="max-w-md border-gray-300 text-xs"
                                    id="new-checklist-title"
                                    name="newChecklistTitle"
                                />
                                <Button onClick={addChecklist} size="xs">
                                    Add
                                </Button>
                                <Button
                                    onClick={() => setShowNewChecklist(false)}
                                    size="xs"
                                    variant="ghost"
                                >
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
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <Button
                            variant="destructive"
                            onClick={() => setShowDeleteDialog(true)}
                            size="sm"
                            className="text-xs"
                        >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete Card
                        </Button>

                        {/* Delete Card Confirmation Dialog */}
                        <Dialog
                            open={showDeleteDialog}
                            onOpenChange={setShowDeleteDialog}
                        >
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Delete Card</DialogTitle>
                                    <DialogDescription>
                                        Are you sure you want to delete this
                                        card? This action cannot be undone.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            setShowDeleteDialog(false)
                                        }
                                        size="sm"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={handleDelete}
                                        size="sm"
                                    >
                                        Delete
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
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
    onDeleteChecklist,
}) => {
    const [newItemText, setNewItemText] = useState("");
    const [showAddItem, setShowAddItem] = useState(false);

    const handleAddItem = () => {
        if (newItemText.trim()) {
            onAddItem(checklistIndex, newItemText);
            setNewItemText("");
            setShowAddItem(false);
        }
    };

    const completedCount = checklist.items.filter(
        (item) => item.completed,
    ).length;
    const totalCount = checklist.items.length;
    const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    return (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm text-gray-800">
                    {checklist.title}
                </h4>
                <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => onDeleteChecklist(checklistIndex)}
                    className="text-gray-500 hover:text-red-600"
                >
                    <Trash2 className="w-3 h-3" />
                </Button>
            </div>

            {totalCount > 0 && (
                <div className="mb-2">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>{Math.round(progress)}%</span>
                        <span>
                            {completedCount}/{totalCount}
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            <div className="space-y-1">
                {checklist.items.map((item, itemIdx) => (
                    <div
                        key={itemIdx}
                        className="flex items-center gap-2 group py-1 px-2 rounded hover:bg-gray-100"
                    >
                        <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() =>
                                onToggleItem(checklistIndex, itemIdx)
                            }
                            className="w-3 h-3 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                        />
                        <span
                            className={`flex-1 text-sm ${item.completed ? "line-through text-gray-500" : ""}`}
                        >
                            {item.text}
                        </span>
                        <button
                            onClick={() =>
                                onDeleteItem(checklistIndex, itemIdx)
                            }
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>

            {showAddItem ? (
                <div className="flex gap-1 mt-2">
                    <Input
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                        placeholder="Add an item..."
                        onKeyPress={(e) => e.key === "Enter" && handleAddItem()}
                        autoFocus
                        className="max-w-xl border-gray-300 text-xs"
                        id={`new-item-${checklistIndex}`}
                        name={`newItem-${checklistIndex}`}
                    />
                    <Button onClick={handleAddItem} size="xs">
                        Add
                    </Button>
                    <Button
                        onClick={() => setShowAddItem(false)}
                        size="xs"
                        variant="ghost"
                    >
                        Cancel
                    </Button>
                </div>
            ) : (
                <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setShowAddItem(true)}
                    className="mt-2 w-full text-xs text-gray-600 hover:text-gray-800"
                >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Item
                </Button>
            )}
        </div>
    );
};

export default CardModal;
