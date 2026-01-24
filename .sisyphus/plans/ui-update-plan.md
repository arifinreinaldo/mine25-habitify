# UI Update Plan: Mobile Responsiveness, Dark/Light Theme & iOS 26 Design

## Objective
Update the application to support Light/Dark modes, fix mobile responsiveness, and adopt an "iOS 26" (VisionOS-like) aesthetic with glassmorphism, larger rounding, and vibrant accents.

## Phase 1: Theme Infrastructure (Refined)
### 1.1 CSS Variables (`src/index.css`)
Define semantic colors with iOS-like vibrancy and transparency support.
- Add `--color-success` (Green) and `--color-warning` (Orange) for semantic replacement.
- Add `--color-muted-foreground` (missing in current config).

### 1.2 Tailwind Configuration (`tailwind.config.js`)
- **Colors**: Map variables including `muted-foreground`, `success`, `warning`.
- **Border Radius**: Add `xl: '1rem'`, `2xl: '1.5rem'`, `3xl: '2rem'` if not present (Tailwind defaults are good, but we'll enforce 2xl/3xl).
- **Backdrop Blur**: Ensure `backdrop-blur` utilities are enabled (default in v3).

## Phase 2: Theme Components
### 2.1 Theme Provider (`src/components/theme-provider.tsx`)
- (Already Created) - Ensure it's correctly exported.

### 2.2 Theme Toggle (`src/components/mode-toggle.tsx`)
- Create a floating, glassmorphic toggle button.
- Use Lucide icons (`Sun`, `Moon`).

### 2.3 Integration (`src/App.tsx`)
- Wrap app in `ThemeProvider`.

## Phase 3: iOS 26 / VisionOS Redesign
### 3.1 Global Styles (`src/index.css`)
- **Background**: Add a subtle gradient background for depth in both modes.
  - Dark: Deep slate/blue gradient.
  - Light: Soft gray/blue gradient.

### 3.2 Component Updates
- **HabitCard (`src/components/habits/HabitCard.tsx`)**:
  - Change `bg-surface` to `bg-surface/60 backdrop-blur-md` (Glass effect).
  - Increase `rounded-xl` to `rounded-3xl`.
  - Remove borders or make them very subtle (`border-white/10`).
  - Add `active:scale-95` for tactile touch feedback.
  - Replace `text-orange-500` with `text-warning`.
  - Replace `hover:text-white` with `hover:text-foreground`.

- **HabitDialog (`src/components/habits/HabitDialog.tsx`)**:
  - Use `DialogContent` with `bg-surface/80 backdrop-blur-xl`.
  - Rounded corners `rounded-3xl`.
  - Update grid to `grid-cols-2` for mobile (as per original plan).

- **Dashboard (`src/pages/Dashboard.tsx`)**:
  - Update "Stats" cards to use glassmorphism.
  - Replace `text-green-500` with `text-success`.
  - Ensure FAB is `rounded-full` with heavy shadow and blur.
  - Add `pb-32` (more padding for floating tab bar feel).

## Phase 4: Mobile Responsiveness
- **HabitDialog**: Fix 3-column grid to be 2-column on mobile.
- **Dashboard**: Fix padding and header layout.

## Verification Plan
1. **Visual Check**:
   - Verify "Glass" effect on cards against the background.
   - Check Light/Dark toggle works and looks good (no unreadable text).
   - Check rounded corners are consistent (iOS style).
2. **Mobile**:
   - Check dialog inputs on small screens.
   - Verify tap targets are large enough (44px+).
