# 🚀 Implementation Roadmap - All 20 Features

## ✅ Status: IN PROGRESS

### Already Completed (from previous session):
1. ✅ Dashboard Analytics dengan Charts
2. ✅ Bulk Approval
3. ✅ Pagination
4. ✅ Neumorphism Design System

---

## 🎯 Phase 1: Core Essentials (Priority 1)

### ✅ 1. Notification System
**Status:** 80% Complete
**Files Created:**
- `src/lib/notifications.ts` - Core notification logic
- `src/components/notification-bell.tsx` - UI component
- Database: `notifications` table created

**TODO:**
- [ ] Integrate dengan actions (approve/reject)
- [ ] Setup SMTP untuk email (optional)
- [ ] Add notification bell ke AppShell

**Dependencies:** ✅ Installed

---

### ⏳ 2. Low Stock Alert System
**Status:** 50% Complete
**Files Modified:**
- `scripts/setup-db.mjs` - Added `min_stok` column
- Database: `barang.min_stok` column added

**TODO:**
- [ ] Component `<LowStockAlert>` untuk dashboard
- [ ] Background job untuk check stock
- [ ] Auto-notify admins saat stok < min_stok
- [ ] Form untuk set min_stok per item

**Implementation Plan:**
```typescript
// src/components/low-stock-alert.tsx
- Widget di admin dashboard
- List barang yang stok < min_stok
- Badge count di sidebar
- Link langsung ke edit barang

// src/lib/actions.ts
- checkLowStock() function
- notifyLowStockToAdmins()
- Update stok action untuk trigger check
```

---

### ⏳ 3. Advanced Search & Filter
**Status:** 0% Complete

**Implementation Plan:**
```typescript
// src/components/advanced-search.tsx
<AdvancedSearch
  onSearch={(filters) => {...}}
  fields={[
    { name: 'status', type: 'select', options: [...] },
    { name: 'dateRange', type: 'daterange' },
    { name: 'kategori', type: 'select' },
    { name: 'search', type: 'text' }
  ]}
/>

// Features:
- Combine multiple filters
- Date range picker (from-to)
- Clear all filters button
- Save filter preferences (localStorage)
- URL query params untuk shareable links
```

**Files to Create:**
- `src/components/advanced-search.tsx`
- `src/components/date-range-picker.tsx`
- `src/hooks/useSearchParams.ts`

**Dependencies Need:**
```bash
npm install react-day-picker
```

---

### ⏳ 4. User Profile & Password Change
**Status:** 0% Complete

**Implementation Plan:**
```typescript
// src/app/(user)/profile/page.tsx
- View current user info
- Edit nama (with validation)
- Change password form
- Password strength meter
- Security: require old password

// src/app/admin/profile/page.tsx
- Same as user but for admin

// src/lib/actions.ts
export async function updateProfile(formData)
export async function changePassword(oldPassword, newPassword)
```

**Files to Create:**
- `src/app/(user)/profile/page.tsx`
- `src/app/admin/profile/page.tsx`
- `src/components/profile-form.tsx`
- `src/components/password-strength-meter.tsx`

---

### ⏳ 5. Export Excel for Reports
**Status:** 0% Complete

**Implementation Plan:**
```typescript
// src/app/admin/laporan/export-excel/route.ts
- Generate .xlsx with multiple sheets
- Sheet 1: Summary (stats)
- Sheet 2: Detail transactions
- Styling: headers bold, borders, auto-width
- Filters applied to export

// Use xlsx library (already installed)
import * as XLSX from 'xlsx';
```

**Files to Create:**
- `src/app/admin/laporan/export-excel/route.ts`
- `src/app/(user)/laporan/export-excel/route.ts`
- `src/lib/excel.ts` (helper functions)

---

## 🚀 Phase 2: Enhanced Features (Priority 2)

### ⏳ 6. Return/Completion Workflow
**Status:** 0% Complete

**Database Changes:**
```sql
ALTER TABLE PERMINTAAN 
ADD COLUMN status_return VARCHAR(20) DEFAULT 'BELUM_DIKEMBALIKAN';
-- Values: BELUM_DIKEMBALIKAN, DIKEMBALIKAN, TIDAK_PERLU

ADD COLUMN tanggal_kembali DATE;
ADD COLUMN catatan_kembali TEXT;
```

**Implementation:**
- Mark as returned button (admin only)
- Auto-return stock saat dikembalikan
- Laporan barang belum dikembali
- Optional: scan barcode untuk return

---

### ⏳ 7. Enhanced User Dashboard
**Files to Create:**
- `src/components/usage-chart.tsx` (personal stats)
- `src/components/activity-timeline.tsx`
- Update `src/app/(user)/dashboard/page.tsx`

**Features:**
- Personal usage chart (monthly)
- Quick stats cards
- Recent activity timeline
- Frequently requested items list

---

### ⏳ 8. Role Management (Granular)
**Database Changes:**
```sql
ALTER TABLE pengguna 
ALTER COLUMN role TYPE VARCHAR(20);
-- Add: viewer, supervisor, super_admin

CREATE TABLE role_permissions (
  id SERIAL PRIMARY KEY,
  role VARCHAR(20),
  permission VARCHAR(100),
  UNIQUE(role, permission)
);
```

**Implementation:**
- Permission matrix UI
- Role assignment page
- Middleware check permissions
- Feature flags per role

---

### ⏳ 9. Activity Log / Audit Trail
**Status:** 50% Complete (table created)

**TODO:**
- [ ] logActivity() function in all actions
- [ ] Admin page `/admin/logs` to view logs
- [ ] Filter by user, action, date
- [ ] Export logs to Excel

