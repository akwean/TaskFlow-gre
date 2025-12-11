import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, LogOut } from 'lucide-react';
import api from '@/lib/api';
import { getSocket, on as onSocket, off as offSocket, joinBoard, leaveBoard } from '@/lib/realtime';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [boards, setBoards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newBoardTitle, setNewBoardTitle] = useState('');
    const [newBoardBg, setNewBoardBg] = useState('#0079bf');

    //Added search state
    const [search, setSearch] = useState('');

    const colors = [
        '#0079bf', '#d29034', '#519839', '#b04632', '#89609e',
        '#cd5a91', '#4bbf6b', '#00aecc', '#838c91'
    ];

    useEffect(() => {
        fetchBoards();
        // Listen for realtime board creation/updates/deletes
        const s = getSocket();

        const handleCreated = ({ board }) => {
            setBoards(prev => (prev.find(b => b._id === board._id) ? prev : [...prev, board]));
        };
        const handleUpdated = ({ board }) => {
            setBoards(prev => prev.map(b => (b._id === board._id ? board : b)));
        };
        const handleDeleted = ({ boardId }) => {
            setBoards(prev => prev.filter(b => b._id !== boardId));
        };
        // Targeted events for this user when they are added or removed from a board
        const handleDashboardAdded = ({ board }) => {
            setBoards(prev => (prev.find(b => b._id === board._id) ? prev : [...prev, board]));
        // Join the room to receive subsequent updates
            joinBoard(board._id);
        };
        const handleDashboardRemoved = ({ boardId }) => {
            setBoards(prev => prev.filter(b => b._id !== boardId));
            // Leave the room to stop updates
            leaveBoard(boardId);
        };

        onSocket('board:created', handleCreated);
        onSocket('board:updated', handleUpdated);
        onSocket('board:deleted', handleDeleted);
        onSocket('dashboard:boardAdded', handleDashboardAdded);
        onSocket('dashboard:boardRemoved', handleDashboardRemoved);

        // After initial fetch, join rooms
        // Cleanup on unmount
        return () => {
            offSocket('board:created', handleCreated);
            offSocket('board:updated', handleUpdated);
            offSocket('board:deleted', handleDeleted);
            offSocket('dashboard:boardAdded', handleDashboardAdded);
            offSocket('dashboard:boardRemoved', handleDashboardRemoved);
            boards.forEach(b => leaveBoard(b._id));
        };
    }, []);

    const fetchBoards = async () => {
        try {
            const { data } = await api.get('/boards');
            setBoards(data);
            setLoading(false);
            // Join each board room to receive updates on dashboard
            data.forEach(b => joinBoard(b._id));
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const handleCreateBoard = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.post('/boards', {
                title: newBoardTitle,
                background: newBoardBg,
            });
            setBoards([...boards, data]);
            setNewBoardTitle('');
            setNewBoardBg('#0079bf');
            setIsCreateOpen(false);
        } catch (error) {
            console.error(error);
        }
    };

    // Filter boards based on search
    const filteredBoards = boards.filter(board =>
        board.title.toLowerCase().includes(search.toLowerCase())
    );

   if (loading) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex space-x-2">
        <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce"></div>
        <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce delay-150"></div>
        <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce delay-300"></div>
      </div>
      <p className="mt-2 text-blue-700 font-medium">Loading...</p>
    </div>
  );
}

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <h1 className="text-2xl font-bold text-gray-900">TaskFlow</h1>
                            <span className="text-sm text-gray-500">Welcome, {user?.username}!</span>
                        </div>
                        <Button onClick={logout} variant="ghost" size="sm">
                            <LogOut className="w-4 h-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Boards</h2>

                    {/* Search Bar */}
                    <Input
                        type="text"
                        placeholder="Search boards..."
                        className="mb-6 max-w-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">

                        {/* Create Board Card */}
                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <button className="h-32 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all flex items-center justify-center group">
                                    <div className="text-center">
                                        <Plus className="w-8 h-8 mx-auto text-gray-400 group-hover:text-gray-600 mb-2" />
                                        <span className="text-sm font-medium text-gray-600 group-hover:text-gray-800">
                                            Create new board
                                        </span>
                                    </div>
                                </button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create New Board</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleCreateBoard} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Board Title</label>
                                        <Input
                                            type="text"
                                            value={newBoardTitle}
                                            onChange={(e) => setNewBoardTitle(e.target.value)}
                                            placeholder="Enter board title..."
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
                                        <div className="grid grid-cols-5 gap-2">
                                            {colors.map((color) => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    onClick={() => setNewBoardBg(color)}
                                                    className={`h-12 rounded-md transition-all ${newBoardBg === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <Button type="submit" className="w-full">Create Board</Button>
                                </form>
                            </DialogContent>
                        </Dialog>

                        {/* Board Cards */}
                        {filteredBoards.map((board) => (
                            <button
                                key={board._id}
                                onClick={() => navigate(`/board/${board._id}`)}
                                className="h-32 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105 flex items-center justify-center relative overflow-hidden group"
                                style={{ backgroundColor: board.background }}
                            >
                                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity" />
                                <h3 className="text-white font-semibold text-lg px-4 text-center relative z-10">
                                    {board.title}
                                </h3>
                            </button>
                        ))}
                    </div>

                    {filteredBoards.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No matching boards found.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
