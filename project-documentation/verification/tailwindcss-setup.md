# TailwindCSS Configuration - Web Package

**Added**: October 20, 2025  
**Package**: `@ffp/web`  
**Status**: ✅ Configured

---

## What Was Added

- **TailwindCSS v3.4.14** - Utility-first CSS framework
- **PostCSS** - CSS transformation tool
- **Autoprefixer** - Vendor prefix automation

---

## Files Created/Modified

1. ✅ `packages/web/tailwind.config.js` - Tailwind configuration
2. ✅ `packages/web/postcss.config.js` - PostCSS configuration
3. ✅ `packages/web/src/index.css` - Updated with Tailwind directives
4. ✅ `packages/web/package.json` - Added Tailwind dependencies
5. ✅ `packages/web/src/App.tsx` - Updated to use Tailwind classes
6. ✅ `packages/web/src/components/PathAliasTest.tsx` - Updated to use Tailwind classes

---

## Quick Test

After running `pnpm install`:

```bash
cd packages/web
pnpm dev
```

Open `http://localhost:3000` - you should see:

- ✅ Styled card with shadow and rounded corners
- ✅ Blue notification box with left border
- ✅ Gradient success banner at bottom
- ✅ Responsive design (try resizing browser)
- ✅ Modern, professional appearance

---

## Usage Example

```tsx
// Simple button with Tailwind
<button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded">
  Click Me
</button>

// Responsive card
<div className="bg-white rounded-lg shadow-md p-6">
  <h2 className="text-2xl font-bold mb-4">Title</h2>
  <p className="text-gray-700">Content</p>
</div>
```

---

## Custom Configuration

### Brand Colours

Custom primary colour palette defined in `tailwind.config.js`:

```javascript
primary: {
  50: '#f0f9ff',
  // ... up to 950
}
```

Use with: `bg-primary-500`, `text-primary-600`, etc.

### Font Family

Default sans-serif set to Inter with system fallbacks:

```javascript
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],
}
```

---

## VS Code Extension

**Recommended**: Install "Tailwind CSS IntelliSense" extension for:

- Class name autocomplete
- Hover previews
- Linting
- Colour previews

---

## Next Steps

1. Install dependencies: `pnpm install` (from root)
2. Test dev server: `cd packages/web && pnpm dev`
3. Verify styling looks good
4. Start using Tailwind classes in components

---

**All set! TailwindCSS is ready to use.** 🎨
