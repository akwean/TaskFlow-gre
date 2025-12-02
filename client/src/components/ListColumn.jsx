import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';
import CardItem from './CardItem';

const ListColumn = ({ list, cards, onCreateCard, onCardClick }) => {
    const [newCardTitle, setNewCardTitle] = useState('');
    const [isAddingCard, setIsAddingCard] = useState(false);

    const { setNodeRef: setDroppableRef } = useDroppable({
        id: list._id,
    });

    const handleAddCard = async (e) => {
        e.preventDefault();
        if (!newCardTitle.trim()) return;

        await onCreateCard(list._id, newCardTitle);
        setNewCardTitle('');
        setIsAddingCard(false);
    };

    return (
        <div className="flex-shrink-0 w-72">
            <div className="bg-gray-100 rounded-lg p-3 max-h-[calc(100vh-140px)] flex flex-col">
                <h3 className="font-semibold text-gray-800 mb-3 px-2">{list.title}</h3>

                <div ref={setDroppableRef} className="flex-1 overflow-y-auto space-y-2 mb-2">
                    <SortableContext items={cards.map(c => c._id)} strategy={verticalListSortingStrategy}>
                        {cards.map((card) => (
                            <CardItem key={card._id} card={card} onClick={onCardClick} />
                        ))}
                    </SortableContext>
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
                            <Button type="submit" size="sm" className="flex-1">Add</Button>
                            <Button type="button" size="sm" variant="ghost" onClick={() => setIsAddingCard(false)}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                ) : (
                    <Button
                        onClick={() => setIsAddingCard(true)}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-gray-600 hover:bg-gray-200"
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