```typescript
// src/lib/audit.ts
export async function logActivity(
  userId: number,
  action: string,
  entityType: string,
  entityId: number,
  details: object,
  ipAddress?: string
)
```

---

### ⏳ 10. Bulk Import Barang (Excel)
**Files to Create:**
- `src/app/admin/barang/import/page.tsx`
- `src/lib/import-excel.ts`

**Features:**
- Download Excel template
- Upload & validate
- Preview before save
- Error handling with line numbers
- Batch insert with transaction

---

## 💡 Phase 3: Advanced Features (Priority 3)

### ⏳ 11. Barcode/QR Code System
**Dependencies:**
```bash
npm install qrcode (already installed)
npm install html5-qrcode
```

**Features:**
- Generate QR per barang
- Print QR labels (PDF)
- Scan QR untuk quick borrow
- Scan QR di return process

---

### ⏳ 12. Real-time Updates (WebSocket)
**Dependencies:**
```bash
npm install socket.io socket.io-client
```

**Implementation:**
- WebSocket server (Next.js API route)
- Real-time notification push
- Live stock counter
- Live approval status

---

### ⏳ 13. Booking/Reservation System
**Database:**
```sql
CREATE TABLE reservations (
  id SERIAL PRIMARY KEY,
  pengguna_id INTEGER REFERENCES pengguna(id),
  barang_id INTEGER REFERENCES barang(id),
  jumlah INTEGER,
  tanggal_reserve DATE,
  tanggal_expired DATE,
  status VARCHAR(20), -- RESERVED, TAKEN, EXPIRED, CANCELLED
  created_at TIMESTAMPTZ
);
```

---

### ⏳ 14. Comment Thread per Request
**Database:**
```sql
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  PERMINTAAN_id INTEGER REFERENCES PERMINTAAN(id),
  user_id INTEGER REFERENCES pengguna(id),
  comment TEXT,
  created_at TIMESTAMPTZ
);
```

---

### ⏳ 15. Multi-Level Approval Workflow
**Database:**
```sql
CREATE TABLE approval_workflows (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  threshold_jumlah INTEGER,
  required_roles TEXT[], -- ['supervisor', 'admin']
  sequence INTEGER
);

CREATE TABLE approval_steps (
  id SERIAL PRIMARY KEY,
  PERMINTAAN_id INTEGER REFERENCES PERMINTAAN(id),
  approver_id INTEGER REFERENCES pengguna(id),
  step_order INTEGER,
  status VARCHAR(20), -- PENDING, APPROVED, REJECTED
  notes TEXT,
  created_at TIMESTAMPTZ
);
```

---

### ⏳ 16. Custom Report Builder
**Implementation:**
- Drag & drop column selector
- Group by selector
- Chart type selector
- Save report templates
- Schedule email reports (cron)

---

### ⏳ 17. Dark Mode
**Implementation:**
- Toggle switch in sidebar
- localStorage persistence
- Neumorphism dark variant colors
- CSS variables for theming
- System preference detection

---

### ⏳ 18. Keyboard Shortcuts
**Dependencies:**
```bash
npm install react-hotkeys-hook
```

**Shortcuts:**
- `Cmd+K` / `Ctrl+K` - Command palette
- `A` - Approve (in approval page)
- `R` - Reject
- `/` - Focus search
- `Esc` - Close modals
- Arrow keys - Navigate table

---

### ⏳ 19. Upload Bukti (Photos)
**Dependencies:**
```bash
npm install @vercel/blob (untuk storage)
# or use Cloudinary/S3
```

**Implementation:**
- Image upload di form
- Preview before submit
- Thumbnail gallery
- Image compression client-side
- Lazy loading images

---

### ⏳ 20. REST API & Webhooks
**Implementation:**
```typescript
// src/app/api/v1/barang/route.ts
export async function GET(request: Request)
export async function POST(request: Request)

// API Key authentication
// Rate limiting
// Swagger documentation
// Webhook endpoints untuk events
```

---

## 📊 Implementation Statistics

| Phase | Features | Status | ETA |
|-------|---------|--------|-----|
| Phase 0 (Done) | 4 features | 100% | ✅ |
| Phase 1 | 5 features | 26% | 6-8 hours |
| Phase 2 | 5 features | 0% | 8-10 hours |
| Phase 3 | 10 features | 0% | 15-20 hours |

**Total:** 24 features (including 4 completed)
**Remaining:** 20 features
**Estimated Total Time:** 29-38 hours

---

## 🎯 Recommended Implementation Order

If we prioritize by impact/effort ratio:

1. ✅ **Notification System** (80% done) - Complete integration
2. ⏳ **Low Stock Alert** (50% done) - Finish widget
3. ⏳ **Profile & Password Change** (Easy, high impact)
4. ⏳ **Advanced Search** (Medium effort, high usage)
5. ⏳ **Export Excel** (Easy, frequently requested)
6. ⏳ **Activity Log UI** (Table exists, need UI)
7. ⏳ **Return Workflow** (Medium complexity)
8. ⏳ **Enhanced User Dashboard** (UX improvement)
9. ⏳ **Dark Mode** (Easy, modern UX)
10. ⏳ **Bulk Import** (Time saver for admin)

The rest (11-20) can be implemented based on actual business needs.

---

## 🔧 Next Steps

To continue implementation, specify which feature(s) you want implemented next:

**Option A:** "Lanjutkan Phase 1 (complete all Top 5)"
**Option B:** "Fokus ke [feature name] dulu"
**Option C:** "Implementasi fitur yang paling mudah dulu"
**Option D:** "Prioritaskan fitur yang paling sering dipakai"

Current state: Notification system 80% done, database migrations complete, ready for next feature.
