'use client';

import { useEffect, useRef } from 'react';

export interface KeyboardNavigationOptions {
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onEnter?: () => void;
  onEscape?: () => void;
  onSpace?: () => void;
  onHome?: () => void;
  onEnd?: () => void;
  enabled?: boolean;
}

/**
 * Custom hook for keyboard navigation
 * Provides arrow key navigation and common keyboard shortcuts
 */
export function useKeyboardNavigation(options: KeyboardNavigationOptions) {
  const {
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onEnter,
    onEscape,
    onSpace,
    onHome,
    onEnd,
    enabled = true,
  } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          onArrowUp?.();
          break;
        case 'ArrowDown':
          e.preventDefault();
          onArrowDown?.();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onArrowLeft?.();
          break;
        case 'ArrowRight':
          e.preventDefault();
          onArrowRight?.();
          break;
        case 'Enter':
          onEnter?.();
          break;
        case 'Escape':
          onEscape?.();
          break;
        case ' ':
          e.preventDefault();
          onSpace?.();
          break;
        case 'Home':
          e.preventDefault();
          onHome?.();
          break;
        case 'End':
          e.preventDefault();
          onEnd?.();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onEnter, onEscape, onSpace, onHome, onEnd]);
}

/**
 * Hook for list navigation with keyboard
 */
export function useListKeyboardNavigation<T>(
  items: T[],
  selectedIndex: number,
  onSelect: (index: number) => void,
  onActivate?: (item: T) => void
) {
  useKeyboardNavigation({
    onArrowUp: () => {
      const newIndex = selectedIndex > 0 ? selectedIndex - 1 : items.length - 1;
      onSelect(newIndex);
    },
    onArrowDown: () => {
      const newIndex = selectedIndex < items.length - 1 ? selectedIndex + 1 : 0;
      onSelect(newIndex);
    },
    onEnter: () => {
      if (selectedIndex >= 0 && selectedIndex < items.length) {
        onActivate?.(items[selectedIndex]);
      }
    },
    onHome: () => {
      onSelect(0);
    },
    onEnd: () => {
      onSelect(items.length - 1);
    },
  });
}
