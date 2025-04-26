const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Board = require('../models/Board');
const User = require('../models/User');

// Get a board by ID
router.get('/:boardId', auth, async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId)
      .populate('user', 'email')
      .populate('members', 'email')
      .populate('lists.tasks.assignees', 'email')
      .populate('lists.tasks.comments.user', 'email');
    if (!board) {
      return res.status(404).json({ msg: 'Board not found' });
    }
    if (!board.user) {
      console.error('Board missing user:', board._id);
      return res.status(500).json({ msg: 'Invalid board data: missing user' });
    }
    if (!board.members || !Array.isArray(board.members)) {
      board.members = [board.user._id];
      await board.save();
    }
    const isAuthorized = board.user._id.toString() === req.user.id ||
                        board.members.some((m) => m._id.toString() === req.user.id);
    if (!isAuthorized) {
      return res.status(401).json({ msg: 'Unauthorized' });
    }
    res.json(board);
  } catch (err) {
    console.error('Error fetching board:', err.message, err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Get all boards for the user
router.get('/', auth, async (req, res) => {
  try {
    const boards = await Board.find({
      $or: [{ user: req.user.id }, { members: req.user.id }],
    })
      .populate('user', 'email')
      .populate('members', 'email');
    res.json(boards);
  } catch (err) {
    console.error('Error fetching boards:', err.message, err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Create a board
router.post('/', auth, async (req, res) => {
  const { title, githubRepo, background } = req.body;
  console.log('Creating board with data:', { title, githubRepo, background, user: req.user.id });
  if (!title) {
    return res.status(400).json({ msg: 'Board title is required' });
  }
  if (!req.user.id) {
    console.error('Missing user ID in request');
    return res.status(401).json({ msg: 'Invalid user data: missing user ID' });
  }
  try {
    const board = new Board({
      title,
      githubRepo,
      background: background || '#f0f0f0',
      user: req.user.id,
      members: [req.user.id],
      lists: [],
    });
    await board.save();
    const populatedBoard = await Board.findById(board._id)
      .populate('user', 'email')
      .populate('members', 'email');
    res.json(populatedBoard);
  } catch (err) {
    console.error('Error creating board:', err.message, err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Update a board
router.put('/:boardId', auth, async (req, res) => {
  const { title, githubRepo, background } = req.body;
  try {
    const board = await Board.findById(req.params.boardId);
    if (!board) {
      return res.status(404).json({ msg: 'Board not found' });
    }
    if (!board.user || board.user._id.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Only the board owner can edit' });
    }
    board.title = title || board.title;
    board.githubRepo = githubRepo || board.githubRepo;
    board.background = background || board.background;
    await board.save();
    const populatedBoard = await Board.findById(board._id)
      .populate('user', 'email')
      .populate('members', 'email');
    res.json(populatedBoard);
  } catch (err) {
    console.error('Error updating board:', err.message, err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Delete a board
router.delete('/:boardId', auth, async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId);
    if (!board) {
      return res.status(404).json({ msg: 'Board not found' });
    }
    if (!board.user || board.user._id.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Only the board owner can delete' });
    }
    await Board.deleteOne({ _id: req.params.boardId });
    res.json({ msg: 'Board deleted' });
  } catch (err) {
    console.error('Error deleting board:', err.message, err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Invite a user to a board
router.post('/:boardId/invite', auth, async (req, res) => {
  const { email } = req.body;
  try {
    const board = await Board.findById(req.params.boardId);
    if (!board) {
      return res.status(404).json({ msg: 'Board not found' });
    }
    if (!board.user || board.user._id.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Only the board owner can invite members' });
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: 'User not found' });
    if (board.members.some((m) => m._id.toString() === user._id.toString())) {
      return res.status(400).json({ msg: 'User already a member' });
    }
    board.members.push(user._id);
    await board.save();
    const populatedBoard = await Board.findById(board._id)
      .populate('user', 'email')
      .populate('members', 'email');
    res.json(populatedBoard);
  } catch (err) {
    console.error('Error inviting user:', err.message, err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Create a list
router.post('/:boardId/lists', auth, async (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ msg: 'List title is required' });
  }
  try {
    const board = await Board.findById(req.params.boardId);
    if (!board) {
      return res.status(404).json({ msg: 'Board not found' });
    }
    if (!board.user || (!board.user._id.equals(req.user.id) && !board.members.some((m) => m._id.equals(req.user.id)))) {
      return res.status(401).json({ msg: 'Unauthorized' });
    }
    const list = { title, tasks: [] };
    board.lists.push(list);
    await board.save();
    res.json(board.lists[board.lists.length - 1]);
  } catch (err) {
    console.error('Error creating list:', err.message, err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Delete a list
router.delete('/:boardId/lists/:listId', auth, async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId);
    if (!board) {
      return res.status(404).json({ msg: 'Board not found' });
    }
    if (!board.user || (!board.user._id.equals(req.user.id) && !board.members.some((m) => m._id.equals(req.user.id)))) {
      return res.status(401).json({ msg: 'Unauthorized' });
    }
    board.lists = board.lists.filter((list) => list._id.toString() !== req.params.listId);
    await board.save();
    res.json({ msg: 'List deleted' });
  } catch (err) {
    console.error('Error deleting list:', err.message, err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Create a task
router.post('/:boardId/lists/:listId/tasks', auth, async (req, res) => {
  const { title, description, dueDate, priority, assignees } = req.body;
  if (!title) {
    return res.status(400).json({ msg: 'Task title is required' });
  }
  try {
    const board = await Board.findById(req.params.boardId);
    if (!board) {
      return res.status(404).json({ msg: 'Board not found' });
    }
    if (!board.user || (!board.user._id.equals(req.user.id) && !board.members.some((m) => m._id.equals(req.user.id)))) {
      return res.status(401).json({ msg: 'Unauthorized' });
    }
    const list = board.lists.id(req.params.listId);
    if (!list) return res.status(404).json({ msg: 'List not found' });
    const task = {
      title,
      description,
      dueDate,
      priority: priority || 'Low',
      taskId: `TASK-${Math.random().toString(36).substr(2, 9)}`,
      status: 'Pending',
      assignees: assignees || [],
    };
    list.tasks.push(task);
    await board.save();
    res.json(list.tasks[list.tasks.length - 1]);
  } catch (err) {
    console.error('Error creating task:', err.message, err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Update a task
router.put('/:boardId/lists/:listId/tasks/:taskId', auth, async (req, res) => {
  const { title, description, dueDate, priority, assignees, status } = req.body;
  if (!title) {
    return res.status(400).json({ msg: 'Task title is required' });
  }
  try {
    const board = await Board.findById(req.params.boardId);
    if (!board) {
      return res.status(404).json({ msg: 'Board not found' });
    }
    if (!board.user || (!board.user._id.equals(req.user.id) && !board.members.some((m) => m._id.equals(req.user.id)))) {
      return res.status(401).json({ msg: 'Unauthorized' });
    }
    const list = board.lists.id(req.params.listId);
    if (!list) return res.status(404).json({ msg: 'List not found' });
    const task = list.tasks.id(req.params.taskId);
    if (!task) return res.status(404).json({ msg: 'Task not found' });
    task.title = title;
    task.description = description || task.description;
    task.dueDate = dueDate || task.dueDate;
    task.priority = priority || task.priority;
    task.assignees = assignees || task.assignees;
    task.status = status || task.status;
    await board.save();
    res.json(task);
  } catch (err) {
    console.error('Error updating task:', err.message, err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Delete a task
router.delete('/:boardId/lists/:listId/tasks/:taskId', auth, async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId);
    if (!board) {
      return res.status(404).json({ msg: 'Board not found' });
    }
    if (!board.user || (!board.user._id.equals(req.user.id) && !board.members.some((m) => m._id.equals(req.user.id)))) {
      return res.status(401).json({ msg: 'Unauthorized' });
    }
    const list = board.lists.id(req.params.listId);
    if (!list) return res.status(404).json({ msg: 'List not found' });
    list.tasks = list.tasks.filter((task) => task._id.toString() !== req.params.taskId);
    await board.save();
    res.json({ msg: 'Task deleted' });
  } catch (err) {
    console.error('Error deleting task:', err.message, err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Assign users to a task
router.post('/:boardId/lists/:listId/tasks/:taskId/assign', auth, async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ msg: 'User ID is required' });
  }
  try {
    const board = await Board.findById(req.params.boardId);
    if (!board) {
      return res.status(404).json({ msg: 'Board not found' });
    }
    if (!board.user || (!board.user._id.equals(req.user.id) && !board.members.some((m) => m._id.equals(req.user.id)))) {
      return res.status(401).json({ msg: 'Unauthorized' });
    }
    if (!board.members.some((m) => m._id.toString() === userId)) {
      return res.status(400).json({ msg: 'User is not a board member' });
    }
    const list = board.lists.id(req.params.listId);
    if (!list) return res.status(404).json({ msg: 'List not found' });
    const task = list.tasks.id(req.params.taskId);
    if (!task) return res.status(404).json({ msg: 'Task not found' });
    if (!task.assignees.includes(userId)) {
      task.assignees.push(userId);
    }
    await board.save();
    res.json(task);
  } catch (err) {
    console.error('Error assigning user:', err.message, err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Add a comment to a task
router.post('/:boardId/lists/:listId/tasks/:taskId/comment', auth, async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ msg: 'Comment text is required' });
  }
  try {
    const board = await Board.findById(req.params.boardId);
    if (!board) {
      return res.status(404).json({ msg: 'Board not found' });
    }
    if (!board.user || (!board.user._id.equals(req.user.id) && !board.members.some((m) => m._id.equals(req.user.id)))) {
      return res.status(401).json({ msg: 'Unauthorized' });
    }
    const list = board.lists.id(req.params.listId);
    if (!list) return res.status(404).json({ msg: 'List not found' });
    const task = list.tasks.id(req.params.taskId);
    if (!task) return res.status(404).json({ msg: 'Task not found' });
    task.comments.push({ user: req.user.id, text });
    await board.save();
    res.json(task);
  } catch (err) {
    console.error('Error adding comment:', err.message, err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Move a task
router.put('/tasks/:taskId/move', auth, async (req, res) => {
  const { newListId } = req.body;
  if (!newListId) {
    return res.status(400).json({ msg: 'New list ID is required' });
  }
  try {
    const board = await Board.findOne({ 'lists.tasks._id': req.params.taskId });
    if (!board) {
      return res.status(404).json({ msg: 'Board not found' });
    }
    if (!board.user || (!board.user._id.equals(req.user.id) && !board.members.some((m) => m._id.equals(req.user.id)))) {
      return res.status(401).json({ msg: 'Unauthorized' });
    }
    const task = board.lists
      .flatMap((list) => list.tasks)
      .find((t) => t._id.toString() === req.params.taskId);
    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }
    const sourceList = board.lists.find((list) => list.tasks.some((t) => t._id.toString() === req.params.taskId));
    sourceList.tasks = sourceList.tasks.filter((t) => t._id.toString() !== req.params.taskId);
    const destList = board.lists.id(newListId);
    if (!destList) {
      return res.status(404).json({ msg: 'Destination list not found' });
    }
    destList.tasks.push(task);
    await board.save();
    res.json({ msg: 'Task moved' });
  } catch (err) {
    console.error('Error moving task:', err.message, err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

module.exports = router;