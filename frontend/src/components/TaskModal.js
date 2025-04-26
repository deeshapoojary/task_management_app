import React, { useState } from "react";
import axios from "axios";

const TaskModal = ({ task, boardId, onClose, onUpdate, members }) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [dueDate, setDueDate] = useState(
    task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""
  );
  const [priority, setPriority] = useState(task.priority);
  const [assignees, setAssignees] = useState(task.assignees.map((a) => a._id));
  const [status, setStatus] = useState(task.status || "Pending");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in to update tasks");
      return;
    }
    try {
      const res = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/boards/${boardId}/lists/${task.listId}/tasks/${task._id}`,
        { title, description, dueDate, priority, assignees, status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedBoard = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/boards/${boardId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      onUpdate(updatedBoard.data);
      onClose();
    } catch (err) {
      console.error(
        "Error updating task:",
        err.response?.data,
        err.response?.status
      );
      alert(
        `Failed to update task: ${err.response?.data?.msg || "Unknown error"}`
      );
    }
  };

  const handleDelete = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in to delete tasks");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/boards/${boardId}/lists/${task.listId}/tasks/${task._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedBoard = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/boards/${boardId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      onUpdate(updatedBoard.data);
      onClose();
    } catch (err) {
      console.error(
        "Error deleting task:",
        err.response?.data,
        err.response?.status
      );
      alert(
        `Failed to delete task: ${err.response?.data?.msg || "Unknown error"}`
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-lg">
        <h2 className="text-xl font-bold text-gray-100 mb-4">Edit Task</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:border-blue-500"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:border-blue-500"
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Assignees</label>
            <select
              multiple
              value={assignees}
              onChange={(e) =>
                setAssignees(
                  Array.from(e.target.selectedOptions, (option) => option.value)
                )
              }
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:border-blue-500"
            >
              {members.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.email}
                </option>
              ))}
            </select>
          </div>
          <div className="flex space-x-2">
            <button
              type="submit"
              className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="bg-red-500 text-white p-2 rounded hover:bg-red-600"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
