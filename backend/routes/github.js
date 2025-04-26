const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Board = require('../models/Board');
const axios = require('axios');

router.post('/check-commits/:boardId', auth, async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId);
    if (!board) {
      return res.status(404).json({ msg: 'Board not found' });
    }
    if (!board.user || (!board.user._id.equals(req.user.id) && !board.members.some((m) => m._id.equals(req.user.id)))) {
      return res.status(401).json({ msg: 'Unauthorized' });
    }
    if (!board.githubRepo) {
      return res.status(400).json({ msg: 'No GitHub repository linked to this board' });
    }
    const [owner, repo] = board.githubRepo.split('/');
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/commits`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );
    const commits = response.data;
    const matchedCommits = [];
    for (const list of board.lists) {
      for (const task of list.tasks) {
        if (task.status === 'Completed') continue;
        const commit = commits.find((c) =>
          c.commit.message.includes(task.taskId)
        );
        if (commit) {
          task.status = 'Completed';
          matchedCommits.push({ taskId: task.taskId, commit: commit.sha });
        }
      }
    }
    await board.save();
    res.json({ matchedCommits });
  } catch (err) {
    console.error('Error checking commits:', err.message, err.stack);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

module.exports = router;