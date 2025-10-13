// Form validation utilities

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  email?: boolean;
  phone?: boolean;
  url?: boolean;
  custom?: (value: any) => string | null;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export class FormValidator {
  static validate(value: any, rules: ValidationRule): ValidationResult {
    // Required validation
    if (rules.required && (value === null || value === undefined || value === '')) {
      return { isValid: false, error: 'This field is required' };
    }

    // Skip other validations if value is empty and not required
    if (!rules.required && (value === null || value === undefined || value === '')) {
      return { isValid: true };
    }

    const stringValue = String(value);

    // Min length validation
    if (rules.minLength && stringValue.length < rules.minLength) {
      return { 
        isValid: false, 
        error: `Must be at least ${rules.minLength} characters long` 
      };
    }

    // Max length validation
    if (rules.maxLength && stringValue.length > rules.maxLength) {
      return { 
        isValid: false, 
        error: `Must be no more than ${rules.maxLength} characters long` 
      };
    }

    // Numeric validations
    if (typeof value === 'number' || !isNaN(Number(value))) {
      const numValue = Number(value);
      
      if (rules.min !== undefined && numValue < rules.min) {
        return { 
          isValid: false, 
          error: `Must be at least ${rules.min}` 
        };
      }

      if (rules.max !== undefined && numValue > rules.max) {
        return { 
          isValid: false, 
          error: `Must be no more than ${rules.max}` 
        };
      }
    }

    // Email validation
    if (rules.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(stringValue)) {
        return { isValid: false, error: 'Please enter a valid email address' };
      }
    }

    // Phone validation
    if (rules.phone) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      const cleanPhone = stringValue.replace(/[\s\-\(\)]/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        return { isValid: false, error: 'Please enter a valid phone number' };
      }
    }

    // URL validation
    if (rules.url) {
      try {
        new URL(stringValue);
      } catch {
        return { isValid: false, error: 'Please enter a valid URL' };
      }
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(stringValue)) {
      return { isValid: false, error: 'Please enter a valid format' };
    }

    // Custom validation
    if (rules.custom) {
      const customError = rules.custom(value);
      if (customError) {
        return { isValid: false, error: customError };
      }
    }

    return { isValid: true };
  }

  static validateForm(formData: Record<string, any>, rules: Record<string, ValidationRule>): {
    isValid: boolean;
    errors: Record<string, string>;
  } {
    const errors: Record<string, string> = {};
    let isValid = true;

    for (const [field, fieldRules] of Object.entries(rules)) {
      const result = this.validate(formData[field], fieldRules);
      if (!result.isValid && result.error) {
        errors[field] = result.error;
        isValid = false;
      }
    }

    return { isValid, errors };
  }
}

// Common validation rules
export const commonRules = {
  required: { required: true },
  email: { required: true, email: true },
  phone: { required: true, phone: true },
  password: { required: true, minLength: 6 },
  name: { required: true, minLength: 2, maxLength: 50 },
  username: { 
    required: true, 
    minLength: 3, 
    maxLength: 20,
    pattern: /^[a-zA-Z0-9_]+$/
  },
  currency: { 
    required: true, 
    min: 0,
    custom: (value: any) => {
      const num = Number(value);
      if (isNaN(num)) return 'Please enter a valid number';
      if (num < 0) return 'Amount must be positive';
      return null;
    }
  },
  percentage: {
    required: true,
    min: 0,
    max: 100,
    custom: (value: any) => {
      const num = Number(value);
      if (isNaN(num)) return 'Please enter a valid percentage';
      return null;
    }
  }
};

// Form field state management
export interface FormFieldState {
  value: any;
  error?: string;
  touched: boolean;
  dirty: boolean;
}

export class FormState {
  private fields: Record<string, FormFieldState> = {};
  private rules: Record<string, ValidationRule> = {};

  constructor(initialData: Record<string, any> = {}, validationRules: Record<string, ValidationRule> = {}) {
    this.rules = validationRules;
    
    // Initialize fields
    for (const [key, value] of Object.entries(initialData)) {
      this.fields[key] = {
        value,
        touched: false,
        dirty: false
      };
    }
  }

  setValue(field: string, value: any): void {
    if (!this.fields[field]) {
      this.fields[field] = { value, touched: false, dirty: false };
    }
    
    const isDirty = this.fields[field].value !== value;
    this.fields[field] = {
      ...this.fields[field],
      value,
      dirty: isDirty
    };

    // Validate field if it has rules
    if (this.rules[field]) {
      const result = FormValidator.validate(value, this.rules[field]);
      this.fields[field].error = result.error;
    }
  }

  setTouched(field: string, touched: boolean = true): void {
    if (!this.fields[field]) {
      this.fields[field] = { value: '', touched, dirty: false };
    } else {
      this.fields[field].touched = touched;
    }
  }

  getField(field: string): FormFieldState {
    return this.fields[field] || { value: '', touched: false, dirty: false };
  }

  getValues(): Record<string, any> {
    const values: Record<string, any> = {};
    for (const [key, field] of Object.entries(this.fields)) {
      values[key] = field.value;
    }
    return values;
  }

  getErrors(): Record<string, string> {
    const errors: Record<string, string> = {};
    for (const [key, field] of Object.entries(this.fields)) {
      if (field.error) {
        errors[key] = field.error;
      }
    }
    return errors;
  }

  isValid(): boolean {
    return Object.values(this.fields).every(field => !field.error);
  }

  validateAll(): boolean {
    for (const [field, rules] of Object.entries(this.rules)) {
      const fieldState = this.getField(field);
      const result = FormValidator.validate(fieldState.value, rules);
      this.fields[field] = {
        ...fieldState,
        error: result.error,
        touched: true
      };
    }
    return this.isValid();
  }

  reset(newData: Record<string, any> = {}): void {
    this.fields = {};
    for (const [key, value] of Object.entries(newData)) {
      this.fields[key] = {
        value,
        touched: false,
        dirty: false
      };
    }
  }
}