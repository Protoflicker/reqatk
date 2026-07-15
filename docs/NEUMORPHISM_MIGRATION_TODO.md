# Neumorphism Migration Guide

## ✅ Sudah Selesai

### 1. Design System
- [x] `src/app/globals.css` - Updated dengan neumorphism theme
- [x] Color palette: Blue (#2563EB), White (#F0F4F8), Black (#1E293B)
- [x] Shadow system untuk raised/inset effects
- [x] Utility classes: `.neu-raised`, `.neu-btn`, `.neu-card`, `.neu-input`

### 2. New Features Implemented
- [x] **Analytics Charts** - `src/components/analytics-chart.tsx`
  - Line chart untuk trend 6 bulan
  - Bar chart untuk top 10 items
  - Doughnut chart untuk status distribution
  
- [x] **Bulk Approval** - `src/components/bulk-approval.tsx`
  - Checkbox selection untuk multiple items
  - Bulk approve/reject dengan confirmation
  - Floating action bar
  
- [x] **Pagination** - `src/components/pagination.tsx`
  - Smart pagination dengan ellipsis
  - Prev/Next navigation
  - Neumorphic button style

### 3. Updated Pages
- [x] `src/app/admin/page.tsx` - Dashboard dengan analytics charts
- [x] `src/app/admin/PERMINTAAN/page.tsx` - Dengan bulk approval & pagination
- [x] `src/app/admin/PERMINTAAN/PERMINTAAN-client.tsx` - Client component wrapper
- [x] `src/components/app-shell.tsx` - Neumorphic header/footer

### 4. Updated Actions
- [x] `src/lib/actions.ts` - Added `bulkApprovePERMINTAAN` dan `bulkRejectPERMINTAAN`

### 5. Dependencies
- [x] Installed `chart.js` and `react-chartjs-2`

## 🚧 Perlu Diupdate ke Neumorphism Style

### High Priority (User-facing components)
- [ ] `src/app/login/page.tsx` - Login page UI
- [ ] `src/components/sidebar.tsx` - Navigation sidebar
- [ ] `src/components/login-form.tsx` - Form inputs
- [ ] `src/components/status-badge.tsx` - Status pills
- [ ] `src/components/alert.tsx` - Alert messages
- [ ] `src/components/page-header.tsx` - Page headers

### Medium Priority (Admin pages)
- [ ] `src/app/admin/barang/page.tsx` - Barang management
- [ ] `src/app/admin/pengguna/page.tsx` - User management
- [ ] `src/app/admin/laporan/page.tsx` - Admin reports
- [ ] `src/components/barang-form.tsx` - Item form
- [ ] `src/components/pengguna-form.tsx` - User form
- [ ] `src/components/confirm-button.tsx` - Confirmation dialogs

### Low Priority (User pages)
- [ ] `src/app/(user)/dashboard/page.tsx` - User dashboard
- [ ] `src/app/(user)/barang/page.tsx` - Browse items
- [ ] `src/app/(user)/PERMINTAAN/page.tsx` - Borrow form
- [ ] `src/app/(user)/laporan/page.tsx` - User reports
- [ ] `src/components/PERMINTAAN-form.tsx` - Borrow form
- [ ] `src/components/empty-state.tsx` - Empty states
- [ ] `src/components/stat-tile.tsx` - Stat cards

## 🎨 Design Token Reference

```css
/* Colors */
--color-bg: #e6ebf0;           /* Background */
--color-surface: #f0f4f8;       /* Cards/surfaces */
--color-primary: #2563eb;       /* Primary actions */
--color-primary-dark: #1d4ed8;  /* Primary hover */
--color-dark: #1e293b;          /* Text */
--color-text-muted: #64748b;    /* Muted text */

/* Shadows */
--shadow-raised: 8px 8px 16px #c5cdd6, -8px -8px 16px #ffffff;
--shadow-inset: inset 4px 4px 8px #c5cdd6, inset -4px -4px 8px #ffffff;
--shadow-sm: 4px 4px 8px #d1d9e0, -4px -4px 8px #ffffff;

/* Border Radius */
border-radius: 12px (inputs) | 20px (cards)
```

## 🔄 Migration Pattern

### Old Style (Swiss Industrial)
```tsx
<div className="border-2 border-ink bg-paper">
  <button className="btn btn-solid">Click</button>
</div>
```

### New Style (Neumorphism)
```tsx
<div className="neu-card">
  <button className="neu-btn-primary">Click</button>
</div>
```

### Component Classes Mapping
- `border-2 border-ink` → `neu-card` atau `neu-raised`
- `btn btn-solid` → `neu-btn-primary`
- `btn` → `neu-btn`
- `input` → `neu-input`
- `text-red` → `text-primary`
- `text-ink` → `text-dark`
- `bg-paper` → `bg-surface`

## 📝 Notes

1. Semua border-radius harus soft (12-20px)
2. Gunakan shadows untuk depth, bukan borders
3. Primary color adalah blue (#2563EB), bukan red
4. Keep typography (JetBrains Mono & Archivo Black)
5. Maintain accessibility (focus states, ARIA labels)

## 🧪 Testing Checklist

- [ ] Login flow works
- [ ] Navigation responsive
- [ ] Charts render correctly
- [ ] Bulk approval works (select, approve, reject)
- [ ] Pagination works
- [ ] Forms submit correctly
- [ ] Mobile responsive
- [ ] Keyboard navigation
- [ ] Screen reader friendly
