'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { FormValidator, commonRules } from '@/lib/validation';
import { toast, showValidationErrors } from '@/lib/toast';

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PasswordChangeModal({ isOpen, onClose }: PasswordChangeModalProps) {
  const { user, changePassword } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (!isOpen || !user) return null;

  const validateField = (field: string, value: string) => {
    let validationError = '';
    
    switch (field) {
      case 'currentPassword':
        if (!value) {
          validationError = 'Current password is required';
        } else if (value !== user?.password) {
          validationError = 'Current password is incorrect';
        }
        break;
      case 'newPassword':
        const passwordResult = FormValidator.validate(value, commonRules.password);
        if (!passwordResult.isValid) {
          validationError = passwordResult.error || '';
        } else if (value === currentPassword) {
          validationError = 'New password must be different from current password';
        }
        break;
      case 'confirmPassword':
        if (!value) {
          validationError = 'Please confirm your new password';
        } else if (value !== newPassword) {
          validationError = 'Passwords do not match';
        }
        break;
    }

    setFieldErrors(prev => ({
      ...prev,
      [field]: validationError
    }));

    return !validationError;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate all fields
    const isCurrentPasswordValid = validateField('currentPassword', currentPassword);
    const isNewPasswordValid = validateField('newPassword', newPassword);
    const isConfirmPasswordValid = validateField('confirmPassword', confirmPassword);

    if (!isCurrentPasswordValid || !isNewPasswordValid || !isConfirmPasswordValid) {
      showValidationErrors(fieldErrors);
      setIsLoading(false);
      return;
    }

    try {
      await changePassword(user.id, newPassword);
      setSuccess(true);
      toast.success('Password Changed', 'Your password has been successfully updated.');
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setFieldErrors({});
      }, 2000);
    } catch {
      toast.error('Change Failed', 'Failed to change password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
        {success ? (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Changed!</h2>
            <p className="text-gray-600">Your password has been successfully updated.</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Change Password</h2>
              <p className="text-gray-600">Please set a new password for your account.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <FormField
                label="Current Password"
                required
                error={fieldErrors.currentPassword}
              >
                <Input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    if (fieldErrors.currentPassword) {
                      validateField('currentPassword', e.target.value);
                    }
                  }}
                  onBlur={() => validateField('currentPassword', currentPassword)}
                  placeholder="Enter current password"
                  isInvalid={!!fieldErrors.currentPassword}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  }
                  required
                />
              </FormField>

              <FormField
                label="New Password"
                required
                description="Must be at least 6 characters long"
                error={fieldErrors.newPassword}
              >
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (fieldErrors.newPassword) {
                      validateField('newPassword', e.target.value);
                    }
                    if (confirmPassword && fieldErrors.confirmPassword) {
                      validateField('confirmPassword', confirmPassword);
                    }
                  }}
                  onBlur={() => validateField('newPassword', newPassword)}
                  placeholder="Enter new password"
                  isInvalid={!!fieldErrors.newPassword}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  }
                  required
                />
              </FormField>

              <FormField
                label="Confirm New Password"
                required
                error={fieldErrors.confirmPassword}
              >
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (fieldErrors.confirmPassword) {
                      validateField('confirmPassword', e.target.value);
                    }
                  }}
                  onBlur={() => validateField('confirmPassword', confirmPassword)}
                  placeholder="Confirm new password"
                  isInvalid={!!fieldErrors.confirmPassword}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  }
                  required
                />
              </FormField>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary flex-1"
                >
                  {isLoading ? 'Changing Password...' : 'Change Password'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
} 