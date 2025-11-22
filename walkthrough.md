# Walkthrough - Align Download Path and Filename Fields

I have aligned the "Download Path" and "Filename" fields in the main download form to ensure they are visually consistent and properly aligned on all screen sizes.

## Changes

### 1. Standardized Input Height
The Filename input was previously shorter on mobile (`h-10`) than the Path Selector (`h-12`). I updated it to be `h-12` on all screens.

**File:** `app/home-client.tsx`
```diff
- className="h-10 md:h-12 text-sm ..."
+ className="h-12 text-sm ..."
```

### 2. Standardized Label Row Height
The label row (containing the label and the "Manage" button) had a variable height (`h-6 md:h-8`). However, the "Manage" button in the Path Selector has a fixed height of `h-8`, causing misalignment on mobile. I standardized the label row height to `h-8` for both fields.

**File:** `app/home-client.tsx`
```diff
- <div className="flex items-center justify-between h-6 md:h-8">
+ <div className="flex items-center justify-between h-8">
```

**File:** `components/path-selector.tsx`
```diff
- <div className="flex items-center justify-between h-6 md:h-8">
+ <div className="flex items-center justify-between h-8">
```

## Verification Results

### Visual Alignment
- **Mobile:** Both fields now have a 32px label row and a 48px input row, ensuring perfect vertical alignment.
- **Desktop:** The alignment remains consistent with the previous desktop layout, but now robust against any content changes.

The fields should now be perfectly aligned side-by-side on desktop and consistent in height on mobile.
