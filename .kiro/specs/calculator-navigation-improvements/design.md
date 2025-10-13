# Design Document

## Overview

This design addresses three critical usability issues in the calculator navigation system:
1. Enable direct tab navigation by making tabs clickable
2. Fix visual cutoff of completion checkmarks
3. Reduce vertical space consumption of the navigation area

The solution will maintain the existing visual language and interaction patterns while improving usability and space efficiency.

## Architecture

### Component Structure

The calculator navigation is currently implemented in a single page component (`src/app/calculator/page.tsx`). The design will refactor the navigation into a more maintainable structure:

```
CalculatorPage
├── CalculatorNavigation (new component)
│   ├── TabBar
│   │   └── Tab (clickable, with proper overflow handling)
│   └── CompactNavigationControls
│       ├── PreviousButton
│       ├── InlineProgressIndicator
│       └── NextButton
└── CalculatorContent (section components)
```

### Key Design Decisions

1. **Clickable Tabs**: Tabs will be fully interactive buttons with proper accessibility attributes
2. **Overflow Management**: Use `overflow-visible` on tab containers and proper positioning for checkmarks
3. **Compact Layout**: Single-row navigation combining tabs and controls, with inline progress indicator
4. **Responsive Design**: Maintain mobile-friendly touch targets while reducing desktop space usage

## Components and Interfaces

### 1. Tab Component

**Purpose**: Individual tab button with completion state and click handling

**Props Interface**:
```typescript
interface TabProps {
  index: number;
  name: string;
  icon: string;
  isCompleted: boolean;
  isCurrent: boolean;
  isAccessible: boolean;
  onClick: (index: number) => void;
}
```

**Visual States**:
- **Current**: Blue gradient background, scale-105, bottom border indicator
- **Completed**: Green checkmark badge (positioned absolutely, top-right, fully visible)
- **Future/Locked**: Gray, disabled, with tooltip on hover
- **Hover** (accessible tabs): Subtle scale and shadow effect

**Checkmark Fix**:
- Position: `absolute top-0 right-0` with `translate-x-1/2 -translate-y-1/2`
- Size: `w-5 h-5` (increased from w-4 h-4)
- Container: `overflow-visible` on tab button
- Z-index: `z-10` to ensure visibility above other elements

### 2. Compact Navigation Controls

**Layout Strategy**:
```
┌─────────────────────────────────────────────────────────────┐
│  [Prev]  Step 2/6 • 33% ━━━━━━━━━━━━━━━━━━━━━━━━━━  [Next]  │
└─────────────────────────────────────────────────────────────┘
```

**Components**:
- Previous/Next buttons: Compact, icon + text on desktop, icon only on mobile
- Progress indicator: Inline text + mini progress bar (combined in single row)
- Total height target: ~48px (down from ~120px)

### 3. Tab Bar Layout

**Current Issues**:
- Tabs in one row with overflow scroll
- Navigation controls in separate row below
- Progress indicator in third row
- Total: ~120px vertical space

**New Design**:
```
┌──────────────────────────────────────────────────────────────┐
│  [Tab1✓] [Tab2✓] [Tab3●] [Tab4] [Tab5] [Tab6]    [Back]     │  ~56px
├──────────────────────────────────────────────────────────────┤
│  [◄ Prev]    Step 3/6 • 50% ━━━━━━━━━━━━━━━━━━━━    [Next ►] │  ~48px
└──────────────────────────────────────────────────────────────┘
Total: ~104px (13% reduction)
```

**Further Optimization** (aggressive):
```
┌──────────────────────────────────────────────────────────────┐
│  [◄] [Tab1✓] [Tab2✓] [Tab3●] [Tab4] [Tab5] [Tab6] [►] [Back]│  ~52px
│  Step 3/6 • 50% ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │  ~32px
└──────────────────────────────────────────────────────────────┘
Total: ~84px (30% reduction)
```

## Data Models

### Navigation State

```typescript
interface NavigationState {
  currentTabIndex: number;
  completedTabs: Set<number>;
  totalTabs: number;
}

interface Tab {
  index: number;
  name: string;
  icon: string;
  isCompleted: boolean;
  isCurrent: boolean;
  isAccessible: boolean;
}
```

### Click Handler Logic

