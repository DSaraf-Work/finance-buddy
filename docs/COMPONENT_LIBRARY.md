# Finance Buddy Component Library

## Component Inventory & Migration Status

### Core UI Components

#### Base Components
- **Button** - Custom implementation → Migrate to shadcn/ui Button
- **Card** - Custom implementation → Migrate to shadcn/ui Card
- **Input** - HTML input → Migrate to shadcn/ui Input
- **Select** - HTML select → Migrate to shadcn/ui Select
- **Modal** - TransactionModal, ReviewEditModal → Migrate to shadcn/ui Dialog
- **Toast** - Custom Toast component → Migrate to shadcn/ui Toast
- **Loading** - LoadingScreen, Skeletons → Migrate to shadcn/ui Skeleton

#### Layout Components
- **Layout** - Main app layout with navigation
- **ProtectedRoute** - Auth wrapper component

#### Navigation Components
- **NotificationBell** - Custom notification icon
- **BackToTop** - Scroll to top button
- **PWAInstallButton** - PWA installation prompt
- **PWAInstallPrompt** - Installation guide modal
- **SafariInstallGuide** - Safari-specific install instructions

### Domain-Specific Components

#### Transaction Components (/transactions)
- **TxnCard** - Transaction list item (uses matte dark theme)
- **TxnList** - Transaction list container
- **TxnListHeader** - List header with count
- **TxnLoadingSkeleton** - Loading state
- **TxnEmptyState** - Empty state message
- **TxnErrorState** - Error state display
- **TxnStyles** - CSS-in-JS styles

#### Dashboard Components
- **StatCard** - Statistics display card
- **QuickActions** - Action buttons grid
- **ConnectedAccounts** - Gmail connections list
- **RecentTransactions** - Recent transactions widget
- **DashboardStyles** - Dashboard-specific styles

#### Reports Components
- **ReportCard** - Report summary card
- **DataTable** - Data display table
- **DateRangePicker** - Date selection
- **FilterChip** - Filter tag/chip
- **ProgressBar** - Progress indicator
- **ReportLoadingSkeleton** - Report loading state
- **ReportStyles** - Report-specific styles

#### Settings Components
- **CategoriesManager** - Category CRUD
- **KeywordManager** - Keyword management
- **KeywordTagInput** - Tag input field
- **InteractiveKeywordSelector** - Keyword picker
- **BankAccountTypesManager** - Account type management
- **CustomAccountTypesManager** - Custom account types
- **SplitwiseDropdown** - Splitwise integration

#### Review Components
- **ReviewTransactionRow** - Review page transaction row
- **ReviewEditModal** - Edit modal for review
- **ReviewFilters** - Filter controls

#### Legacy/Duplicate Components (TO REMOVE)
- **TransactionCard** - Duplicate of TxnCard
- **TransactionRow** - Old transaction display
- **TransactionFilters** - Old filter component
- **TransactionEmptyState** - Duplicate of TxnEmptyState
- **TransactionSkeleton** - Duplicate of TxnLoadingSkeleton
- **TransactionStats** - Unused statistics component

### Component Mapping to shadcn/ui

| Current Component | shadcn/ui Component | Priority | Notes |
|------------------|-------------------|----------|-------|
| Custom Buttons | Button | HIGH | Used everywhere |
| Custom Cards | Card | HIGH | Main container component |
| HTML Inputs | Input | HIGH | Forms throughout app |
| HTML Selects | Select | MEDIUM | Dropdowns and filters |
| TransactionModal | Dialog | HIGH | Modal dialogs |
| Toast | Toast/Sonner | HIGH | Notifications |
| Skeletons | Skeleton | MEDIUM | Loading states |
| FilterChip | Badge | MEDIUM | Status indicators |
| DataTable | Table | LOW | Data display |
| DateRangePicker | Calendar/DatePicker | LOW | Date selection |
| ProgressBar | Progress | LOW | Progress indicators |
| Custom Dropdowns | DropdownMenu | MEDIUM | Menu components |
| Separators | Separator | LOW | Visual dividers |
| N/A | ScrollArea | LOW | Scrollable containers |
| N/A | Tabs | LOW | Tab navigation |
| N/A | Accordion | LOW | Collapsible sections |

### Migration Priority

#### Phase 1: Core Components (Week 1)
1. Button
2. Card
3. Input
4. Select
5. Dialog/Modal
6. Toast

#### Phase 2: Data Display (Week 2)
7. Table
8. Skeleton
9. Badge
10. Separator
11. ScrollArea

#### Phase 3: Advanced Components (Week 3)
12. DropdownMenu
13. Calendar/DatePicker
14. Progress
15. Tabs
16. Accordion

### Component Usage by Page

#### High-Traffic Pages (Priority)
- **/transactions** - TxnCard, TxnList, TransactionModal
- **/index (dashboard)** - StatCard, QuickActions, RecentTransactions
- **/reports** - ReportCard, DataTable, DateRangePicker

#### Medium-Traffic Pages
- **/emails** - Table components, filters
- **/settings** - Form components, managers
- **/auth** - Input, Button components

#### Low-Traffic Pages
- **/admin** - Admin-specific components
- **/help** - Static content
- **/notifications** - Notification components

### Design Tokens

All components must use the following CSS variables for theming:

```css
/* Core colors from matte dark theme */
--background: #09090B;
--foreground: #FAFAFA;
--card: rgba(255, 255, 255, 0.04);
--card-foreground: #FAFAFA;
--muted: rgba(255, 255, 255, 0.04);
--muted-foreground: rgba(255, 255, 255, 0.35);
--border: rgba(255, 255, 255, 0.06);
--input: rgba(255, 255, 255, 0.1);
--primary: #6366F1;
--primary-foreground: #FAFAFA;
--destructive: #F87171;
--destructive-foreground: #FAFAFA;
--success: #22C55E;
--success-foreground: #FAFAFA;
--ring: rgba(255, 255, 255, 0.2);
```

### Component Development Guidelines

1. **Always use theme variables** - Never hardcode colors
2. **Mobile-first design** - Optimize for 430px width
3. **Consistent spacing** - Use standard spacing tokens
4. **Smooth animations** - 0.2s ease transitions
5. **Accessibility** - ARIA labels, keyboard navigation
6. **TypeScript** - Proper type definitions for all props
7. **Composition** - Build complex components from primitives

### Testing Requirements

- Visual regression tests with Playwright
- Component unit tests with Jest/React Testing Library
- Accessibility tests with axe-core
- Cross-browser testing (Chrome, Safari, Firefox)
- Mobile responsiveness testing