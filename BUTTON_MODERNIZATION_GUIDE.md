# Button Modernization Guide for Leads Management

## Overview
This guide documents the button style updates across the Leads Management section to create a modern, cohesive look.

## Updated Button Classes

### Primary Actions
Replace: `bg-blue-500 text-white hover:bg-blue-600`
With: `btn btn-primary` or `btn btn-sm btn-primary`

### Success Actions (Select, Add, Confirm)
Replace: `bg-green-500 text-white hover:bg-green-600`
With: `btn btn-success` or `btn btn-sm btn-success`

### Danger Actions (Delete, No Good, Remove)
Replace: `bg-red-500 text-white hover:bg-red-600`
With: `btn btn-danger` or `btn btn-sm btn-danger`

### Secondary Actions (Cancel, Back)
Replace: `bg-gray-200 text-gray-800 hover:bg-gray-300` or `border border-gray-300`
With: `btn btn-secondary` or `btn btn-sm btn-secondary`

### Warning Actions
Replace: `bg-yellow-500 text-white hover:bg-yellow-600`
With: `btn btn-warning` or `btn btn-sm btn-warning`

### Info Actions
Replace: `bg-cyan-500 text-white hover:bg-cyan-600`
With: `btn btn-info` or `btn btn-sm btn-info`

### Purple/Later Stage Actions
Replace: `bg-purple-500 text-white hover:bg-purple-600`
With: `btn btn-purple` or `btn btn-sm btn-purple`

## Button Sizes
- Small: `btn btn-sm` (for table actions, compact spaces)
- Default: `btn` (for forms, modals)
- Large: `btn btn-lg` (for primary CTAs)

## Card View Improvements

### Consistent Card Structure
```tsx
<div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 h-full flex flex-col">
  {/* Card Header */}
  <div className="flex-1">
    {/* Content */}
  </div>
  
  {/* Card Footer - Actions */}
  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
    <button className="btn btn-sm btn-primary flex-1">Action</button>
    <button className="btn btn-sm btn-secondary flex-1">Action</button>
  </div>
</div>
```

### Grid Layout for Cards
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards with h-full for equal heights */}
</div>
```

## Specific Page Updates

### Main Sheet (status-pages/page.tsx)
- ✅ Maps button: `btn btn-sm btn-primary`
- ✅ Select button: `btn btn-sm btn-success`
- ✅ No Good button: `btn btn-sm btn-danger`
- ✅ Select All button: `btn btn-sm btn-secondary`
- ✅ Bulk actions: Use appropriate btn classes

### Leads Tab (status/leads/page.tsx)
- Details button: `btn btn-sm btn-info`
- Delete button: `btn btn-sm btn-danger`
- Add notes: Should open modal with `btn btn-primary`

### Working On Tab (status/working/page.tsx)
- Add Notes: `btn btn-sm btn-info`
- Add Reminders: `btn btn-sm btn-purple`
- Add Files: `btn btn-sm btn-primary`

### Later Stage Tab (status/later/page.tsx)
- Files button: `btn btn-sm btn-primary`
- Edit button: `btn btn-sm btn-secondary`
- Delete button: `btn btn-sm btn-danger`

### Bad Leads Tab (status/bad/page.tsx)
- Files button: `btn btn-sm btn-primary`
- Recover button: `btn btn-sm btn-success`
- Delete button: `btn btn-sm btn-danger`

### Signed Tab (status/signed/page.tsx)
- Files button: `btn btn-sm btn-primary`

### Routes Page (routes-pages/page.tsx)
- Open in Maps: `btn btn-sm btn-primary`
- Share: `btn btn-sm btn-info`
- Export: `btn btn-sm btn-secondary`
- Delete: `btn btn-sm btn-danger`

## Implementation Notes

1. All buttons now use the modern gradient styles defined in globals.css
2. Buttons have consistent padding, rounded corners, and shadows
3. Hover states include subtle scale and shadow effects
4. Disabled states are handled automatically
5. Cards use `h-full` and `flex flex-col` for equal heights
6. Action buttons in cards are in a footer section with consistent spacing

## Benefits

- Consistent visual language across all pages
- Modern, polished appearance
- Better accessibility with proper focus states
- Responsive design that works on all devices
- Easier maintenance with utility classes
