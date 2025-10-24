'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { User } from '@/lib/types';
import { generateId } from '@/lib/utils';
import { Plus, Trash2, Edit, X, Check, Shield, User as UserIcon, Crown, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from '@/lib/toast';

export default function UserManagement() {
  const { users, addUser, updateUser, deleteUser, resetPassword } = useAuthStore();
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Local state for editing user data
  const [editingUserData, setEditingUserData] = useState<Partial<User>>({});

  const handleAddUser = () => {
    const newUserId = generateId();
    setEditingUser(newUserId);
    setEditingUserData({
      id: newUserId,
      username: '',
      password: 'temp123',
      role: 'user',
      name: '',
      email: '',
      isActive: true,
      requiresPasswordChange: true
    });
  };

  const handleDeleteUser = async (id: string) => {
    const user = users.find(u => u.id === id);
    if (user?.username === 'Camryn') {
      toast.error('Cannot Delete User', 'The default admin user (Camryn) cannot be deleted.');
      return;
    }
    
    try {
      await deleteUser(id);
      toast.success('User Deleted', 'User has been successfully removed from the system.');
    } catch {
      toast.error('Delete Failed', 'Failed to delete user. Please try again.');
    }
  };

  const handleEditUser = (id: string) => {
    const user = users.find(u => u.id === id);
    if (user) {
      setEditingUser(id);
      setEditingUserData({ ...user });
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditingUserData({});
  };

  const handleUpdateUser = (id: string, updates: Partial<User>) => {
    const user = users.find(u => u.id === id);
    if (user?.username === 'Camryn') {
      toast.warning('Cannot Edit User', 'The default admin user (Camryn) cannot be modified.');
      return;
    }
    
    // Update local state instead of calling API
    setEditingUserData(prev => ({ ...prev, ...updates }));
  };

  const handleSaveUser = async (id: string) => {
    try {
      // Check if this is a new user or existing user
      const existingUser = users.find(u => u.id === id);
      
      if (existingUser) {
        // Update existing user
        await updateUser(id, { 
          ...editingUserData, 
          updatedAt: new Date() 
        });
        toast.success('User Updated', 'User information has been successfully updated.');
      } else {
        // Create new user
        const newUser: User = {
          ...editingUserData as User,
          id,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await addUser(newUser);
        toast.success('User Created', 'New user has been successfully added to the system.');
      }
      
      // Small delay to ensure state updates properly
      setTimeout(() => {
        setEditingUser(null);
        setEditingUserData({});
      }, 100);
    } catch {
      toast.error('Save Failed', 'Failed to save user. Please try again.');
    }
  };

  const handleResetPassword = (userId: string) => {
    setResetPasswordUser(userId);
    setNewPassword('');
  };

  const handleConfirmResetPassword = async () => {
    if (!resetPasswordUser || !newPassword.trim()) {
      toast.error('Validation Error', 'Please enter a new password.');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Validation Error', 'Password must be at least 6 characters long.');
      return;
    }

    try {
      await resetPassword(resetPasswordUser, newPassword);
      setResetPasswordUser(null);
      setNewPassword('');
      toast.success('Password Reset', 'Password has been reset successfully. User will be required to change it on next login.');
    } catch {
      toast.error('Reset Failed', 'Failed to reset password. Please try again.');
    }
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
          aria-label="Add new user"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Add User</span>
        </button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block card">
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
                            {/* Show existing users */}
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    {editingUser === user.id ? (
                      <input
                        type="text"
                        value={editingUserData.name || ''}
                        onChange={(e) => handleUpdateUser(user.id, { name: e.target.value })}
                        className="input w-full"
                        placeholder="Enter full name"
                      />
                    ) : (
                      <span className="font-medium">{user.name}</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {editingUser === user.id ? (
                      <input
                        type="text"
                        value={editingUserData.username || ''}
                        onChange={(e) => handleUpdateUser(user.id, { username: e.target.value })}
                        className="input w-full"
                        placeholder="Enter username"
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
                        value={editingUserData.email || ''}
                        onChange={(e) => handleUpdateUser(user.id, { email: e.target.value })}
                        className="input w-full"
                        placeholder="user@company.com"
                      />
                    ) : (
                      <span>{user.email}</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {editingUser === user.id ? (
                      <select
                        value={editingUserData.role || 'user'}
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
                        checked={editingUserData.isActive || false}
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
                          className="p-1 text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                          title="Reset Password"
                          aria-label={`Reset password for ${user.name}`}
                        >
                          <Lock className="w-4 h-4" aria-hidden="true" />
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
                            className="p-1 text-green-600 hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
                            aria-label={`Save changes for ${user.name}`}
                          >
                            <Check className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1 text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded"
                            aria-label="Cancel editing"
                          >
                            <X className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditUser(user.id)}
                            className="p-1 text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                            aria-label={`Edit ${user.name}`}
                          >
                            <Edit className="w-4 h-4" aria-hidden="true" />
                          </button>
                          {user.username !== 'Camryn' && (
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-1 text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                              aria-label={`Delete ${user.name}`}
                            >
                              <Trash2 className="w-4 h-4" aria-hidden="true" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              
              {/* Show new user row when adding */}
              {editingUser && !users.find(u => u.id === editingUser) && (
                <tr className="border-b border-gray-100 hover:bg-gray-50 bg-blue-50">
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      value={editingUserData.name || ''}
                      onChange={(e) => handleUpdateUser(editingUser, { name: e.target.value })}
                      className="input w-full"
                      placeholder="Enter name"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      value={editingUserData.username || ''}
                      onChange={(e) => handleUpdateUser(editingUser, { username: e.target.value })}
                      className="input w-full"
                      placeholder="Enter username"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="email"
                      value={editingUserData.email || ''}
                      onChange={(e) => handleUpdateUser(editingUser, { email: e.target.value })}
                      className="input w-full"
                      placeholder="Enter email"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={editingUserData.role || 'user'}
                      onChange={(e) => handleUpdateUser(editingUser, { role: e.target.value as 'admin' | 'manager' | 'user' })}
                      className="input w-full"
                    >
                      <option value="user">User</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={editingUserData.isActive || false}
                      onChange={(e) => handleUpdateUser(editingUser, { isActive: e.target.checked })}
                      className="w-4 h-4 text-blue-600"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                        Change Required
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSaveUser(editingUser)}
                        disabled={!editingUserData.name || !editingUserData.username || !editingUserData.email}
                        className="p-1 text-green-600 hover:text-green-800 disabled:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
                        aria-label="Save new user"
                      >
                        <Check className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-1 text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded"
                        aria-label="Cancel adding user"
                      >
                        <X className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {/* Existing users */}
        {users.map((user) => (
          <div key={user.id} className="bg-white/60 backdrop-blur-sm rounded-lg p-3 shadow-sm border border-gray-200">
            {/* User Header */}
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                {editingUser === user.id ? (
                  <input
                    type="text"
                    value={editingUserData.name || ''}
                    onChange={(e) => handleUpdateUser(user.id, { name: e.target.value })}
                    className="input w-full text-sm font-semibold mb-1"
                    placeholder="Enter full name"
                  />
                ) : (
                  <h3 className="font-semibold text-sm text-gray-900">{user.name}</h3>
                )}
                {editingUser === user.id ? (
                  <input
                    type="text"
                    value={editingUserData.username || ''}
                    onChange={(e) => handleUpdateUser(user.id, { username: e.target.value })}
                    className="input w-full text-xs mt-1"
                    placeholder="Enter username"
                    disabled={user.username === 'Camryn'}
                  />
                ) : (
                  <p className="text-xs text-gray-600">@{user.username}</p>
                )}
              </div>
              <div className="ml-2">
                {editingUser === user.id ? (
                  <select
                    value={editingUserData.role || 'user'}
                    onChange={(e) => handleUpdateUser(user.id, { role: e.target.value as 'admin' | 'manager' | 'user' })}
                    className="input text-xs p-1"
                    disabled={user.username === 'Camryn'}
                  >
                    <option value="user">User</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                ) : (
                  <div className="flex items-center space-x-1">
                    {getRoleIcon(user.role)}
                    <span className={`px-2 py-0.5 rounded-full text-xs ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* User Details */}
            <div className="space-y-2 text-xs mb-3 bg-gray-50 rounded-lg p-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                {editingUser === user.id ? (
                  <input
                    type="email"
                    value={editingUserData.email || ''}
                    onChange={(e) => handleUpdateUser(user.id, { email: e.target.value })}
                    className="input text-xs p-1 flex-1 ml-2"
                    placeholder="user@company.com"
                  />
                ) : (
                  <span className="font-medium text-gray-900">{user.email}</span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status:</span>
                {editingUser === user.id ? (
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editingUserData.isActive || false}
                      onChange={(e) => handleUpdateUser(user.id, { isActive: e.target.checked })}
                      className="w-4 h-4 text-blue-600"
                      disabled={user.username === 'Camryn'}
                    />
                    <span className="text-xs">Active</span>
                  </label>
                ) : (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Password:</span>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    user.requiresPasswordChange 
                      ? 'bg-orange-100 text-orange-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {user.requiresPasswordChange ? 'Change Required' : 'Set'}
                  </span>
                  {user.username !== 'Camryn' && editingUser !== user.id && (
                    <button
                      onClick={() => handleResetPassword(user.id)}
                      className="p-1.5 text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded touch-manipulation active:scale-95"
                      title="Reset Password"
                      aria-label={`Reset password for ${user.name}`}
                    >
                      <Lock className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {editingUser === user.id ? (
                <>
                  <button
                    onClick={() => handleSaveUser(user.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium touch-manipulation active:scale-95 min-h-[44px]"
                    aria-label={`Save changes for ${user.name}`}
                  >
                    <Check className="w-4 h-4" aria-hidden="true" />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium touch-manipulation active:scale-95 min-h-[44px]"
                    aria-label="Cancel editing"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                    <span>Cancel</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleEditUser(user.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium touch-manipulation active:scale-95 min-h-[44px]"
                    aria-label={`Edit ${user.name}`}
                  >
                    <Edit className="w-4 h-4" aria-hidden="true" />
                    <span>Edit</span>
                  </button>
                  {user.username !== 'Camryn' && (
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium touch-manipulation active:scale-95 min-h-[44px]"
                      aria-label={`Delete ${user.name}`}
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                      <span>Delete</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}

        {/* New user card when adding */}
        {editingUser && !users.find(u => u.id === editingUser) && (
          <div className="bg-blue-50 backdrop-blur-sm rounded-lg p-3 shadow-sm border-2 border-blue-300">
            {/* User Header */}
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={editingUserData.name || ''}
                  onChange={(e) => handleUpdateUser(editingUser, { name: e.target.value })}
                  className="input w-full text-sm font-semibold mb-1"
                  placeholder="Enter full name"
                />
                <input
                  type="text"
                  value={editingUserData.username || ''}
                  onChange={(e) => handleUpdateUser(editingUser, { username: e.target.value })}
                  className="input w-full text-xs mt-1"
                  placeholder="Enter username"
                />
              </div>
              <div className="ml-2">
                <select
                  value={editingUserData.role || 'user'}
                  onChange={(e) => handleUpdateUser(editingUser, { role: e.target.value as 'admin' | 'manager' | 'user' })}
                  className="input text-xs p-1"
                >
                  <option value="user">User</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            {/* User Details */}
            <div className="space-y-2 text-xs mb-3 bg-white rounded-lg p-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <input
                  type="email"
                  value={editingUserData.email || ''}
                  onChange={(e) => handleUpdateUser(editingUser, { email: e.target.value })}
                  className="input text-xs p-1 flex-1 ml-2"
                  placeholder="user@company.com"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status:</span>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editingUserData.isActive || false}
                    onChange={(e) => handleUpdateUser(editingUser, { isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-xs">Active</span>
                </label>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Password:</span>
                <span className="px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-800">
                  Change Required
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => handleSaveUser(editingUser)}
                disabled={!editingUserData.name || !editingUserData.username || !editingUserData.email}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium touch-manipulation active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                aria-label="Save new user"
              >
                <Check className="w-4 h-4" aria-hidden="true" />
                <span>Save</span>
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium touch-manipulation active:scale-95 min-h-[44px]"
                aria-label="Cancel adding user"
              >
                <X className="w-4 h-4" aria-hidden="true" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        )}
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
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-password-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCancelResetPassword();
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-blue-600" aria-hidden="true" />
              </div>
              <h2 id="reset-password-title" className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h2>
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
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
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