import { useState, useEffect, useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, MoreVertical, GripVertical } from "lucide-react";
import CardItem from "./CardItem";

const ListColumn = ({
    list,
    cards,
    onCreateCard,
    onCardClick,
    onUpdateList,
    onDeleteList,
    onListFocus,
    listPresenceCount = 0,
}) => {
    const [newCardTitle, setNewCardTitle] = useState("");
    const [isAddingCard, setIsAddingCard] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editingTitle, setEditingTitle] = useState(list.title);
    const menuRef = useRef(null);
    const hoveredRef = useRef(false);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showMenu]);

    const { setNodeRef: setDroppableRef, isOver: isOverList } = useDroppable({
        id: list._id,
    });
    const { setNodeRef: setEndRef, isOver: isOverEnd } = useDroppable({
        id: `${list._id}__end`,
    });

    // Make the entire list sortable (drag to reorder lists)
    const {
        attributes,
        listeners,
        setNodeRef: setSortableRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: list._id });
    const style = {
        transform: transform ? CSS.Transform.toString(transform) : undefined,
        transition,
    };

    const handleAddCard = async (e) => {
        e.preventDefault();
        if (!newCardTitle.trim()) return;

        await onCreateCard(list._id, newCardTitle);
        setNewCardTitle("");
        setIsAddingCard(false);
    };

    const handleSaveTitle = async () => {
        if (editingTitle.trim() === list.title) {
            setIsEditingTitle(false);
            return;
        }

        try {
            await onUpdateList(list._id, editingTitle.trim());
            setIsEditingTitle(false);
        } catch (error) {
            console.error(error);
            setEditingTitle(list.title);
            setIsEditingTitle(false);
        }
    };

    return (
        <div
            ref={setSortableRef}
            style={style}
            className={`flex-shrink-0 w-64 sm:w-72 transition-transform duration-150 ${isDragging ? "opacity-70 scale-105" : ""}`}
            onMouseEnter={() => {
                if (!hoveredRef.current) {
                    hoveredRef.current = true;
                    onListFocus?.(list._id, true);
                }
            }}
            onMouseLeave={() => {
                if (hoveredRef.current) {
                    hoveredRef.current = false;
                    onListFocus?.(list._id, false);
                }
            }}
        >
            <div className="bg-gray-100 rounded-lg p-2 sm:p-3 max-h-[calc(100vh-140px)] flex flex-col">
                <div className="flex items-center justify-between mb-3 px-2">
                    {isEditingTitle ? (
                        <Input
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onBlur={handleSaveTitle}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveTitle();
                                if (e.key === "Escape") {
                                    setEditingTitle(list.title);
                                    setIsEditingTitle(false);
                                }
                            }}
                            className="font-semibold text-gray-800 bg-transparent border-none outline-none p-0 h-auto text-sm"
                            autoFocus
                        />
                    ) : (
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2 flex-1 text-sm sm:text-base">
                            <button
                                className="text-gray-500 hover:text-gray-700 cursor-grab active:cursor-grabbing"
                                title="Drag list"
                                {...attributes}
                                {...listeners}
                            >
                                <GripVertical className="w-4 h-4" />
                            </button>
                            <span
                                className="cursor-pointer"
                                onClick={() => setIsEditingTitle(true)}
                            >
                                {list.title}
                            </span>
                        </h3>
                    )}
                    <div className="relative flex items-center gap-2">
                        {listPresenceCount > 0 && (
                            <span className="inline-flex items-center justify-center text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-200">
                                {listPresenceCount} here
                            </span>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowMenu(!showMenu)}
                            className="h-6 w-6 p-0"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </Button>
                        {showMenu && (
                            <div
                                ref={menuRef}
                                className="absolute right-0 top-6 bg-white border border-gray-200 rounded-md shadow-lg z-10 w-32"
                            >
                                <button
                                    onClick={() => {
                                        setIsEditingTitle(true);
                                        setShowMenu(false);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                                >
                                    Rename
                                </button>
                                <button
                                    onClick={() => {
                                        onDeleteList(list._id);
                                        setShowMenu(false);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 text-red-600"
                                >
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div
                    ref={setDroppableRef}
                    className={`flex-1 overflow-y-auto space-y-2 mb-2 relative transition-colors duration-150 ${isOverList ? "ring-2 ring-blue-400 bg-blue-50/40 rounded-md" : ""}`}
                >
                    {/* Subtle highlight overlay when dragging over this list */}
                    {isOverList && (
                        <div className="absolute inset-0 pointer-events-none rounded-md bg-blue-50/60"></div>
                    )}

                    <SortableContext
                        items={cards.map((c) => c._id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {cards.map((card) => (
                            <CardItem
                                key={card._id}
                                card={card}
                                onClick={onCardClick}
                            />
                        ))}
                    </SortableContext>

                    {/* Bottom drop target to allow placing at the end explicitly */}
                    <div
                        ref={setEndRef}
                        className={`h-8 mt-1 rounded-md ${isOverEnd ? "border-2 border-dashed border-blue-500 bg-blue-50 shadow-inner" : "border border-dashed border-transparent"}`}
                    />
                </div>

                {isAddingCard ? (
                    <form onSubmit={handleAddCard} className="space-y-2">
                        <Input
                            type="text"
                            value={newCardTitle}
                            onChange={(e) => setNewCardTitle(e.target.value)}
                            placeholder="Enter card title..."
                            autoFocus
                            className="text-sm"
                        />
                        <div className="flex space-x-2">
                            <Button type="submit" size="sm" className="flex-1">
                                Add
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => setIsAddingCard(false)}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                ) : (
                    <Button
                        onClick={() => setIsAddingCard(true)}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-gray-600 hover:bg-gray-200 text-sm"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add a card
                    </Button>
                )}
            </div>
        </div>
    );
};

export default ListColumn;
