'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { User } from '@/lib/types';
import { generateId } from '@/lib/utils';
import { Plus, Trash2, Edit, Save, X, Check, Shield, User as UserIcon, Crown, Lock, Eye, EyeOff } from 'lucide-react';

export default function UserManagement() {
  const { users, addUser, updateUser, deleteUser, resetPassword } = useAuthStore();
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleAddUser = () => {
    const newUser: User = {
      id: generateId(),
      username: '',
      password: 'temp123', // Default temporary password
      role: 'user',
      name: '',
      email: '',
      isActive: true,
      requiresPasswordChange: true, // New users must change password on first login
      createdAt: new Date(),
      updatedAt: new Date()
    };
    addUser(newUser);
    setEditingUser(newUser.id);
  };

  const handleDeleteUser = (id: string) => {
    const user = users.find(u => u.id === id);
    if (user?.username === 'Camryn') {
      setMessage({ type: 'error', text: 'Cannot delete the default admin user (Camryn).' });
      return;
    }
    deleteUser(id);
    setMessage({ type: 'success', text: 'User deleted successfully!' });
  };

  const handleEditUser = (id: string) => {
    setEditingUser(id);
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
  };

  const handleUpdateUser = (id: string, updates: Partial<User>) => {
    const user = users.find(u => u.id === id);
    if (user?.username === 'Camryn') {
      setMessage({ type: 'error', text: 'Cannot edit the default admin user (Camryn).' });
      return;
    }
    
    updateUser(id, { ...updates, updatedAt: new Date() });
  };

  const handleSaveUser = (id: string) => {
    setEditingUser(null);
    setMessage({ type: 'success', text: 'User updated successfully!' });
  };

  const handleResetPassword = (userId: string) => {
    setResetPasswordUser(userId);
    setNewPassword('');
  };

  const handleConfirmResetPassword = () => {
    if (!resetPasswordUser || !newPassword.trim()) {
      setMessage({ type: 'error', text: 'Please enter a new password' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      return;
    }

    resetPassword(resetPasswordUser, newPassword);
    setResetPasswordUser(null);
    setNewPassword('');
    setMessage({ type: 'success', text: 'Password reset successfully! User will be required to change password on next login.' });
  };

  const handleCancelResetPassword = () => {
    setResetPasswordUser(null);
    setNewPassword('');
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4 text-purple-600" />;
      case 'manager':
        return <Shield className="w-4 h-4 text-blue-600" />;
      default:
        return <UserIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold gradient-text">User Management</h2>
        <button
          onClick={handleAddUser}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add User</span>
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold">Name</th>
                <th className="text-left py-3 px-4 font-semibold">Username</th>
                <th className="text-left py-3 px-4 font-semibold">Email</th>
                <th className="text-left py-3 px-4 font-semibold">Role</th>
                <th className="text-left py-3 px-4 font-semibold">Status</th>
                <th className="text-left py-3 px-4 font-semibold">Password</th>
                <th className="text-left py-3 px-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    {editingUser === user.id ? (
                      <input
                        type="text"
                        value={user.name}
                        onChange={(e) => handleUpdateUser(user.id, { name: e.target.value })}
                        className="input w-full"
                      />
                    ) : (
                      <span className="font-medium">{user.name}</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {editingUser === user.id ? (
                      <input
                        type="text"
                        value={user.username}
                        onChange={(e) => handleUpdateUser(user.id, { username: e.target.value })}
                        className="input w-full"
                        disabled={user.username === 'Camryn'}
                      />
                    ) : (
                      <span className="font-medium">{user.username}</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {editingUser === user.id ? (
                      <input
                        type="email"
                        value={user.email}
                        onChange={(e) => handleUpdateUser(user.id, { email: e.target.value })}
                        className="input w-full"
                      />
                    ) : (
                      <span>{user.email}</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {editingUser === user.id ? (
                      <select
                        value={user.role}
                        onChange={(e) => handleUpdateUser(user.id, { role: e.target.value as 'admin' | 'manager' | 'user' })}
                        className="input w-full"
                        disabled={user.username === 'Camryn'}
                      >
                        <option value="user">User</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <div className="flex items-center space-x-2">
                        {getRoleIcon(user.role)}
                        <span className={`px-2 py-1 rounded-full text-xs ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {editingUser === user.id ? (
                      <input
                        type="checkbox"
                        checked={user.isActive}
                        onChange={(e) => handleUpdateUser(user.id, { isActive: e.target.checked })}
                        className="w-4 h-4 text-blue-600"
                        disabled={user.username === 'Camryn'}
                      />
                    ) : (
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.requiresPasswordChange 
                          ? 'bg-orange-100 text-orange-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {user.requiresPasswordChange ? 'Change Required' : 'Set'}
                      </span>
                      {user.username !== 'Camryn' && (
                        <button
                          onClick={() => handleResetPassword(user.id)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Reset Password"
                        >
                          <Lock className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      {editingUser === user.id ? (
                        <>
                          <button
                            onClick={() => handleSaveUser(user.id)}
                            className="p-1 text-green-600 hover:text-green-800"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1 text-gray-600 hover:text-gray-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditUser(user.id)}
                            className="p-1 text-blue-600 hover:text-blue-800"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {user.username !== 'Camryn' && (
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-1 text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">User Management Information</h3>
        <ul className="text-blue-800 text-sm space-y-1">
          <li><strong>Admin:</strong> Full access to all features including admin panel</li>
          <li><strong>Manager:</strong> Access to calculator with manager pricing</li>
          <li><strong>User:</strong> Access to calculator with user pricing</li>
          <li><strong>Camryn:</strong> Default admin user that cannot be modified or deleted</li>
          <li><strong>Password Status:</strong> New users must change password on first login</li>
        </ul>
      </div>

      {/* Password Reset Modal */}
      {resetPasswordUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h2>
              <p className="text-gray-600">
                Set a new temporary password for{' '}
                <span className="font-semibold">
                  {users.find(u => u.id === resetPasswordUser)?.name || 'this user'}
                </span>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">New Temporary Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input pr-10"
                    placeholder="Enter new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters long</p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleConfirmResetPassword}
                  disabled={!newPassword.trim() || newPassword.length < 6}
                  className="btn btn-primary flex-1"
                >
                  Reset Password
                </button>
                <button
                  onClick={handleCancelResetPassword}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 