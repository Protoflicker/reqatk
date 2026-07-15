# ✅ Migration Checklist

## Pre-Migration

### 1. Backup
- [ ] Backup current `globals.css`
- [ ] Commit current state to git
- [ ] Take screenshots of current UI

### 2. Review
- [ ] Read `MODERN_STYLE_GUIDE.md`
- [ ] Check `VISUAL_COMPARISON.md`
- [ ] Review `STYLE_CHANGES_SUMMARY.md`

### 3. Preview
- [ ] Open `modern-style-preview.html`
- [ ] Compare with current design
- [ ] Note any concerns

---

## During Migration

### Phase 1: CSS Update ✅
- [x] Update `src/app/globals.css`
- [x] New utility classes added
- [x] Legacy compatibility maintained

### Phase 2: Component Testing
- [ ] **Buttons**
  - [ ] Default buttons
  - [ ] Primary buttons
  - [ ] Danger buttons
  - [ ] Disabled states
  - [ ] Icon buttons
  - [ ] Button groups

- [ ] **Forms**
  - [ ] Text inputs
  - [ ] Email inputs
  - [ ] Password inputs
  - [ ] Select dropdowns
  - [ ] Textareas
  - [ ] Checkboxes
  - [ ] Radio buttons
  - [ ] Input validation states

- [ ] **Cards**
  - [ ] Basic cards
  - [ ] Card hover effects
  - [ ] Card grids
  - [ ] Card with images
  - [ ] Card with actions

- [ ] **Tables**
  - [ ] Table headers
  - [ ] Table rows
  - [ ] Table hover
  - [ ] Mobile scrolling
  - [ ] Empty states

- [ ] **Badges**
  - [ ] Default badges
  - [ ] Colored badges
  - [ ] Badge sizes
  - [ ] Badge in cards

- [ ] **Layouts**
  - [ ] Grid layouts
  - [ ] Flexbox layouts
  - [ ] Responsive behavior
  - [ ] Spacing consistency

### Phase 3: Page Testing

- [ ] **Login Page** (`/login`)
  - [ ] Layout intact
  - [ ] Form styling
  - [ ] Button states
  - [ ] Responsive design

- [ ] **Dashboard** (`/dashboard`)
  - [ ] Stats cards
  - [ ] Charts display
  - [ ] Greeting card
  - [ ] Activity feed
  - [ ] Quick actions

- [ ] **Data Aset** (`/barang`)
  - [ ] Asset cards
  - [ ] Filters
  - [ ] Search bar
  - [ ] Grid layout
  - [ ] Detail modal

- [ ] **PERMINTAAN** (`/PERMINTAAN`)
  - [ ] Request form
  - [ ] Status badges
  - [ ] Date pickers
  - [ ] Table view
  - [ ] Action buttons

- [ ] **Laporan** (`/laporan`)
  - [ ] Report cards
  - [ ] Export buttons
  - [ ] Date range
  - [ ] Charts
  - [ ] Print view

- [ ] **Admin Pages**
  - [ ] User management
  - [ ] Asset management
  - [ ] Approval queue
  - [ ] Logs viewer

- [ ] **Profile Page** (`/profile`)
  - [ ] Avatar display
  - [ ] Info cards
  - [ ] Edit form
  - [ ] Save button

### Phase 4: Interaction Testing

- [ ] **Hover States**
  - [ ] Button hover
  - [ ] Card hover
  - [ ] Link hover
  - [ ] Icon hover
  - [ ] Badge hover

- [ ] **Focus States**
  - [ ] Input focus
  - [ ] Button focus
  - [ ] Link focus
  - [ ] Tab navigation

- [ ] **Active States**
  - [ ] Button active
  - [ ] Link active
  - [ ] Menu active

- [ ] **Animations**
  - [ ] Page transitions
  - [ ] Modal open/close
  - [ ] Toast notifications
  - [ ] Loading states
  - [ ] Skeleton loaders

### Phase 5: Responsive Testing

- [ ] **Desktop** (1920x1080)
  - [ ] All pages render correctly
  - [ ] No horizontal scroll
  - [ ] Proper spacing

- [ ] **Laptop** (1366x768)
  - [ ] Layout adapts
  - [ ] Readable text
  - [ ] Accessible buttons

- [ ] **Tablet** (768x1024)
  - [ ] Grids collapse
  - [ ] Touch targets adequate
  - [ ] Sidebar behavior

- [ ] **Mobile** (375x667)
  - [ ] Single column layout
  - [ ] Table scrolling
  - [ ] Form usability
  - [ ] Navigation works

### Phase 6: Browser Testing

- [ ] **Chrome**
  - [ ] Latest version
  - [ ] Styles render
  - [ ] Animations smooth

