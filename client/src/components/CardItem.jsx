import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import {
    Calendar,
    CheckSquare,
    MoreHorizontal,
    Trash2,
    Edit,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Custom Move Modal for Cards
const CardMoveModal = ({
    isOpen,
    onClose,
    card,
    allLists,
    allCards,
    selectedListId,
    setSelectedListId,
    selectedPosition,
    setSelectedPosition,
    onMove,
    currentPosition,
}) => {
    const [isMobile, setIsMobile] = useState(false);

    // Check if mobile on mount and resize
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        checkMobile();
        window.addEventListener("resize", checkMobile);

        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const isMoveDisabled =
        selectedListId === card.list && selectedPosition === currentPosition;

    return (
        <div className="card-move-modal-overlay">
            <div
                className="card-move-modal-content"
                role="dialog"
                aria-modal="true"
            >
                <header className="card-move-modal-header">
                    <h2>Move Card</h2>
                    <button
                        className="card-move-modal-close"
                        aria-label="Close"
                        type="button"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </header>
                <form
                    className="card-move-modal-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (!isMoveDisabled) {
                            onMove(
                                card._id,
                                selectedListId,
                                selectedPosition - 1,
                            );
                            onClose();
                        }
                    }}
                >
                    <div className="card-move-modal-group">
                        <label htmlFor="move-list">List</label>
                        <div className="select-wrapper">
                            <select
                                id="move-list"
                                value={selectedListId}
                                onChange={(e) => {
                                    setSelectedListId(e.target.value);
                                    setSelectedPosition(1);
                                }}
                                className={isMobile ? "mobile-select" : ""}
                            >
                                {allLists.map((list) => (
                                    <option key={list._id} value={list._id}>
                                        {list.title}{" "}
                                        {list._id === card.list
                                            ? "(current)"
                                            : ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="card-move-modal-group">
                        <label htmlFor="move-position">Position</label>
                        <div className="select-wrapper">
                            <select
                                id="move-position"
                                value={selectedPosition}
                                onChange={(e) =>
                                    setSelectedPosition(Number(e.target.value))
                                }
                                className={isMobile ? "mobile-select" : ""}
                            >
                                {Array.from(
                                    {
                                        length:
                                            (allCards[selectedListId] || [])
                                                .length + 1,
                                    },
                                    (_, i) => i + 1,
                                ).map((pos) => (
                                    <option key={pos} value={pos}>
                                        {pos}{" "}
                                        {selectedListId === card.list &&
                                        pos === currentPosition
                                            ? "(current)"
                                            : ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {isMobile && (
                            <div className="mobile-hint">
                                Tap to open position selector
                            </div>
                        )}
                    </div>
                    <button
                        type="submit"
                        className="card-move-modal-btn"
                        disabled={isMoveDisabled}
                    >
                        Move
                    </button>
                </form>
            </div>
            <style>{`
        .card-move-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.18);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
          box-sizing: border-box;
        }

        .card-move-modal-content {
          background: #fff;
          border-radius: 10px;
          box-shadow: 0 4px 32px rgba(0,0,0,0.12);
          padding: 1.5rem;
          width: 100%;
          max-width: 300px;
          box-sizing: border-box;
          max-height: 90vh;
          overflow-y: auto;
        }

        @media (max-width: 480px) {
          .card-move-modal-content {
            padding: 1.25rem;
            max-width: 90vw;
            margin: 0;
          }
          .card-move-modal-group select {
            max-width: 200px;
            width: 100%;
            min-width: 0;
            box-sizing: border-box;
            display: inline-block;
            font-size: 1rem;
            padding: 0.5rem 0.75rem;
            line-height: 1.5;
          }
        }

        @media (max-width: 320px) {
          .card-move-modal-content {
            padding: 1rem;
            max-width: 95vw;
          }
        }

        .card-move-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
        }

        .card-move-modal-header h2 {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0;
          color: #333;
        }

        .card-move-modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          line-height: 1;
          cursor: pointer;
          color: #666;
          transition: color 0.2s;
          padding: 0.25rem;
          margin: -0.25rem;
        }

        .card-move-modal-close:hover,
        .card-move-modal-close:focus {
          color: #222;
        }

        .card-move-modal-form .card-move-modal-group {
          margin-bottom: 1.5rem;
        }

        .card-move-modal-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #444;
          font-size: 0.9rem;
        }

        .select-wrapper {
          position: relative;
        }

        .card-move-modal-group select {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.95rem;
          background: #fafbfc;
          transition: all 0.2s;
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.75rem center;
          background-size: 1rem;
          padding-right: 2.5rem;
          cursor: pointer;
        }

        /* Mobile-specific select styling */
        .card-move-modal-group select.mobile-select {
          font-size: 1rem;
          padding: 1rem;
          min-height: 3rem;
        }

        .card-move-modal-group select:focus {
          border-color: #6366f1;
          outline: none;
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
        }

        /* Compact select dropdown options */
        .card-move-modal-group select option {
          padding: 0.5rem 0.75rem;
          font-size: 0.9rem;
          min-height: 1.5rem;
          line-height: 1.5;
        }

        /* Mobile hint text */
        .mobile-hint {
          font-size: 0.8rem;
          color: #666;
          margin-top: 0.5rem;
          text-align: center;
          font-style: italic;
        }

        /* Hide hint on desktop */
        @media (min-width: 769px) {
          .mobile-hint {
            display: none;
          }
        }

        /* iOS-specific fixes */
        @supports (-webkit-touch-callout: none) {
          .card-move-modal-group select {
            font-size: 1rem;
          }
        }

        .card-move-modal-btn {
          width: 100%;
          padding: 0.75rem;
          background: #6366f1;
          color: #fff;
          border: none;
          border-radius: 6px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .card-move-modal-btn:disabled {
          background: #d1d5db;
          cursor: not-allowed;
        }

        @media (max-width: 480px) {
          .card-move-modal-btn {
            padding: 1rem;
            font-size: 1rem;
          }
        }

        .card-move-modal-btn:hover:not(:disabled),
        .card-move-modal-btn:focus:not(:disabled) {
          background: #4f46e5;
        }

        /* Prevent body scroll */
        body.modal-open {
          overflow: hidden;
          position: fixed;
          width: 100%;
          height: 100%;
        }
      `}</style>
        </div>
    );
};

/**
 * Presentational drag clone used for DragOverlay.
 * Renders a semi-transparent, non-interactive clone of a card.
 */
export const CardDragClone = ({ card }) => {
    // Simple presentational clone — no dnd-kit hooks here
    const totalItems =
        card.checklists?.reduce((sum, cl) => sum + cl.items.length, 0) || 0;
    const completedItems =
        card.checklists?.reduce(
            (sum, cl) => sum + cl.items.filter((item) => item.completed).length,
            0,
        ) || 0;

    return (
        <div className="pointer-events-none select-none transform scale-105 opacity-90">
            <Card className="p-3 bg-white shadow-xl ring-1 ring-black/10">
                <p
                    className="text-sm text-gray-800 mb-2 truncate"
                    title={card.title}
                >
                    {card.title}
                </p>

                {card.labels && card.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                        {card.labels.map((label, idx) => (
                            <span
                                key={idx}
                                className="h-2 w-10 rounded-full"
                                style={{ backgroundColor: label.color }}
                                title={label.name}
                            />
                        ))}
                    </div>
                )}

                <div className="flex items-center gap-3 text-xs text-gray-600">
                    {card.dueDate && (
                        <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(card.dueDate).toLocaleDateString()}
                        </div>
                    )}
                    {totalItems > 0 && (
                        <div className="flex items-center gap-1">
                            <CheckSquare className="w-3 h-3" />
                            {completedItems}/{totalItems}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

const CardItem = ({
    card,
    isDragging = false,
    onClick,
    onDelete,
    onMove,
    allLists = [],
    allCards = {},
}) => {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [selectedListId, setSelectedListId] = useState(card.list);
    const [selectedPosition, setSelectedPosition] = useState(1);

    // Calculate current position
    const currentListCards = allCards[card.list] || [];
    const currentIndex = currentListCards.findIndex((c) => c._id === card._id);
    const currentPosition = currentIndex + 1;
    const menuRef = useRef(null);
    const buttonRef = useRef(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging: isSortableDragging,
    } = useSortable({ id: card._id });

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            document.addEventListener("mousedown", handleClickOutside);
            // Position the menu
            if (buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect();
                setMenuPosition({
                    top: rect.bottom + window.scrollY,
                    left: rect.right + window.scrollX - 128, // 128 is w-32 width
                });
            }
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showMenu]);

    // When rendering as the overlay clone (isDragging prop passed from DragOverlay),
    // we want a simplified visual: slightly larger, semi-transparent, and non-interactive.
    const isOverlay = Boolean(isDragging);

    const computedStyle = isOverlay
        ? {
              // For overlay clone don't apply the sortable transform — let overlay positioning handle it
              transform: undefined,
              transition: undefined,
              opacity: 0.95,
          }
        : {
              transform: CSS.Transform.toString(transform),
              transition,
              opacity: isSortableDragging ? 0.5 : 1,
          };

    const handleClick = () => {
        // Don't open modal if dragging
        if (!isSortableDragging && onClick && !isOverlay) {
            onClick(card);
        }
    };

    // Calculate checklist progress
    const totalItems =
        card.checklists?.reduce((sum, cl) => sum + cl.items.length, 0) || 0;
    const completedItems =
        card.checklists?.reduce(
            (sum, cl) => sum + cl.items.filter((item) => item.completed).length,
            0,
        ) || 0;

    return (
        <div
            // Only attach node ref when not rendering as overlay clone
            ref={isOverlay ? null : setNodeRef}
            style={computedStyle}
            {...(!isOverlay ? attributes : {})}
            {...(!isOverlay ? listeners : {})}
            className={`${isOverlay ? "cursor-grabbing pointer-events-none" : "cursor-grab"}`}
        >
            <Card
                className={`p-3 bg-white transition-shadow relative ${isOverlay ? "shadow-xl ring-1 ring-black/10" : "shadow-sm hover:shadow-md"}`}
                onClick={handleClick}
            >
                <div className="absolute top-2 right-2">
                    <button
                        ref={buttonRef}
                        className="p-1 rounded hover:bg-gray-100"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(!showMenu);
                        }}
                    >
                        <MoreHorizontal className="w-4 h-4 text-gray-600" />
                    </button>
                    {showMenu &&
                        createPortal(
                            <div
                                ref={menuRef}
                                className="fixed bg-white border border-gray-200 rounded-md shadow-lg z-50 w-32"
                                style={{
                                    top: menuPosition.top,
                                    left: menuPosition.left,
                                }}
                            >
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowMenu(false);
                                        onClick(card);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center"
                                >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Rename
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowMenu(false);
                                        setShowMoveModal(true);
                                        setSelectedListId(card.list);
                                        setSelectedPosition(currentPosition);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center"
                                >
                                    Move
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowMenu(false);
                                        setShowDeleteDialog(true);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 text-red-600 flex items-center"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                </button>
                            </div>,
                            document.body,
                        )}
                </div>
                <p
                    className="text-sm text-gray-800 mb-2 truncate pr-8"
                    title={card.title}
                >
                    {card.title}
                </p>

                {/* Labels */}
                {card.labels && card.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                        {card.labels.map((label, idx) => (
                            <span
                                key={idx}
                                className="h-2 w-10 rounded-full"
                                style={{ backgroundColor: label.color }}
                                title={label.name}
                            />
                        ))}
                    </div>
                )}

                {/* Metadata */}
                <div className="flex items-center gap-3 text-xs text-gray-600">
                    {card.dueDate && (
                        <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(card.dueDate).toLocaleDateString()}
                        </div>
                    )}
                    {totalItems > 0 && (
                        <div className="flex items-center gap-1">
                            <CheckSquare className="w-3 h-3" />
                            {completedItems}/{totalItems}
                        </div>
                    )}
                </div>
            </Card>

            {/* Move Card Modal */}
            <CardMoveModal
                isOpen={showMoveModal}
                onClose={() => setShowMoveModal(false)}
                card={card}
                allLists={allLists}
                allCards={allCards}
                selectedListId={selectedListId}
                setSelectedListId={setSelectedListId}
                selectedPosition={selectedPosition}
                setSelectedPosition={setSelectedPosition}
                onMove={onMove}
                currentPosition={currentPosition}
            />

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Card</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this card? This
                            action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                onDelete && onDelete(card._id);
                                setShowDeleteDialog(false);
                            }}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CardItem;
