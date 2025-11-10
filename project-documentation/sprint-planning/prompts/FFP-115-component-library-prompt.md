# FFP-115: Component Library & Design System Setup - Executable Prompt

**Context**: Sprint 2, Session 44
**Parent Story**: FFP-16 - Web Login/Logout Flow
**Ticket**: https://ctregaskis.atlassian.net/browse/FFP-115

---

## Objective

Set up the foundational component library and design system for the @ffp/web package, including:

- Tailwind CSS with custom theme
- Icomoon icon system with type generation
- Reusable Button and Form components
- Form management pattern (standard forms only, not assessment forms)
- Component showcase page

**CRITICAL**: This ticket MUST be completed before FFP-90, FFP-92, FFP-93, and FFP-96, as they all depend on these reusable components.

---

## Pre-Implementation Questions

Before starting implementation, please ask the user for the following theme configuration:

1. **Primary Colour**: What hex colour should be used for primary actions/branding? (e.g., `#3B82F6`)
2. **Secondary Colour**: What hex colour should be used for secondary actions? (e.g., `#10B981`)
3. **Font Family**: Should we use system fonts or a specific font family?
   - System fonts (default): `-apple-system, BlinkMacSystemFont, 'Segoe UI', ...`
   - Custom font (if so, which one?)
4. **Any other branding requirements**: Logo colours, accent colours, etc.?

**Also ask for Icomoon assets**:

- User should provide `icomoon.ttf` and `selection.json` from [icomoon.io/app](https://icomoon.io/app/)
- If not ready, can implement placeholder and revisit later

---

## Reference Documentation

**CRITICAL**: Read these guides before implementation:

1. **Form Management Pattern**: `/Users/christophertregaskis/Documents/FFP/ffp/project-documentation/sprint-planning/outputs/Form Management Pattern Guide.md`
   - Focus on **Standard Forms** section only (ignore Assessment Forms for now)
   - Implement: `useFieldsForm` hook, `Form.tsx`, field components, shared types

2. **Icon System**: `/Users/christophertregaskis/Documents/FFP/ffp/project-documentation/sprint-planning/outputs/Icon System Implementation Guide.md`
   - Full implementation including type generation script
   - Add `pnpm icon:generate` script to `packages/web/package.json`

---

## Implementation Steps

### 1. Install Dependencies (15 mins)

```bash
# From monorepo root
pnpm add tailwindcss postcss autoprefixer --filter @ffp/web
pnpm add react-hook-form @hookform/resolvers/zod zod --filter @ffp/web
pnpm add react-icomoon --filter @ffp/web

# Initialise Tailwind (creates tailwind.config.js and postcss.config.js)
cd packages/web
pnpm dlx tailwindcss init -p
```

### 2. Configure Tailwind Theme (30 mins)

Update `packages/web/tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '<USER_PRIMARY_COLOUR>', // e.g., #3B82F6
          light: '<lighter_shade>',
          dark: '<darker_shade>',
        },
        secondary: {
          DEFAULT: '<USER_SECONDARY_COLOUR>', // e.g., #10B981
          light: '<lighter_shade>',
          dark: '<darker_shade>',
        },
      },
      fontFamily: {
        sans: ['<USER_FONT_FAMILY>', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

Add Tailwind directives to `packages/web/src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 3. Implement Icon System (45 mins)

Follow "Icon System Implementation Guide.md" exactly:

**Files to create**:

- `packages/web/src/assets/icomoon/` - Add `icomoon.ttf` and `selection.json` (from user)
- `packages/web/src/components/Icon/Icon.tsx` - Icon component
- `packages/web/src/components/Icon/types.ts` - Placeholder types file
- `packages/web/scripts/generate-icon-types.js` - Type generator script

**Add to `packages/web/src/index.css`**:

```css
@font-face {
  font-family: 'icomoon';
  src: url('./assets/icomoon/icomoon.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: block;
}
```

**Add script to `packages/web/package.json`**:

```json
{
  "scripts": {
    "icon:generate": "node scripts/generate-icon-types.js"
  }
}
```

**Run type generation**:

```bash
pnpm --filter @ffp/web icon:generate
```

### 4. Create Button Component (30 mins)

**File**: `packages/web/src/components/Button/Button.tsx`

```typescript
import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'text';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  isLoading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary',
  secondary: 'bg-secondary text-white hover:bg-secondary-dark focus:ring-secondary',
  text: 'bg-transparent text-primary hover:bg-gray-100 focus:ring-primary',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  isLoading = false,
  disabled,
  className = '',
  ...props
}) => {
  return (
    <button
      className={`
        rounded-md font-medium transition-colours duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  );
};
```

### 5. Implement Form Management Pattern (90 mins)

Follow "Form Management Pattern Guide.md" - **Standard Forms section only**.

**Files to create** (in order):

1. `packages/web/src/components/form/shared/types.ts` - Core form types
2. `packages/web/src/components/form/shared/FieldDataType.ts` - Field type enum
3. `packages/web/src/hooks/useFieldsForm.tsx` - Core form hook
4. `packages/web/src/components/form/standardForm/FormTextInput.tsx` - Text input component
5. `packages/web/src/components/form/standardForm/FormPasswordInput.tsx` - Password input with show/hide
6. `packages/web/src/components/form/standardForm/FormEmailInput.tsx` - Email input
7. `packages/web/src/components/form/standardForm/FormError.tsx` - Error display
8. `packages/web/src/components/form/standardForm/Form.tsx` - Form wrapper component

**Note**: Only implement components needed for login form. Skip:

- `FormSelectInput`, `FormCheckbox` (not needed yet)
- Assessment form components (deferred to Sprint 3)
- `formDefinitions/` (will be created in FFP-92 when implementing login form)

### 6. Create Component Showcase Page (30 mins)

**File**: `packages/web/src/pages/ComponentShowcase.tsx`

```typescript
import React, { useState } from 'react';
import { Button } from '@web/components/Button/Button';
import { Icon } from '@web/components/Icon/Icon';
import { Icons } from '@web/components/Icon/types';
import { Form } from '@web/components/form/standardForm/Form';
import { Field, FieldDataType } from '@web/components/form/shared/types';

