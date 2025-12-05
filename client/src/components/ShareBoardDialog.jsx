import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, X } from 'lucide-react';
import api from '@/lib/api';

const ShareBoardDialog = ({ board, onUpdate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAddMember = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { data } = await api.post(`/boards/${board._id}/members`, { email });
            onUpdate(data);
            setEmail('');
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add member');
        } finally {
            setLoading(false);
        }
    };

    const [removeUserId, setRemoveUserId] = useState(null);
    const [showRemoveDialog, setShowRemoveDialog] = useState(false);

    const handleRemoveMember = async () => {
        if (!removeUserId) return;
        try {
            const { data } = await api.delete(`/boards/${board._id}/members/${removeUserId}`);
            onUpdate(data);
            setShowRemoveDialog(false);
            setRemoveUserId(null);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white hover:bg-opacity-20">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Share
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Share Board</DialogTitle>
                    <DialogDescription>
                        Invite members to collaborate on this board by entering their email address.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Add Member Form */}
                    <form onSubmit={handleAddMember} className="space-y-3">
                        <div>
                            <Label>Email Address</Label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter email to invite..."
                                required
                            />
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? 'Adding...' : 'Add Member'}
                        </Button>
                    </form>

                    {/* Current Members */}
                    <div>
                        <Label className="mb-2 block">Board Members ({board.members?.length || 0})</Label>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {board.members?.map((member) => (
                                <div key={member._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                                            {member.user?.username?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{member.user?.username}</p>
                                            <p className="text-xs text-gray-500">{member.user?.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500 px-2 py-1 bg-gray-200 rounded">
                                            {member.role}
                                        </span>
                                        {member.user?._id !== board.owner?._id && (
                                            <button
                                                onClick={() => { setRemoveUserId(member.user._id); setShowRemoveDialog(true); }}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                                {/* Remove Member Confirmation Dialog */}
                                                <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>Remove Member</DialogTitle>
                                                            <DialogDescription>
                                                                Are you sure you want to remove this member from the board? They will lose access immediately.
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <DialogFooter>
                                                            <Button variant="outline" onClick={() => setShowRemoveDialog(false)}>
                                                                Cancel
                                                            </Button>
                                                            <Button variant="destructive" onClick={handleRemoveMember}>
                                                                Remove
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ShareBoardDialog;