- [ ] **Firefox**
  - [ ] Latest version
  - [ ] No CSS bugs
  - [ ] Focus states visible

- [ ] **Safari**
  - [ ] Latest version
  - [ ] Backdrop filters work
  - [ ] Border rendering

- [ ] **Edge**
  - [ ] Latest version
  - [ ] Full compatibility

### Phase 7: Accessibility Testing

- [ ] **Keyboard Navigation**
  - [ ] Tab order logical
  - [ ] Focus visible
  - [ ] Enter/Space works
  - [ ] Escape closes modals

- [ ] **Screen Reader**
  - [ ] Labels present
  - [ ] ARIA attributes
  - [ ] Announcements clear

- [ ] **Color Contrast**
  - [ ] Text readable
  - [ ] Buttons clear
  - [ ] Status indicators distinct

- [ ] **Reduced Motion**
  - [ ] Animations respect preference
  - [ ] No jarring movements
  - [ ] Content still accessible

### Phase 8: Performance

- [ ] **Load Time**
  - [ ] CSS loads fast
  - [ ] No FOUC (Flash of Unstyled Content)
  - [ ] Fonts load properly

- [ ] **Animation Performance**
  - [ ] 60fps animations
  - [ ] No jank
  - [ ] GPU acceleration

- [ ] **Bundle Size**
  - [ ] CSS size reasonable
  - [ ] No duplicate rules
  - [ ] Minification works

---

## Post-Migration

### 1. Documentation
- [ ] Update component docs
- [ ] Add usage examples
- [ ] Screenshot new UI
- [ ] Update README

### 2. Training
- [ ] Share style guide with team
- [ ] Demo new components
- [ ] Answer questions
- [ ] Create video walkthrough

### 3. Monitoring
- [ ] Check error logs
- [ ] Monitor user feedback
- [ ] Track performance metrics
- [ ] Watch for bug reports

### 4. Refinement
- [ ] Collect feedback
- [ ] Make adjustments
- [ ] Fix edge cases
- [ ] Polish interactions

---

## Common Issues & Fixes

### Issue: Button looks wrong
**Check:**
- [ ] Using correct class (`neu-btn-primary` not `sesd-btn-primary`)
- [ ] No conflicting inline styles
- [ ] CSS file loaded correctly

### Issue: Card not hovering properly
**Check:**
- [ ] Using `.card` class
- [ ] Not overriding hover styles
- [ ] No pointer-events: none

### Issue: Input not focusing
**Check:**
- [ ] Using `.neu-input` class
- [ ] Focus styles not disabled
- [ ] Browser DevTools shows correct styles

### Issue: Mobile layout broken
**Check:**
- [ ] Viewport meta tag present
- [ ] Using responsive classes
- [ ] Testing on actual device

### Issue: Animation too fast/slow
**Check:**
- [ ] Using correct animation class
- [ ] Not overriding duration
- [ ] Reduced motion not enabled

---

## Rollback Plan

If critical issues found:

1. **Immediate**
   ```bash
   git checkout <previous-commit>
   ```

2. **Investigate**
   - Document the issue
   - Screenshot the problem
   - Check browser console

3. **Fix & Retest**
   - Make targeted fix
   - Test in isolation
   - Re-deploy

---

## Success Criteria

Migration is complete when:
- [ ] All pages render correctly
- [ ] No console errors
- [ ] Responsive on all devices
- [ ] Accessible (WCAG 2.1 AA)
- [ ] Performance maintained
- [ ] User feedback positive
- [ ] Team trained on new system

---

## Timeline Estimate

- **Phase 1**: 1 hour (CSS update) ✅
- **Phase 2**: 2-3 hours (Component testing)
- **Phase 3**: 3-4 hours (Page testing)
- **Phase 4**: 1-2 hours (Interaction)
- **Phase 5**: 2-3 hours (Responsive)
- **Phase 6**: 1-2 hours (Browsers)
- **Phase 7**: 1-2 hours (Accessibility)
- **Phase 8**: 1 hour (Performance)

**Total**: ~15-20 hours

---

## Notes

### Important
- Test on real devices, not just browser DevTools
- Get feedback from actual users
- Don't skip accessibility testing
- Document any issues found

### Tips
- Test one component at a time
- Use browser DevTools extensively
- Take before/after screenshots
- Keep a testing log

### Resources
- [MODERN_STYLE_GUIDE.md](./MODERN_STYLE_GUIDE.md)
- [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
- [VISUAL_COMPARISON.md](./VISUAL_COMPARISON.md)
- [modern-style-preview.html](./modern-style-preview.html)

---

**Started**: ___/___/___  
**Completed**: ___/___/___  
**Tested By**: ___________  
**Status**: ⏳ In Progress
