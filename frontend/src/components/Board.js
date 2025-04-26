import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import TaskModal from './TaskModal';
import InviteMember from './InviteMember';

const Board = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [newListTitle, setNewListTitle] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    const fetchBoard = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/boards/${boardId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBoard(res.data);
      } catch (err) {
        console.error('Error fetching board:', err.response?.data, err.response?.status);
        alert(`Failed to load board: ${err.response?.data?.msg || 'Unknown error'}`);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      }
    };
    fetchBoard();
  }, [boardId, navigate]);

  const handleCreateList = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    if (!newListTitle.trim()) {
      alert('List title is required');
      return;
    }
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/boards/${boardId}/lists`,
        { title: newListTitle },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBoard({
        ...board,
        lists: [...board.lists, res.data],
      });
      setNewListTitle('');
    } catch (err) {
      console.error('Error creating list:', err.response?.data, err.response?.status);
      alert(`Failed to create list: ${err.response?.data?.msg || 'Unknown error'}`);
    }
  };

  const handleDeleteList = async (listId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this list?')) return;
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/boards/${boardId}/lists/${listId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBoard({
        ...board,
        lists: board.lists.filter((list) => list._id !== listId),
      });
    } catch (err) {
      console.error('Error deleting list:', err.response?.data, err.response?.status);
      alert(`Failed to delete list: ${err.response?.data?.msg || 'Unknown error'}`);
    }
  };

  const handleDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination) return;

    const sourceList = board.lists.find((list) => list._id === source.droppableId);
    const destList = board.lists.find((list) => list._id === destination.droppableId);
    const task = sourceList.tasks[source.index];

    if (source.droppableId === destination.droppableId) {
      const newTasks = Array.from(sourceList.tasks);
      newTasks.splice(source.index, 1);
      newTasks.splice(destination.index, 0, task);
      const newLists = board.lists.map((list) =>
        list._id === source.droppableId ? { ...list, tasks: newTasks } : list
      );
      setBoard({ ...board, lists: newLists });
    } else {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        await axios.put(
          `${process.env.REACT_APP_API_URL}/api/boards/tasks/${task._id}/move`,
          { newListId: destination.droppableId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const sourceTasks = Array.from(sourceList.tasks);
        sourceTasks.splice(source.index, 1);
        const destTasks = Array.from(destList.tasks);
        destTasks.splice(destination.index, 0, task);
        const newLists = board.lists.map((list) => {
          if (list._id === source.droppableId) return { ...list, tasks: sourceTasks };
          if (list._id === destination.droppableId) return { ...list, tasks: destTasks };
          return list;
        });
        setBoard({ ...board, lists: newLists });
      } catch (err) {
        console.error('Error moving task:', err.response?.data, err.response?.status);
        alert(`Failed to move task: ${err.response?.data?.msg || 'Unknown error'}`);
      }
    }
  };

  const checkCommits = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/github/check-commits/${boardId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedBoard = await axios.get(`${process.env.REACT_APP_API_URL}/api/boards/${boardId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBoard(updatedBoard.data);
      if (res.data.matchedCommits.length > 0) {
        alert(`Tasks completed: ${res.data.matchedCommits.map((m) => m.taskId).join(', ')}`);
      } else {
        alert('No new tasks completed from commits');
      }
    } catch (err) {
      console.error('Error checking commits:', err.response?.data, err.response?.status);
      alert(`Failed to check commits: ${err.response?.data?.msg || 'Unknown error'}`);
    }
  };

  const openTaskModal = (task, listId) => {
    setSelectedTask({ ...task, listId });
  };

  if (!board) return <div className="text-center p-6 text-gray-100 bg-gray-900">Loading...</div>;

  return (
    <div
      className="min-h-screen p-6 bg-gray-900"
      style={{
        background: board.background.startsWith('#')
          ? board.background
          : `url(${board.background}) no-repeat center/cover`,
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6 bg-gray-800 bg-opacity-80 p-4 rounded-lg">
          <h1 className="text-3xl font-bold text-gray-100">{board.title}</h1>
          <div className="flex space-x-4">
            <p className="text-gray-400">
              Members: {board.members.map((m) => m.email).join(', ')}
            </p>
            <button
              onClick={() => setShowInviteModal(true)}
              className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              Invite Member
            </button>
            {board.githubRepo && (
              <button
                onClick={checkCommits}
                className="bg-purple-500 text-white p-2 rounded hover:bg-purple-600"
              >
                Check GitHub Commits
              </button>
            )}
          </div>
        </div>
        <form onSubmit={handleCreateList} className="mb-6 flex">
          <input
            type="text"
            placeholder="New List Title"
            value={newListTitle}
            onChange={(e) => setNewListTitle(e.target.value)}
            className="p-2 rounded-l bg-gray-700 border border-gray-600 text-gray-100 flex-grow focus:outline-none focus:border-blue-500"
            required
          />
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded-r hover:bg-blue-600"
          >
            Add List
          </button>
        </form>
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex space-x-4 overflow-x-auto pb-4">
            {board.lists.map((list) => (
              <Droppable droppableId={list._id} key={list._id}>
                {(provided) => (
                  <div
                    className="bg-gray-800 p-4 rounded-lg w-80 flex-shrink-0"
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold text-gray-100">{list.title}</h2>
                      <button
                        onClick={() => handleDeleteList(list._id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                    {list.tasks.map((task, index) => (
                      <Draggable key={task._id} draggableId={task._id} index={index}>
                        {(provided) => (
                          <div
                            className="bg-gray-700 p-4 rounded-lg shadow mb-2 cursor-pointer hover:shadow-md"
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => openTaskModal(task, list._id)}
                          >
                            <h3 className="font-bold text-gray-100">{task.title}</h3>
                            <p className="text-gray-400 text-sm">{task.description}</p>
                            {task.dueDate && (
                              <p className="text-sm text-gray-400">
                                Due: {new Date(task.dueDate).toLocaleDateString()}
                              </p>
                            )}
                            <p className="text-sm text-gray-400">Priority: {task.priority}</p>
                            <p className="text-sm text-gray-400">Status: {task.status}</p>
                            {task.assignees.length > 0 && (
                              <p className="text-sm text-gray-400">
                                Assignees: {task.assignees.map((a) => a.email).join(', ')}
                              </p>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const title = e.target[0].value;
                        const token = localStorage.getItem('token');
                        if (!token) {
                          navigate('/login');
                          return;
                        }
                        axios
                          .post(
                            `${process.env.REACT_APP_API_URL}/api/boards/${boardId}/lists/${list._id}/tasks`,
                            { title, priority: 'Low' },
                            { headers: { Authorization: `Bearer ${token}` } }
                          )
                          .then((res) => {
                            setBoard({
                              ...board,
                              lists: board.lists.map((l) =>
                                l._id === list._id
                                  ? { ...l, tasks: [...l.tasks, res.data] }
                                  : l
                              ),
                            });
                            e.target.reset();
                          })
                          .catch((err) => {
                            console.error('Error creating task:', err.response?.data, err.response?.status);
                            alert(`Failed to create task: ${err.response?.data?.msg || 'Unknown error'}`);
                          });
                      }}
                      className="mt-4"
                    >
                      <input
                        type="text"
                        placeholder="New Task Title"
                        className="p-2 rounded w-full mb-2 bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:border-blue-500"
                        required
                      />
                      <button
                        type="submit"
                        className="bg-green-500 text-white p-2 rounded w-full hover:bg-green-600"
                      >
                        Add Task
                      </button>
                    </form>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
        {selectedTask && (
          <TaskModal
            task={selectedTask}
            boardId={boardId}
            onClose={() => setSelectedTask(null)}
            onUpdate={(updatedBoard) => setBoard(updatedBoard)}
            members={board.members}
          />
        )}
        {showInviteModal && (
          <InviteMember
            boardId={boardId}
            onClose={() => setShowInviteModal(false)}
            onInvite={(updatedBoard) => setBoard(updatedBoard)}
          />
        )}
      </div>
    </div>
  );
};

export default Board;