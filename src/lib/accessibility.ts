/**
 * Accessibility utilities for improved keyboard navigation and focus management
 */

/**
 * Trap focus within a modal or dialog element
 * @param element - The container element to trap focus within
 * @returns Cleanup function to remove event listeners
 */
export function trapFocus(element: HTMLElement): () => void {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable?.focus();
      }
    }
  };

  element.addEventListener('keydown', handleKeyDown);

  // Focus the first focusable element
  firstFocusable?.focus();

  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Handle Escape key to close modals
 * @param callback - Function to call when Escape is pressed
 * @returns Cleanup function to remove event listener
 */
export function handleEscapeKey(callback: () => void): () => void {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      callback();
    }
  };

  document.addEventListener('keydown', handleKeyDown);

  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Restore focus to a previously focused element
 * @param element - The element to restore focus to
 */
export function restoreFocus(element: HTMLElement | null): void {
  if (element && typeof element.focus === 'function') {
    element.focus();
  }
}

/**
 * Get all focusable elements within a container
 * @param container - The container element
 * @returns Array of focusable elements
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const elements = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  return Array.from(elements);
}

/**
 * Announce a message to screen readers
 * @param message - The message to announce
 * @param priority - The priority level ('polite' or 'assertive')
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Check if an element is visible and focusable
 * @param element - The element to check
 * @returns True if the element is visible and focusable
 */
export function isElementFocusable(element: HTMLElement): boolean {
  if (element.offsetParent === null) return false;
  if (element.hasAttribute('disabled')) return false;
  if (element.getAttribute('aria-hidden') === 'true') return false;
  
  const tabindex = element.getAttribute('tabindex');
  if (tabindex === '-1') return false;
  
  return true;
}
