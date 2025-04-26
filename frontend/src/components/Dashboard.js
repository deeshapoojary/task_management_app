import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [title, setTitle] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [background, setBackground] = useState('#f0f0f0');
  const [editBoardId, setEditBoardId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editGithubRepo, setEditGithubRepo] = useState('');
  const [editBackground, setEditBackground] = useState('#f0f0f0');

  useEffect(() => {
    const fetchBoards = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, redirecting to login');
        navigate('/login');
        return;
      }
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/boards`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBoards(res.data);
      } catch (err) {
        console.error('Error fetching boards:', err.response?.data, err.response?.status);
        alert(`Failed to fetch boards: ${err.response?.data?.msg || 'Unknown error'}`);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      }
    };
    fetchBoards();
  }, [navigate]);

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    if (!title.trim()) {
      alert('Board title is required');
      return;
    }
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/boards`,
        { title, githubRepo, background },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBoards([...boards, res.data]);
      setTitle('');
      setGithubRepo('');
      setBackground('#f0f0f0');
      alert('Board created successfully');
    } catch (err) {
      console.error('Error creating board:', err.response?.data, err.response?.status);
      alert(`Failed to create board: ${err.response?.data?.msg || 'Unknown error'}`);
    }
  };

  const handleEditBoard = async (e, boardId) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const res = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/boards/${boardId}`,
        { title: editTitle, githubRepo: editGithubRepo, background: editBackground },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBoards(boards.map((board) => (board._id === boardId ? res.data : board)));
      setEditBoardId(null);
      alert('Board updated successfully');
    } catch (err) {
      console.error('Error updating board:', err.response?.data, err.response?.status);
      alert(`Failed to update board: ${err.response?.data?.msg || 'Unknown error'}`);
    }
  };

  const handleDeleteBoard = async (boardId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this board?')) return;
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/boards/${boardId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBoards(boards.filter((board) => board._id !== boardId));
      alert('Board deleted successfully');
    } catch (err) {
      console.error('Error deleting board:', err.response?.data, err.response?.status);
      alert(`Failed to delete board: ${err.response?.data?.msg || 'Unknown error'}`);
    }
  };

  const calculateProgress = (board) => {
    const totalTasks = board.lists.flatMap((list) => list.tasks).length;
    const completedTasks = board.lists.flatMap((list) => list.tasks).filter((task) => task.status === 'Completed').length;
    return totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-900 text-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Your Boards</h1>
      <form onSubmit={handleCreateBoard} className="mb-6 bg-gray-800 p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Board Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="p-2 rounded bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:border-blue-500"
            required
          />
          <input
            type="text"
            placeholder="GitHub Repo (owner/repo)"
            value={githubRepo}
            onChange={(e) => setGithubRepo(e.target.value)}
            className="p-2 rounded bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:border-blue-500"
          />
          <input
            type="text"
            placeholder="Background (color or URL)"
            value={background}
            onChange={(e) => setBackground(e.target.value)}
            className="p-2 rounded bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          className="mt-4 bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Create Board
        </button>
      </form>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {boards.map((board) => (
          <div
            key={board._id}
            className="bg-gray-800 p-4 rounded-lg shadow hover:shadow-lg"
          >
            {editBoardId === board._id ? (
              <form onSubmit={(e) => handleEditBoard(e, board._id)} className="mb-4">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="p-2 rounded bg-gray-700 border border-gray-600 text-gray-100 w-full mb-2"
                  required
                />
                <input
                  type="text"
                  value={editGithubRepo}
                  onChange={(e) => setEditGithubRepo(e.target.value)}
                  className="p-2 rounded bg-gray-700 border border-gray-600 text-gray-100 w-full mb-2"
                />
                <input
                  type="text"
                  value={editBackground}
                  onChange={(e) => setEditBackground(e.target.value)}
                  className="p-2 rounded bg-gray-700 border border-gray-600 text-gray-100 w-full mb-2"
                />
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="bg-green-500 text-white p-2 rounded hover:bg-green-600"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditBoardId(null)}
                    className="bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <h2
                  className="text-xl font-bold cursor-pointer"
                  onClick={() => navigate(`/board/${board._id}`)}
                >
                  {board.title}
                </h2>
                {board.githubRepo && (
                  <p className="text-gray-400">GitHub: {board.githubRepo}</p>
                )}
                <p className="text-gray-400">
                  Members: {board.members.map((m) => m.email).join(', ')}
                </p>
                <div
                  className="h-16 mt-2 rounded"
                  style={{ background: board.background }}
                ></div>
                <div className="mt-2">
                  <div className="text-gray-400">Progress: {Math.round(calculateProgress(board))}%</div>
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-blue-500 h-2.5 rounded-full"
                      style={{ width: `${calculateProgress(board)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={() => {
                      setEditBoardId(board._id);
                      setEditTitle(board.title);
                      setEditGithubRepo(board.githubRepo || '');
                      setEditBackground(board.background);
                    }}
                    className="bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteBoard(board._id)}
                    className="bg-red-500 text-white p-2 rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;