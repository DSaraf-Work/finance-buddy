# Design System Documentation

## 📚 Single Source of Truth

**All design system documentation is centralized in:**

### `design/DESIGN_SYSTEM.md`

This is the **only** authoritative source for:
- Color scheme (Midnight Blue Wealth theme)
- CSS variables reference
- Component patterns
- Typography
- Spacing system
- Accessibility guidelines
- Usage examples

---

## 🗑️ Removed Duplicate/Stale Documents

The following documents were **removed** and consolidated into `DESIGN_SYSTEM.md`:

1. ❌ `COLOR_SCHEME_REFERENCE.md` (root)
2. ❌ `COLOR_SCHEME_MIGRATION_COMPLETE_SUMMARY.md` (root)
3. ❌ `COLOR_SCHEME_MIGRATION_PLAN.md` (root)
4. ❌ `COLOR_SCHEME_GUIDE.md` (root)
5. ❌ `design/MIDNIGHT_BLUE_WEALTH_THEME.md`
6. ❌ `dev/doc/THEME_SYSTEM_USAGE_GUIDE.md`
7. ❌ `dev/doc/MIDNIGHT_BLUE_WEALTH_COMPLETE.md`
8. ❌ `dev/doc/MIDNIGHT_BLUE_WEALTH_MIGRATION_FINAL.md`

**Reason:** All information consolidated into single authoritative source.

---

## 📖 How to Use

1. **For color reference:** See `design/DESIGN_SYSTEM.md` → Color sections
2. **For component patterns:** See `design/DESIGN_SYSTEM.md` → Component Patterns
3. **For CSS variables:** See `design/DESIGN_SYSTEM.md` → CSS Variables
4. **For theme switching:** See `design/DESIGN_SYSTEM.md` → Theme Switching

---

## 🔗 Related Files

- **CSS Variables:** `src/styles/globals.css` (actual implementation)
- **Tailwind Config:** `tailwind.config.js` (references CSS variables)
- **Design System:** `design/DESIGN_SYSTEM.md` (documentation)

---

**Last Updated:** 2025-01-03  
**Status:** ✅ Centralized
