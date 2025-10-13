'use client';

import { useState } from 'react';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';
import { FormValidator, commonRules } from '@/lib/validation';
import { Mail, Phone, User, Eye, EyeOff } from 'lucide-react';
import { toast, showValidationErrors } from '@/lib/toast';

interface DemoFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: string;
  bio: string;
  newsletter: boolean;
  terms: boolean;
}

export default function DemoForm() {
  const [formData, setFormData] = useState<DemoFormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: '',
    bio: '',
    newsletter: false,
    terms: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validationRules: Record<keyof DemoFormData, any> = {
    name: commonRules.name,
    email: commonRules.email,
    phone: commonRules.phone,
    password: commonRules.password,
    confirmPassword: {
      required: true,
      custom: (value: string) => {
        if (value !== formData.password) {
          return 'Passwords do not match';
        }
        return null;
      }
    },
    role: { required: true },
    bio: { maxLength: 500 },
    newsletter: {},
    terms: {
      required: true,
      custom: (value: boolean) => {
        if (!value) {
          return 'You must accept the terms and conditions';
        }
        return null;
      }
    }
  };

  const handleInputChange = (field: keyof DemoFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateField = (field: keyof DemoFormData) => {
    const rules = validationRules[field];
    if (!rules || Object.keys(rules).length === 0) return;

    const result = FormValidator.validate(formData[field], rules);
    setErrors(prev => ({
      ...prev,
      [field]: result.error || ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate all fields
    const { isValid, errors: validationErrors } = FormValidator.validateForm(formData, validationRules);
    setErrors(validationErrors);

    if (!isValid) {
      showValidationErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(
        'Account Created!',
        'Your account has been created successfully. Welcome aboard!',
        { duration: 5000 }
      );

      // Reset form after successful submission
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: '',
        bio: '',
        newsletter: false,
        terms: false
      });
      setErrors({});
    } catch {
      toast.error(
        'Submission Failed',
        'There was an error creating your account. Please try again.',
        { duration: 7000 }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="card">
        <div className="mb-6">
          <h2 className="text-2xl font-bold gradient-text mb-2">Enhanced Form Demo</h2>
          <p className="text-gray-600">
            This form demonstrates the new form components with validation, error handling, and improved UX.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <FormField
            label="Full Name"
            required
            description="Enter your first and last name"
            error={errors.name}
          >
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              onBlur={() => validateField('name')}
              placeholder="John Doe"
              isInvalid={!!errors.name}
              leftIcon={<User className="w-5 h-5" />}
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Email Address"
              required
              error={errors.email}
            >
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                onBlur={() => validateField('email')}
                placeholder="john@example.com"
                isInvalid={!!errors.email}
                leftIcon={<Mail className="w-5 h-5" />}
              />
            </FormField>

            <FormField
              label="Phone Number"
              required
              error={errors.phone}
            >
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                onBlur={() => validateField('phone')}
                placeholder="+27 XX XXX XXXX"
                isInvalid={!!errors.phone}
                leftIcon={<Phone className="w-5 h-5" />}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Password"
              required
              description="Must be at least 6 characters"
              error={errors.password}
            >
              <Input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                onBlur={() => validateField('password')}
                placeholder="Enter password"
                isInvalid={!!errors.password}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                }
              />
            </FormField>

            <FormField
              label="Confirm Password"
              required
              error={errors.confirmPassword}
            >
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                onBlur={() => validateField('confirmPassword')}
                placeholder="Confirm password"
                isInvalid={!!errors.confirmPassword}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                }
              />
            </FormField>
          </div>

          <FormField
            label="Role"
            required
            error={errors.role}
          >
            <Select
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value)}
              onBlur={() => validateField('role')}
              placeholder="Select your role"
              isInvalid={!!errors.role}
            >
              <option value="user">User</option>
              <option value="manager">Manager</option>
              <option value="admin">Administrator</option>
            </Select>
          </FormField>

          <FormField
            label="Bio"
            description="Tell us a bit about yourself (optional, max 500 characters)"
            error={errors.bio}
          >
            <Textarea
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              onBlur={() => validateField('bio')}
              placeholder="Write a short bio..."
              isInvalid={!!errors.bio}
              rows={4}
            />
          </FormField>

          <div className="space-y-4">
            <Checkbox
              checked={formData.newsletter}
              onChange={(e) => handleInputChange('newsletter', e.target.checked)}
              label="Subscribe to newsletter"
              description="Receive updates about new features and announcements"
            />

            <FormField error={errors.terms}>
              <Checkbox
                checked={formData.terms}
                onChange={(e) => handleInputChange('terms', e.target.checked)}
                onBlur={() => validateField('terms')}
                label="I accept the terms and conditions"
                description="You must accept our terms to create an account"
                isInvalid={!!errors.terms}
                required
              />
            </FormField>
          </div>

          <div className="flex space-x-4 pt-6">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setFormData({
                  name: '',
                  email: '',
                  phone: '',
                  password: '',
                  confirmPassword: '',
                  role: '',
                  bio: '',
                  newsletter: false,
                  terms: false
                });
                setErrors({});
              }}
            >
              Reset Form
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}