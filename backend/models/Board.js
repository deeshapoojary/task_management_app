const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  dueDate: { type: Date },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
  taskId: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },
  assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    },
  ],
});

const ListSchema = new mongoose.Schema({
  title: { type: String, required: true },
  tasks: [TaskSchema],
});

const BoardSchema = new mongoose.Schema({
  title: { type: String, required: true },
  githubRepo: { type: String },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  background: { type: String, default: '#f0f0f0' }, // Color or image URL
  lists: [ListSchema],
});

module.exports = mongoose.model('Board', BoardSchema);