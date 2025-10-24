# Implementation Plan

## Integration Approach

This is a **copy-and-integrate** implementation. The Smart Scraper app is already fully functional with UI that perfectly matches the main app. We will:
1. Copy all scraper files to the main app without modifications
2. Add dependencies to package.json
3. Add role-based access control (Dashboard card, Navigation link, page redirect)
4. Add authentication middleware to API routes
5. Test that everything works together

**No UI changes are needed** - the scraper components are already styled to match the main app.

## Tasks

- [x] 1. Set up project dependencies and structure
  - Install new dependencies (@sparticuz/chromium, puppeteer-core, react-window, uuid, xlsx) and their type definitions
  - Verify no dependency conflicts exist between main app and scraper packages
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

- [x] 2. Copy scraper library and utilities (no modifications)
  - Copy entire smart-scraper/src/lib/scraper/ directory to smart-cost-calculator/src/lib/scraper/
  - Copy entire smart-scraper/src/lib/export/ directory to smart-cost-calculator/src/lib/export/
  - Copy smart-scraper/src/lib/toast.ts to smart-cost-calculator/src/lib/toast.ts (if not already present or merge if needed)
  - Copy smart-scraper/src/lib/utils.ts to smart-cost-calculator/src/lib/utils.ts (if not already present or merge if needed)
  - _Requirements: 5.6_

- [x] 3. Copy Zustand scraper store (no modifications)
  - Copy smart-scraper/src/store/scraper.ts to smart-cost-calculator/src/store/scraper.ts
  - _Requirements: 5.6_

- [x] 4. Copy scraper UI components (no modifications)



  - Copy entire smart-scraper/src/components/scraper/ directory to smart-cost-calculator/src/components/scraper/
  - Copy smart-scraper/src/components/ui/ErrorBoundary.tsx to smart-cost-calculator/src/components/ui/ErrorBoundary.tsx (if not already present)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 5. Copy custom hooks (no modifications)





  - Create smart-cost-calculator/src/hooks/ directory
  - Copy smart-scraper/src/hooks/useAutoExport.ts to smart-cost-calculator/src/hooks/useAutoExport.ts
  - _Requirements: 5.6_

- [x] 6. Create authentication middleware for API routes





  - Create middleware utility function at smart-cost-calculator/src/lib/auth-middleware.ts to check user authentication
  - Implement role-based authorization check for admin and manager roles
  - Return appropriate HTTP status codes (401 for unauthenticated, 403 for unauthorized)
  - _Requirements: 3.4, 3.5, 7.3, 7.4, 7.5_

- [x] 7. Copy scraper API routes with authentication





  - Copy smart-scraper/src/app/api/scrape/ directory to smart-cost-calculator/src/app/api/scrape/
  - Copy smart-scraper/src/app/api/export/ directory to smart-cost-calculator/src/app/api/export/
  - Copy smart-scraper/src/app/api/lookup/route.ts to smart-cost-calculator/src/app/api/lookup/route.ts
  - Copy smart-scraper/src/app/api/business-lookup/route.ts to smart-cost-calculator/src/app/api/business-lookup/route.ts
  - Add authentication middleware calls to all copied API route handlers
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [x] 8. Copy scraper page and add role-based access control





  - Copy smart-scraper/src/app/scraper/page.tsx to smart-cost-calculator/src/app/scraper/page.tsx
  - Add useAuthStore import at the top
  - Add useRouter import from next/navigation
  - Add useEffect hook at the beginning of the component to check authentication and role
  - Implement redirect logic: if not authenticated, redirect to /login; if not admin/manager, show error toast and redirect to /
  - _Requirements: 3.1, 3.2, 3.3, 5.1, 5.2, 5.3, 5.4, 5.5, 5.7, 5.8, 5.9, 5.10_

- [x] 9. Add Smart Scraper card to Dashboard





  - Modify smart-cost-calculator/src/app/page.tsx
  - Add Smart Scraper quick action card to quickActions array
  - Implement conditional rendering based on user role (admin or manager only)
  - Use Search or appropriate icon from lucide-react
  - Set href to '/scraper' route
  - Apply consistent styling with existing dashboard cards (color: bg-teal-500, textColor: text-teal-500)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 10. Add Smart Scraper link to Navigation bar





  - Modify smart-cost-calculator/src/components/layout/Navigation.tsx
  - Add Smart Scraper navigation item to navigationItems array
  - Implement conditional rendering based on user role (admin or manager only)
  - Use Search or appropriate icon from lucide-react
  - Set href to '/scraper' route
  - Ensure active state highlighting works when on /scraper route
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 11. Verify scraper page integration






  - Verify scraper page renders correctly with Navigation bar from main app layout
  - Verify all scraper components render without any styling issues
  - Test responsive design on mobile, tablet, and desktop viewports
  - Confirm no UI modifications are needed (scraper already matches main app design)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 12. Test role-based access control
  - Test admin user can see and access Smart Scraper from Dashboard
  - Test manager user can see and access Smart Scraper from Dashboard
  - Test regular user cannot see Smart Scraper card on Dashboard
  - Test admin user can see and access Smart Scraper from Navigation
  - Test manager user can see and access Smart Scraper from Navigation
  - Test regular user cannot see Smart Scraper navigation item
  - Test regular user is redirected when accessing /scraper directly
  - Test unauthenticated user is redirected to login when accessing /scraper
  - Test API routes return 403 for regular users
  - Test API routes return 401 for unauthenticated requests
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ]* 13. Test scraping functionality
  - Test scraping starts successfully with valid town and industry inputs
  - Test validation errors display for missing towns or industries
  - Test real-time progress updates display correctly during scraping
  - Test activity logs display in real-time
  - Test pause functionality pauses active scraping session
  - Test resume functionality resumes paused session
  - Test stop functionality stops active session
  - Test SSE connection establishes and receives events
  - Test SSE connection closes properly on component unmount
  - Test concurrency controls affect scraping behavior
  - _Requirements: 5.1, 5.2, 5.3, 5.8, 5.10_

- [ ]* 14. Test export and lookup functionality
  - Test Excel export generates correct file with all business data
  - Test Excel export includes hyperlinks when requested
  - Test provider export groups businesses correctly by provider
  - Test number lookup returns phone number details
  - Test business lookup returns business details
  - Test export functionality works with large datasets
  - _Requirements: 5.4, 5.5_

- [ ]* 15. Test session management
  - Test session save functionality stores session data
  - Test session load functionality restores session data
  - Test session data persists in localStorage
  - Test clear functionality resets all data
  - Test auto-export triggers when scraping completes
  - _Requirements: 5.7_

- [ ]* 16. Performance and error handling verification
  - Verify scraping handles network errors gracefully
  - Verify SSE reconnects automatically on connection loss
  - Verify error messages display in toast notifications
  - Verify large business lists render efficiently with virtualization
  - Verify browser instances clean up after scraping completes
  - Verify log debouncing prevents UI performance issues
  - _Requirements: 5.8, 5.9_
 