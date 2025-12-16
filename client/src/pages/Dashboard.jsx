import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, LogOut } from "lucide-react";
import api from "@/lib/api";
import {
    on as onSocket,
    off as offSocket,
    joinBoard,
    leaveBoard,
} from "@/lib/realtime";

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [boards, setBoards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newBoardTitle, setNewBoardTitle] = useState("");
    const [newBoardBg, setNewBoardBg] = useState("#0079bf");

    // Sorting feature
    const [sortType, setSortType] = useState("recent");

    const colors = [
        "#0079bf",
        "#d29034",
        "#519839",
        "#b04632",
        "#89609e",
        "#cd5a91",
        "#4bbf6b",
        "#00aecc",
        "#838c91",
    ];

    // Fetch Boards and Realtime
    useEffect(() => {
        const fetchBoards = async () => {
            try {
                const { data } = await api.get("/boards");
                setBoards(data);
                setLoading(false);
                data.forEach((b) => joinBoard(b._id));
            } catch (error) {
                console.error(error);
                setLoading(false);
            }
        };
        fetchBoards();

        const handleCreated = ({ board }) => {
            setBoards((prev) =>
                prev.some((b) => b._id === board._id) ? prev : [...prev, board],
            );
        };

        const handleUpdated = ({ board }) => {
            setBoards((prev) =>
                prev.map((b) => (b._id === board._id ? board : b)),
            );
        };

        const handleDeleted = ({ boardId }) => {
            setBoards((prev) => prev.filter((b) => b._id !== boardId));
        };

        const handleDashboardAdded = ({ board }) => {
            setBoards((prev) =>
                prev.some((b) => b._id === board._id) ? prev : [...prev, board],
            );
            joinBoard(board._id);
        };

        const handleDashboardRemoved = ({ boardId }) => {
            setBoards((prev) => prev.filter((b) => b._id !== boardId));
            leaveBoard(boardId);
        };

        onSocket("board:created", handleCreated);
        onSocket("board:updated", handleUpdated);
        onSocket("board:deleted", handleDeleted);
        onSocket("dashboard:boardAdded", handleDashboardAdded);
        onSocket("dashboard:boardRemoved", handleDashboardRemoved);

        return () => {
            offSocket("board:created", handleCreated);
            offSocket("board:updated", handleUpdated);
            offSocket("board:deleted", handleDeleted);
            offSocket("dashboard:boardAdded", handleDashboardAdded);
            offSocket("dashboard:boardRemoved", handleDashboardRemoved);
            boards.forEach((b) => leaveBoard(b._id));
        };
    }, [boards]);

    // Sorting Logic
    const getSortedBoards = () => {
        let sorted = [...boards];

        if (sortType === "az") {
            sorted.sort((a, b) => a.title.localeCompare(b.title));
        } else if (sortType === "za") {
            sorted.sort((a, b) => b.title.localeCompare(a.title));
        } else if (sortType === "recent") {
            sorted.sort(
                (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
            );
        } else if (sortType === "oldest") {
            sorted.sort(
                (a, b) => new Date(a.updatedAt) - new Date(b.updatedAt),
            );
        }

        return sorted;
    };

    // Create Board
    const handleCreateBoard = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.post("/boards", {
                title: newBoardTitle,
                background: newBoardBg,
            });

            setBoards([...boards, data]);
            setNewBoardTitle("");
            setNewBoardBg("#0079bf");
            setIsCreateOpen(false);
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                Loading...
            </div>
        );
    }

    const sortedBoards = getSortedBoards();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <h1 className="text-2xl font-bold text-gray-900">
                                TaskFlow
                            </h1>
                            <span className="text-sm text-gray-500">
                                Welcome, {user?.username}!
                            </span>
                        </div>

                        <Button onClick={logout} variant="ghost" size="sm">
                            <LogOut className="w-4 h-4 mr-2" /> Logout
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-800">
                            Your Boards
                        </h2>

                        <select
                            className="border rounded px-2 py-1"
                            value={sortType}
                            onChange={(e) => setSortType(e.target.value)}
                        >
                            <option value="az">A–Z</option>
                            <option value="za">Z–A</option>
                            <option value="recent">Most Recent</option>
                            <option value="oldest">Oldest</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                        <Dialog
                            open={isCreateOpen}
                            onOpenChange={setIsCreateOpen}
                        >
                            <DialogTrigger asChild>
                                <button className="h-32 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all flex items-center justify-center group">
                                    <div className="text-center">
                                        <Plus className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                        <span className="text-sm font-medium text-gray-600">
                                            Create new board
                                        </span>
                                    </div>
                                </button>
                            </DialogTrigger>

                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create New Board</DialogTitle>
                                </DialogHeader>

                                <form
                                    onSubmit={handleCreateBoard}
                                    className="space-y-4"
                                >
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Board Title
                                        </label>
                                        <Input
                                            type="text"
                                            value={newBoardTitle}
                                            onChange={(e) =>
                                                setNewBoardTitle(e.target.value)
                                            }
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Background Color
                                        </label>
                                        <div className="grid grid-cols-5 gap-2">
                                            {colors.map((color) => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    onClick={() =>
                                                        setNewBoardBg(color)
                                                    }
                                                    className={`h-12 rounded-md ${newBoardBg === color ? "ring-2 ring-blue-500" : ""}`}
                                                    style={{
                                                        backgroundColor: color,
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <Button type="submit" className="w-full">
                                        Create
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>

                        {sortedBoards.map((board) => (
                            <div
                                key={board._id}
                                onClick={() => navigate(`/board/${board._id}`)}
                                className="relative h-32 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105 overflow-hidden group cursor-pointer"
                                style={{ backgroundColor: board.background }}
                            >
                                <div className="absolute inset-0 flex items-center justify-center text-center">
                                    <h3 className="text-white font-semibold text-lg">
                                        {board.title}
                                    </h3>
                                </div>
                            </div>
                        ))}
                    </div>

                    {boards.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            No boards yet. Create your first one!
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
