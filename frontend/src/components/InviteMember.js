import React, { useState } from 'react';
import axios from 'axios';

const InviteMember = ({ boardId, onClose, onInvite }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleInvite = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to invite members');
      return;
    }
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/boards/${boardId}/invite`,
        { email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onInvite(res.data);
      onClose();
    } catch (err) {
      console.error('Error inviting member:', err.response?.data, err.response?.status);
      setError(err.response?.data?.msg || 'Failed to invite member');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-100 mb-4">Invite Member</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleInvite}>
          <input
            type="email"
            placeholder="Member's Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-gray-100 mb-4 focus:outline-none focus:border-blue-500"
            required
          />
          <div className="flex space-x-2">
            <button
              type="submit"
              className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              Invite
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

export default InviteMember;