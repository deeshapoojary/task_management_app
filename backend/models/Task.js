const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  dueDate: { type: Date },
  priority: { type: String, enum: ["Low", "Medium", "High"], default: "Low" },
  status: {
    type: String,
    enum: ["Open", "In Progress", "Completed"],
    default: "Open",
  },
  list: { type: mongoose.Schema.Types.ObjectId, ref: "List", required: true },
  taskId: { type: String, unique: true }, // For GitHub integration
});

module.exports = mongoose.model("Task", taskSchema);
