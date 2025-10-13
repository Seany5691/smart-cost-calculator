// Toast notification utility
// This provides a simple API for showing toast notifications throughout the app

import { Toast } from '@/components/ui/Toast';

// Store the toast context functions
let toastContext: {
  addToast: (toast: Omit<Toast, 'id'>) => void;
} | null = null;

export function setToastContext(context: { addToast: (toast: Omit<Toast, 'id'>) => void }) {
  toastContext = context;
}

// Toast notification functions
export const toast = {
  success: (title: string, description?: string, options?: Partial<Toast>) => {
    if (toastContext) {
      toastContext.addToast({ type: 'success', title, description, ...options });
    }
  },
  error: (title: string, description?: string, options?: Partial<Toast>) => {
    if (toastContext) {
      toastContext.addToast({ type: 'error', title, description, ...options });
    }
  },
  warning: (title: string, description?: string, options?: Partial<Toast>) => {
    if (toastContext) {
      toastContext.addToast({ type: 'warning', title, description, ...options });
    }
  },
  info: (title: string, description?: string, options?: Partial<Toast>) => {
    if (toastContext) {
      toastContext.addToast({ type: 'info', title, description, ...options });
    }
  }
};

// Helper function to show validation errors
export function showValidationErrors(errors: Record<string, string>) {
  const errorCount = Object.keys(errors).length;
  if (errorCount === 0) return;

  const firstError = Object.values(errors)[0];
  toast.error(
    'Validation Error',
    errorCount === 1 
      ? firstError 
      : `${errorCount} fields need your attention. Please check the form.`,
    { duration: 5000 }
  );
}

// Helper function to show API errors
export function showApiError(error: unknown, defaultMessage = 'An error occurred') {
  const message = error instanceof Error ? error.message : defaultMessage;
  toast.error('Error', message, { duration: 7000 });
}