```typescript
const handleTabClick = (targetIndex: number) => {
  // Only allow navigation to current or completed tabs
  if (targetIndex <= currentTabIndex) {
    setTabIndex(targetIndex);
    // Optional: Show feedback notification
    showNavigationFeedback(`Navigated to ${tabs[targetIndex].name}`);
  } else {
    // Show tooltip/notification that tab is locked
    showNavigationFeedback('Complete previous steps first', 'warning');
  }
};
```

## Styling Specifications

### Tab Button Styles

```css
/* Base tab button */
.calculator-tab {
  position: relative;
  overflow: visible; /* Critical for checkmark visibility */
  padding: 0.75rem 1rem; /* Reduced from 1rem 1rem */
  transition: all 0.2s ease;
}

/* Completion badge */
.completion-badge {
  position: absolute;
  top: 0;
  right: 0;
  transform: translate(25%, -25%); /* Ensures visibility */
  width: 1.25rem;
  height: 1.25rem;
  background: #10b981; /* green-500 */
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  z-index: 10;
}

/* Clickable state for accessible tabs */
.calculator-tab[data-accessible="true"] {
  cursor: pointer;
}

.calculator-tab[data-accessible="true"]:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

/* Locked state */
.calculator-tab[data-accessible="false"] {
  cursor: not-allowed;
  opacity: 0.6;
}
```

### Compact Navigation Styles

```css
.compact-nav-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem; /* Reduced from 1rem 1.5rem */
  gap: 1rem;
}

.inline-progress {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  max-width: 400px;
}

.progress-bar-mini {
  height: 0.5rem; /* Reduced from 0.75rem */
  flex: 1;
  background: #e5e7eb;
  border-radius: 9999px;
  overflow: hidden;
}
```

## Error Handling

### Tab Navigation Errors

1. **Invalid Tab Index**: Validate index is within bounds before navigation
2. **Locked Tab Click**: Show user-friendly tooltip instead of silent failure
3. **State Sync Issues**: Ensure completion state is properly tracked

```typescript
const validateTabNavigation = (targetIndex: number): boolean => {
  if (targetIndex < 0 || targetIndex >= tabs.length) {
    console.error('Invalid tab index:', targetIndex);
    return false;
  }
  
  if (targetIndex > currentTabIndex) {
    showNavigationFeedback('Complete previous steps first', 'warning');
    return false;
  }
  
  return true;
};
```

### Visual Overflow Issues

1. **Checkmark Clipping**: Use `overflow-visible` on parent containers
2. **Mobile Tab Overflow**: Maintain horizontal scroll with proper touch handling
3. **Z-index Conflicts**: Ensure completion badges have appropriate z-index

## Testing Strategy

### Unit Tests (Optional)

- Tab click handler logic
- Navigation validation
- Completion state tracking

### Integration Tests (Optional)

- Full navigation flow (tab clicks + next/prev buttons)
- Keyboard navigation compatibility
- Touch/swipe navigation on mobile

### Visual Regression Tests

- Checkmark visibility on all screen sizes
- Tab hover states
- Compact layout rendering
- Responsive breakpoints

### Manual Testing Checklist

1. **Tab Navigation**:
   - Click current tab (should stay on current)
   - Click completed tab (should navigate)
   - Click future tab (should show warning)
   - Verify hover states on accessible tabs

2. **Checkmark Display**:
   - Complete first tab, verify checkmark fully visible
   - Complete multiple tabs, verify no overlap
   - Test on mobile viewport
   - Test on different zoom levels

3. **Space Efficiency**:
   - Measure navigation height on desktop (~104px target)
   - Measure navigation height on mobile (~120px acceptable)
   - Verify content area has more visible space
   - Test with browser dev tools ruler

4. **Accessibility**:
   - Keyboard navigation still works (arrow keys, numbers)
   - Screen reader announces tab states correctly
   - Focus indicators visible
   - Touch targets meet 44px minimum on mobile

## Implementation Notes

### Phase 1: Enable Tab Clicks
- Add onClick handlers to tab buttons
- Implement validation logic
- Update cursor styles and hover states

### Phase 2: Fix Checkmark Display
- Update tab container overflow property
- Adjust checkmark positioning
- Increase checkmark size for better visibility

### Phase 3: Compact Layout
- Combine navigation rows into more efficient layout
- Reduce padding and spacing
- Create inline progress indicator
- Test responsive behavior

### Backward Compatibility
- Maintain existing keyboard shortcuts
- Preserve touch/swipe navigation
- Keep existing validation logic
- Maintain state management patterns