interface ShowcaseFormValues {
  email: string;
  password: string;
}

const showcaseFields: Field<ShowcaseFormValues>[] = [
  {
    order: 1,
    name: 'email',
    label: 'Email Address',
    dataType: FieldDataType.String,
    placeholder: 'you@example.com',
    validation: {
      isRequired: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
  },
  {
    order: 2,
    name: 'password',
    label: 'Password',
    dataType: FieldDataType.String,
    placeholder: '••••••••',
    validation: {
      isRequired: true,
      minLength: 8,
    },
  },
];

export const ComponentShowcase: React.FC = () => {
  const [formValues, setFormValues] = useState<ShowcaseFormValues | null>(null);

  const handleSubmit = (values: ShowcaseFormValues) => {
    setFormValues(values);
    alert(`Form submitted: ${JSON.stringify(values, null, 2)}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-12">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Component Library</h1>
          <p className="text-gray-600">FFP Design System Showcase</p>
        </div>

        {/* Buttons */}
        <section className="bg-white p-8 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-6">Buttons</h2>
          <div className="space-y-4">
            <div className="flex gap-4 items-center">
              <span className="w-24 text-sm text-gray-600">Primary:</span>
              <Button variant="primary" size="sm">Small</Button>
              <Button variant="primary" size="md">Medium</Button>
              <Button variant="primary" size="lg">Large</Button>
              <Button variant="primary" isLoading>Loading</Button>
              <Button variant="primary" disabled>Disabled</Button>
            </div>
            <div className="flex gap-4 items-center">
              <span className="w-24 text-sm text-gray-600">Secondary:</span>
              <Button variant="secondary" size="sm">Small</Button>
              <Button variant="secondary" size="md">Medium</Button>
              <Button variant="secondary" size="lg">Large</Button>
            </div>
            <div className="flex gap-4 items-center">
              <span className="w-24 text-sm text-gray-600">Text:</span>
              <Button variant="text" size="sm">Small</Button>
              <Button variant="text" size="md">Medium</Button>
              <Button variant="text" size="lg">Large</Button>
            </div>
          </div>
        </section>

        {/* Icons (if available) */}
        <section className="bg-white p-8 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-6">Icons</h2>
          <p className="text-sm text-gray-600 mb-4">
            Icons will appear here once Icomoon assets are provided.
          </p>
          {/* Uncomment when icons are available:
          <div className="flex gap-6">
            <Icon name={Icons.SEARCH} styleProps={{ size: 'sm' }} />
            <Icon name={Icons.CHEVRON_LEFT} styleProps={{ size: 'md' }} />
            <Icon name={Icons.CHECK_CIRCLE} styleProps={{ size: 'lg', colour: '#10B981' }} />
          </div>
          */}
        </section>

        {/* Form Example */}
        <section className="bg-white p-8 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-6">Form Example</h2>
          <Form
            fields={showcaseFields}
            onSubmit={handleSubmit}
            submitLabel="Submit Form"
          />
          {formValues && (
            <div className="mt-6 p-4 bg-green-50 rounded-md">
              <p className="text-sm font-medium text-green-800">Form Values:</p>
              <pre className="text-xs text-green-700 mt-2">
                {JSON.stringify(formValues, null, 2)}
              </pre>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
```

### 7. Add Routing for Showcase Page (15 mins)

Update `packages/web/src/App.tsx` to include the showcase route:

```typescript
import { ComponentShowcase } from '@web/pages/ComponentShowcase';

// In your routes:
<Route path="/components" element={<ComponentShowcase />} />
```

**Note**: No authentication required for this route in Phase 1.

---

## Testing Checklist

- [ ] Run `pnpm dev` - no errors
- [ ] Visit `http://localhost:5173/components` - showcase page loads
- [ ] All button variants render correctly
- [ ] Form validation works (try submitting empty, invalid email, short password)
- [ ] Form submission shows success message with values
- [ ] Icons display correctly (if Icomoon assets provided)
- [ ] `pnpm typecheck` - zero TypeScript errors
- [ ] `pnpm lint` - zero ESLint warnings
- [ ] All code uses British English spelling

---

## Acceptance Criteria Verification

Before marking FFP-115 as complete, verify ALL acceptance criteria from the Jira ticket:

- [ ] Tailwind CSS installed and configured
- [ ] Theme configuration created with design tokens
- [ ] Icomoon icon system implemented (or placeholder if assets not ready)
- [ ] Button component with variants (primary, secondary, text)
- [ ] Form input components (TextInput, PasswordInput, EmailInput)
- [ ] Form management pattern implemented (standard forms only)
- [ ] Component showcase page accessible at `/components`
- [ ] British English throughout
- [ ] TypeScript strict mode, zero errors
- [ ] Components tested in showcase page

---

## Time Tracking

Estimated: **3-4 hours**

Breakdown:

- Dependencies & Tailwind setup: 45 mins
- Icon system: 45 mins
- Button component: 30 mins
- Form pattern implementation: 90 mins
- Component showcase: 30 mins
- Testing & polish: 30 mins

---

## Next Steps After Completion

Once FFP-115 is complete and committed:

1. Update FFP-115 to "Done" status in Jira
2. Move to FFP-93 (Install and configure AWS Amplify)
3. Then FFP-90 (Create AuthContext) which will use these form components
4. Then FFP-92 (Login form) which will consume the form pattern

---

## Important Notes

- **British English**: Use "colour" not "color" in code/comments
- **No premature optimisation**: Keep implementations simple for Phase 1
- **Assessment forms**: Out of scope - focus only on standard forms
- **TypeScript strict mode**: Zero `any` types, all components fully typed
- **Tailwind**: Use utility classes, minimal custom CSS
- **Icons**: Can implement placeholder if user doesn't have Icomoon assets ready
- **Form pattern**: Only implement what's needed for login form (TextInput, PasswordInput, EmailInput)

---

## Troubleshooting

**Tailwind not applying styles**:

- Check `index.css` has `@tailwind` directives
- Verify `tailwind.config.js` content array includes `./src/**/*.{js,ts,jsx,tsx}`
- Restart dev server

**Icon types not generating**:

- Ensure `selection.json` and `icomoon.ttf` are in `src/assets/icomoon/`
- Run `pnpm --filter @ffp/web icon:generate`
- Check for errors in console
- Restart TypeScript server in VS Code

**Form validation not working**:

- Check `react-hook-form` and `zod` are installed
- Verify `useFieldsForm` hook is implemented correctly
- Ensure field names match TypeScript interface

**Import path aliases not working**:

- Check `tsconfig.json` has `@web/*` path configured
- Check `vite.config.ts` has alias configured
- Restart dev server

---

## Success Criteria

FFP-115 is complete when:

1. Component showcase page renders without errors
2. All button variants work correctly
3. Form validation works as expected
4. Icon system generates types (or placeholder if assets not ready)
5. Zero TypeScript errors, zero ESLint warnings
6. All code uses British English
7. Changes committed to Git with message: `FFP-115: Implement component library & design system`

Ready to tackle FFP-93 next!
