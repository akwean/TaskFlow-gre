import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Calendar, CheckSquare } from 'lucide-react';

const CardItem = ({ card, isDragging = false, onClick }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging: isSortableDragging,
    } = useSortable({ id: card._id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isSortableDragging ? 0.5 : 1,
    };

    const handleClick = (e) => {
        // Don't open modal if dragging
        if (!isSortableDragging && onClick) {
            onClick(card);
        }
    };

    // Calculate checklist progress
    const totalItems = card.checklists?.reduce((sum, cl) => sum + cl.items.length, 0) || 0;
    const completedItems = card.checklists?.reduce(
        (sum, cl) => sum + cl.items.filter(item => item.completed).length,
        0
    ) || 0;

    const isNew =
        Date.now() - new Date(card.createdAt).getTime() < 60 * 1000; // < 1 minute

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        >
            <Card
                className="p-3 bg-white shadow-sm hover:shadow-md transition-shadow relative"
                onClick={handleClick}
            >
                {/* NEW BADGE */}
                {isNew && (
                    <span className="absolute top-2 right-2 bg-blue-500/90 text-white text-xs px-2 py-[1px] rounded-full shadow">
                        New
                    </span>
                )}

                <p className="text-sm text-gray-800 mb-2 truncate" title={card.title}>
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
