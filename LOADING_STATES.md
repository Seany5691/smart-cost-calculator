# Loading States and User Feedback Enhancement

## Overview

This document describes the comprehensive loading states and user feedback system implemented across the Smart Cost Calculator application. The implementation focuses on providing better perceived performance, consistent loading indicators, and enhanced user feedback during async operations.

## Components

### 1. Spinner Component (`src/components/ui/Spinner.tsx`)

A versatile spinner component for inline loading indicators.

**Features:**
- Multiple sizes: `sm`, `md`, `lg`, `xl`
- Multiple colors: `primary`, `white`, `gray`, `success`, `danger`
- Variants: `Spinner`, `SpinnerOverlay`, `SpinnerInline`

**Usage:**
```tsx
import { Spinner, SpinnerOverlay, SpinnerInline } from '@/components/ui';

// Basic spinner
<Spinner size="md" color="primary" />

// Inline with message
<SpinnerInline message="Loading data..." />

// Full-screen overlay
<SpinnerOverlay message="Processing your request..." />
```

### 2. Skeleton Component (`src/components/ui/Skeleton.tsx`)

Skeleton loading screens for better perceived performance.

**Features:**
- Variants: `text`, `circular`, `rectangular`, `rounded`
- Animations: `pulse`, `wave`, `none`
- Preset components: `SkeletonText`, `SkeletonCard`, `SkeletonTable`, `SkeletonForm`

**Usage:**
```tsx
import { Skeleton, SkeletonCard, SkeletonTable } from '@/components/ui';

// Basic skeleton
<Skeleton variant="text" width="80%" />

// Preset card skeleton
<SkeletonCard />

// Table skeleton
<SkeletonTable rows={5} columns={4} />

// Form skeleton
<SkeletonForm fields={4} />
```

### 3. LoadingState Component (`src/components/ui/LoadingState.tsx`)

A unified loading state component that combines spinners and skeletons.

**Features:**
- Types: `spinner`, `skeleton`, `card`, `table`, `form`
- Full-screen mode support
- Customizable messages

**Usage:**
```tsx
import { LoadingState } from '@/components/ui';

// Spinner loading
<LoadingState type="spinner" message="Loading..." />

// Skeleton table
<LoadingState type="table" rows={5} columns={4} />

// Full-screen loading
<LoadingState type="spinner" fullScreen message="Initializing..." />
```

### 4. Enhanced Button Component

The Button component now has improved loading states with better visual feedback.

**Features:**
- `loading` prop for async operations
- Automatic disabled state when loading
- Size-appropriate spinner
- Opacity effect on content during loading
- ARIA attributes for accessibility

**Usage:**
```tsx
import { Button } from '@/components/ui';

const [isLoading, setIsLoading] = useState(false);

<Button 
  loading={isLoading}
  onClick={handleAsyncAction}
>
  Save Changes
</Button>
```

## Implementation Patterns

### 1. Page-Level Loading

For initial page loads, use skeleton loading for better perceived performance:

```tsx
export default function MyPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState([]);

  useEffect(() => {
    loadData().then(result => {
      setData(result);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return <div>{/* Render actual content */}</div>;
}
```

### 2. Button Loading States

For async button actions, use the loading prop:

```tsx
const [isSaving, setIsSaving] = useState(false);

const handleSave = async () => {
  setIsSaving(true);
  try {
    await saveData();
  } finally {
    setIsSaving(false);
  }
};

<Button loading={isSaving} onClick={handleSave}>
  Save Changes
</Button>
```

### 3. Item-Specific Loading

For operations on specific items (like delete), track the item ID:

```tsx
const [deletingId, setDeletingId] = useState<string | null>(null);

const handleDelete = async (id: string) => {
  setDeletingId(id);
  try {
    await deleteItem(id);
  } finally {
    setDeletingId(null);
  }
};

{items.map(item => (
  <Button
    key={item.id}
    loading={deletingId === item.id}
    disabled={deletingId === item.id}
    onClick={() => handleDelete(item.id)}
  >
    Delete
  </Button>
))}
```

### 4. Full-Screen Loading

For critical operations that block the entire UI:

```tsx
const [isProcessing, setIsProcessing] = useState(false);

{isProcessing && (
  <SpinnerOverlay message="Processing your request..." />
)}
```

## Updated Pages

### 1. My Deals Page (`src/app/my-deals/page.tsx`)

**Enhancements:**
- Skeleton loading for deal cards during initial load
- Loading state on delete buttons
- Item-specific loading tracking

### 2. Admin Deals Page (`src/app/admin/deals/page.tsx`)

**Enhancements:**
- Comprehensive skeleton loading for page structure
- Loading states on PDF generation buttons
- Loading states on delete buttons
- Item-specific loading tracking for multiple async operations

### 3. Calculator Page (`src/app/calculator/page.tsx`)

**Existing Features:**
- Full-screen loading during initialization
- Error state handling
- Retry mechanism with loading feedback

### 4. Login Page (`src/app/login/page.tsx`)

**Existing Features:**
- Button loading state during authentication
- Disabled inputs during loading
- Error message display

## CSS Animations

### Shimmer Animation

Added to `globals.css` for skeleton loading:

```css
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.animate-shimmer {
  animation: shimmer 2s ease-in-out infinite;
}
```

## Accessibility

All loading components include proper ARIA attributes:

- `role="status"` on spinners
- `aria-label="Loading"` for screen readers
- `aria-busy` on loading buttons
- `aria-disabled` on disabled buttons during loading

## Best Practices

1. **Use Skeleton Loading for Initial Loads**: Provides better perceived performance than spinners
2. **Use Spinners for Short Operations**: Button clicks, form submissions
3. **Track Item-Specific Loading**: When operating on individual items in a list
4. **Provide Meaningful Messages**: Help users understand what's happening
5. **Disable Interactions During Loading**: Prevent duplicate submissions
6. **Show Progress When Possible**: For long operations, consider progress indicators
7. **Handle Errors Gracefully**: Always include error states and recovery options

## Demo Page

Visit `/loading-demo` to see all loading states in action with interactive examples.

## Future Enhancements

- Progress bars for long-running operations
- Optimistic UI updates
- Retry mechanisms with exponential backoff
- Toast notifications for async operation completion
- Skeleton loading for specific component types (charts, images, etc.)
