import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';

const CardItem = ({ card, isDragging = false }) => {
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

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        >
            <Card className="p-3 bg-white shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm text-gray-800">{card.title}</p>
                {card.labels && card.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {card.labels.map((label, idx) => (
                            <span
                                key={idx}
                                className="px-2 py-1 text-xs rounded"
                                style={{ backgroundColor: label.color, color: 'white' }}
                            >
                                {label.name}
                            </span>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
};

export default CardItem;
