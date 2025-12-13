import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Calendar, CheckSquare } from "lucide-react";

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

const CardItem = ({ card, isDragging = false, onClick }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging: isSortableDragging,
    } = useSortable({ id: card._id });

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
                className={`p-3 bg-white transition-shadow ${isOverlay ? "shadow-xl ring-1 ring-black/10" : "shadow-sm hover:shadow-md"}`}
                onClick={handleClick}
            >
                <p
                    className="text-sm text-gray-800 mb-2 truncate"
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
        </div>
    );
};

export default CardItem;
