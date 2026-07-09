# Modern Style Guide - SESDIAN Design System

## 🎨 Perubahan Desain

Desain sistem telah diperbarui dengan style modern yang lebih clean dan flat, terinspirasi dari desain UI terkini.

### ✨ Highlights

#### 1. **Border & Container**
- Border lebih tebal: `1.5px` (sebelumnya `1px`)
- Rounded corners lebih tajam:
  - Input: `6px` (sebelumnya `8px`)
  - Card: `8px` (sebelumnya `12px`)
  - Container: `12px` (sebelumnya `16px`)
- Shadow lebih subtle dan natural

#### 2. **Buttons**
- Style lebih flat (tanpa heavy shadow)
- Rounded corners: `8px` (bukan pill/9999px)
- Hover effect: border berubah ke primary color + subtle shadow
- Active state: transform kembali ke posisi normal (bukan scale)

```css
/* Contoh penggunaan */
<button class="neu-btn">Default</button>
<button class="neu-btn-primary">Primary</button>
<button class="neu-btn-danger">Danger</button>
```

#### 3. **Icons**
Icon utilities yang konsisten:

```css
<span class="icon icon-sm">...</span>  /* 16px */
<span class="icon icon-md">...</span>  /* 20px */
<span class="icon icon-lg">...</span>  /* 24px */
<span class="icon icon-xl">...</span>  /* 32px */
```

#### 4. **Animations**
- Durasi lebih cepat: `0.15s - 0.3s`
- Movement lebih subtle: `12px` (sebelumnya `20px`)
- Easing modern: `cubic-bezier(0.4, 0, 0.2, 1)`

```css
.animate-fade-up      /* Fade dengan slide up halus */
.animate-fade-in      /* Pure fade */
.animate-slide-right  /* Slide dari kiri */
.animate-pulse        /* Loading indicator */
```

#### 5. **Cards**
Card dengan border yang lebih defined:

```css
<div class="card">Basic Card</div>
<div class="card card-compact">Compact Card</div>
<div class="card-primary">Primary Card</div>
```

Hover effect:
- Border color → Primary
- Lift up: `translateY(-2px)`
- Shadow meningkat

---

## 🎯 Component Classes

### Buttons
```html
<!-- Default -->
<button class="neu-btn">Button</button>

<!-- Primary -->
<button class="neu-btn-primary">Primary</button>

<!-- Danger -->
<button class="neu-btn-danger">Delete</button>

<!-- With Icon -->
<button class="neu-btn">
  <span class="icon icon-sm">🔍</span>
  Search
</button>
```

### Inputs
```html
<input type="text" class="neu-input" placeholder="Enter text...">
```

Features:
- Hover: border color berubah ke muted
- Focus: border primary + subtle glow
- Border: `1.5px`

### Badges
```html
<span class="badge">Default</span>
<span class="badge badge-primary">Primary</span>
<span class="badge badge-success">Success</span>
<span class="badge badge-danger">Danger</span>
<span class="badge badge-warning">Warning</span>
```

### Cards
```html
<!-- Basic Card -->
<div class="card">
  <h3>Title</h3>
  <p>Content...</p>
</div>

<!-- Compact Card -->
<div class="card card-compact">
  Compact content
</div>

<!-- Primary Card -->
<div class="card-primary">
  Highlighted content
</div>
```

### Grids
```html
<!-- Responsive Grid -->
<div class="grid-responsive">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>

<!-- Fixed Columns -->
<div class="grid-2">...</div>  <!-- 2 columns -->
<div class="grid-3">...</div>  <!-- 3 columns -->
<div class="grid-4">...</div>  <!-- 4 columns -->
```

### Avatars
```html
<div class="avatar avatar-sm">JD</div>
<div class="avatar avatar-md">JD</div>
<div class="avatar avatar-lg">JD</div>
<div class="avatar avatar-xl">JD</div>
```

### Status Indicators
```html
<span class="status status-success">Active</span>
<span class="status status-danger">Inactive</span>
<span class="status status-warning">Pending</span>
<span class="status status-info">Info</span>
```

### Skeleton Loading
```html
<div class="skeleton" style="height: 100px;"></div>
```

### Dividers
```html
<!-- Horizontal -->
<div class="divider"></div>

<!-- Vertical -->
<div style="display: flex;">
  <div>Left</div>
  <div class="divider-vertical"></div>
  <div>Right</div>
</div>
```

### Glassmorphism
```html
<div class="glass card">
  Frosted glass effect
</div>
```

---

## 📐 Design Tokens

### Radius
```css
--radius-input: 6px   /* Input fields */
--radius: 8px         /* Default cards/buttons */
--radius-lg: 12px     /* Large containers */
--radius-xl: 16px     /* Extra large */
--radius-pill: 9999px /* Pills/badges */
```

### Shadows
```css
--shadow-sm       /* Subtle shadow untuk hover */
--shadow-card     /* Default card shadow */
--shadow-hover    /* Elevated hover state */
--shadow-raised   /* Prominent elevation */
--shadow-lg       /* Large modals/overlays */
--shadow-inset    /* Pressed/input states */
```

### Colors
```css
--color-primary       /* #0075de */
--color-primary-dark  /* #005bab */
--color-success       /* #1aae39 */
--color-danger        /* #e03e3e */
--color-warning       /* #dd5b00 */
--color-info          /* #0075de */
```

---

## 🚀 Migration Guide

### Dari Style Lama ke Modern

#### Buttons
```html
<!-- LAMA -->
<button class="sesd-btn sesd-btn-primary">Click</button>

<!-- BARU -->
<button class="neu-btn-primary">Click</button>
```

#### Cards
```html
<!-- LAMA -->
<div class="sesd-stat-card">...</div>

<!-- BARU -->
<div class="card">...</div>
```

#### Inputs
```html
<!-- LAMA -->
<input class="sesd-input" />

<!-- BARU -->
<input class="neu-input" />
```

---

## 🎨 Prinsip Desain

### 1. **Clarity over Decoration**
- Border yang jelas dan tegas
- Spacing yang konsisten
- Shadow minimal tapi bermakna

### 2. **Responsive & Adaptive**
- Grid system yang flexible
- Breakpoint yang sensible
- Mobile-first approach

### 3. **Performance**
- Transition yang cepat (150-300ms)
- Animation yang purposeful
- Hardware-accelerated properties

### 4. **Accessibility**
- Focus states yang visible
- Color contrast yang cukup
- Motion reduced untuk users yang membutuhkan

---

## 📱 Responsive Behavior

### Breakpoints
```css
/* Mobile */
@media (max-width: 768px)

/* Grid columns collapse to 1 column */
/* Tighter spacing */
/* Larger touch targets */
```

### Mobile Adaptations
- Grids menjadi single column
- Button padding lebih besar
- Touch-friendly spacing
- Reduced animations

---

## ⚡ Performance Tips

1. **Use CSS Variables**: Theming dan customization lebih mudah
2. **Leverage GPU**: `transform` dan `opacity` untuk animasi
3. **Avoid Layout Thrashing**: Batch DOM reads/writes
4. **Lazy Load**: Gunakan skeleton untuk loading states

---

## 🔧 Customization

### Override Variables
```css
:root {
  --color-primary: #your-color;
  --radius: 10px;
  --shadow-card: your-shadow;
}
```

### Extend Classes
```css
.your-custom-card {
  @apply card;
  /* Your custom styles */
}
```

---

## 📚 Examples

Lihat implementasi lengkap di:
- `/src/app/(user)/dashboard/page.tsx` - Dashboard cards
- `/src/app/(user)/barang/page.tsx` - Data grids
- `/src/app/login/page.tsx` - Forms & inputs

---

## 🆘 Support

Jika ada pertanyaan atau issue:
1. Check documentation di `MODERN_STYLE_GUIDE.md`
2. Lihat contoh implementasi di components
3. Test di berbagai browser & devices

---

**Design System Version**: Modern v1.0  
**Last Updated**: 2024  
**Maintainer**: ATKK Team
