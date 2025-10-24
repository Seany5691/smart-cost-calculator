# Design Document: Smart Scraper Integration

## Overview

This design document outlines the technical approach for integrating the Smart Scraper application into the Smart Cost Calculator main application. The integration will add business intelligence scraping capabilities accessible only to Admin and Manager users.

**Important Note:** The Smart Scraper UI is already designed to perfectly match the main app's design system. This integration is primarily a **file migration and integration task** - we will copy files as-is without making UI modifications. The scraper components already use the same styling, glass-card effects, and responsive design patterns as the main app.

The integration involves:
- **Copying** all scraper components, stores, and utilities to the main app (no modifications)
- Adding role-based navigation elements (Dashboard card and Navigation bar item)
- Implementing route-level access control on the scraper page
- Merging dependencies and ensuring compatibility
- Copying API routes and adding authentication/authorization middleware

## Architecture

### High-Level Architecture

```
Smart Cost Calculator (Main App)
├── Existing Features
│   ├── Calculator
│   ├── Deals Management
│   ├── Admin Panel
│   └── User Management
└── New: Smart Scraper Feature (Admin/Manager only)
    ├── UI Components (from smart-scraper)
    ├── Zustand Store (scraper state)
    ├── API Routes (with RBAC)
    └── Scraping Engine (backend logic)
```

### Directory Structure

The integrated application will have the following structure:

```
smart-cost-calculator/
├── src/
│   ├── app/
│   │   ├── scraper/              # New: Scraper page
│   │   │   └── page.tsx
│   │   ├── api/
│   │   │   ├── scrape/           # New: Scraping API routes
│   │   │   │   ├── start/
│   │   │   │   ├── stop/
│   │   │   │   ├── pause/
│   │   │   │   ├── resume/
│   │   │   │   └── status/
│   │   │   ├── export/           # New: Export API routes
│   │   │   │   └── excel/
│   │   │   ├── lookup/           # New: Lookup API routes
│   │   │   └── business-lookup/  # New: Business lookup routes
│   │   ├── page.tsx              # Modified: Add scraper card
│   │   └── ...
│   ├── components/
│   │   ├── scraper/              # New: All scraper components
│   │   │   ├── TownInput.tsx
│   │   │   ├── IndustrySelector.tsx
│   │   │   ├── ControlPanel.tsx
│   │   │   ├── ProgressDisplay.tsx
│   │   │   ├── LogViewer.tsx
│   │   │   ├── ProviderExport.tsx
│   │   │   ├── ViewAllResults.tsx
│   │   │   ├── NumberLookup.tsx
│   │   │   ├── BusinessLookup.tsx
│   │   │   ├── SessionManager.tsx
│   │   │   ├── SummaryStats.tsx
│   │   │   └── ConcurrencyControls.tsx
│   │   ├── layout/
│   │   │   └── Navigation.tsx    # Modified: Add scraper link
│   │   └── ...
│   ├── store/
│   │   ├── scraper.ts            # New: Scraper Zustand store
│   │   └── ...
│   ├── lib/
│   │   ├── scraper/              # New: Scraping engine
│   │   │   ├── ScrapingOrchestrator.ts
│   │   │   ├── sessionStore.ts
│   │   │   ├── types.ts
│   │   │   └── ErrorLogger.ts
│   │   ├── export/               # New: Export utilities
│   │   │   └── ExportService.ts
│   │   └── ...
│   └── hooks/
│       ├── useAutoExport.ts      # New: Auto-export hook
│       └── ...
└── package.json                  # Modified: Add scraper dependencies
```

## Components and Interfaces

### 1. Dashboard Integration

**Component:** `src/app/page.tsx`

**Modifications:**
- Add "Smart Scraper" quick action card to the `quickActions` array
- Apply conditional rendering based on user role (admin or manager)
- Use existing `GlassCard` and icon components for consistency

**Implementation:**
```typescript
const quickActions = [
  // ... existing actions
  ...(user.role === 'admin' || user.role === 'manager' ? [{
    title: 'Smart Scraper',
    description: 'Scrape business data from Google Maps',
    icon: Search, // or appropriate icon from lucide-react
    href: '/scraper',
    color: 'bg-teal-500',
    textColor: 'text-teal-500'
  }] : [])
];
```

### 2. Navigation Bar Integration

**Component:** `src/components/layout/Navigation.tsx`

**Modifications:**
- Add "Smart Scraper" navigation item to the `navigationItems` array
- Apply conditional rendering based on user role (admin or manager)
- Maintain existing active state highlighting logic

**Implementation:**
```typescript
const navigationItems = [
  // ... existing items
  ...(user?.role === 'admin' || user?.role === 'manager' ? [
    { name: 'Smart Scraper', href: '/scraper', icon: Search },
  ] : []),
];
```

### 3. Scraper Page Component

**Component:** `src/app/scraper/page.tsx`

**Features:**
- Client-side component with role-based access control
- Redirect non-authorized users to dashboard with error toast
- Render all scraper UI components
- Connect to scraper Zustand store
- Handle scraping lifecycle (start, stop, pause, resume)
- Display real-time progress and logs
- Support export and session management

**Access Control:**
```typescript
'use client';

export default function ScraperPage() {
  const { user, checkAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!checkAuth()) {
      router.push('/login');
      return;
    }
    
    if (user?.role !== 'admin' && user?.role !== 'manager') {
      toast.error('Access Denied', 'You do not have permission to access this feature');
      router.push('/');
    }
  }, [user, checkAuth, router]);

  // ... rest of component
}
```

### 4. Scraper Components

All components from `smart-scraper/src/components/scraper/` will be copied as-is to `smart-cost-calculator/src/components/scraper/`:

- **TownInput**: Multi-line text input for town names
- **IndustrySelector**: Multi-select dropdown with add/remove functionality
- **ControlPanel**: Start, stop, pause, resume, save, load, clear, export buttons
- **ProgressDisplay**: Real-time progress bar and statistics
- **LogViewer**: Scrollable log display with auto-scroll
- **ProviderExport**: Export businesses grouped by provider
- **ViewAllResults**: Collapsible table showing all scraped businesses
- **NumberLookup**: Phone number lookup tool
- **BusinessLookup**: Business name lookup tool
- **SessionManager**: Save and load scraping sessions
- **SummaryStats**: Display summary statistics after scraping
- **ConcurrencyControls**: Configure concurrent scraping settings

**No UI modifications are needed** - the scraper components are already designed to match the main app's design system perfectly.

### 5. Zustand Store

**Store:** `src/store/scraper.ts`

**State Management:**
- Scraping status (idle, running, paused, stopped, completed, error)
- Configuration (concurrency settings)
- Towns and industries arrays
- Progress tracking (completed towns, businesses scraped, elapsed time)
- Businesses array (scraped data)
- Logs array (activity log entries)
- Session management (sessionId, EventSource connection)

**Key Actions:**
- `startScraping()`: Initiate scraping session via API
- `stopScraping()`: Stop active session
- `pauseScraping()`: Pause active session
- `resumeScraping()`: Resume paused session
- `connectToSSE()`: Establish Server-Sent Events connection for real-time updates
- `disconnectSSE()`: Close SSE connection
- `addBusinesses()`: Add scraped businesses to state
- `addLog()`: Add log entry with debouncing
- `clearAll()`: Reset all data

**Persistence:**
- Use Zustand persist middleware
- Store configuration, towns, industries, businesses, and logs in localStorage
- Exclude transient state (status, sessionId, eventSource)

## Data Models

### Business Model

```typescript
interface Business {
  id: string;
  name: string;
  phone: string;
  address: string;
  maps_address: string;
  provider: string;
  type_of_business: string;
  town: string;
  notes: string;
  createdAt: string;
}
```

### Scraping Configuration

```typescript
interface ScrapingConfig {
  simultaneousTowns: number;        // 1-5
  simultaneousIndustries: number;   // 1-10
  simultaneousLookups: number;      // 1-20
  retryAttempts: number;            // Default: 3
  retryDelay: number;               // Default: 2000ms
  browserHeadless: boolean;         // Default: true
  lookupBatchSize: number;          // Default: 5
  outputFolder: string;             // Default: 'output'
}
```

### Progress State

```typescript
interface ProgressState {
  totalTowns: number;
  completedTowns: number;
  totalIndustries: number;
  completedIndustries: number;
  totalBusinesses: number;
  startTime: number;
  townCompletionTimes: number[];
}
```

### Log Entry

```typescript
interface LogEntry {
  timestamp: string;
  message: string;
  level: 'info' | 'success' | 'warning' | 'error';
}
```

## API Routes

### Authentication Middleware

All scraper API routes will include authentication and authorization middleware:

```typescript
// Middleware function
async function checkScraperAccess(request: NextRequest): Promise<NextResponse | null> {
  // Extract user from session/token
  const user = await getUserFromRequest(request);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  if (user.role !== 'admin' && user.role !== 'manager') {
    return NextResponse.json(
      { error: 'Forbidden: Insufficient permissions' },
      { status: 403 }
    );
  }
  
  return null; // Access granted
}
```

### API Endpoints

#### 1. POST /api/scrape/start
- **Purpose**: Start a new scraping session
- **Auth**: Required (Admin/Manager)
- **Request Body**:
  ```typescript
  {
    towns: string[];
    industries: string[];
    config: {
      simultaneousTowns: number;
      simultaneousIndustries: number;
      simultaneousLookups: number;
    }
  }
  ```
- **Response**:
  ```typescript
  {
    sessionId: string;
    status: 'started';
  }
  ```

#### 2. POST /api/scrape/stop/:sessionId
- **Purpose**: Stop an active scraping session
- **Auth**: Required (Admin/Manager)
- **Response**:
  ```typescript
  {
    status: 'stopped';
    businessesCollected: number;
  }
  ```

#### 3. POST /api/scrape/pause/:sessionId
- **Purpose**: Pause an active scraping session
- **Auth**: Required (Admin/Manager)
- **Response**:
  ```typescript
  {
    status: 'paused';
  }
  ```

#### 4. POST /api/scrape/resume/:sessionId
- **Purpose**: Resume a paused scraping session
- **Auth**: Required (Admin/Manager)
- **Response**:
  ```typescript
  {
    status: 'running';
  }
  ```

#### 5. GET /api/scrape/status/:sessionId
- **Purpose**: Server-Sent Events stream for real-time updates
- **Auth**: Required (Admin/Manager)
- **Events**:
  - `progress`: Progress updates
  - `log`: Log entries
  - `complete`: Scraping completed with final data
  - `error`: Error occurred

#### 6. POST /api/export/excel
- **Purpose**: Generate Excel file from businesses data
- **Auth**: Required (Admin/Manager)
- **Request Body**:
  ```typescript
  {
    businesses: Business[];
    filename: string;
    addHyperlinks?: boolean;
  }
  ```
- **Response**: Excel file download

#### 7. POST /api/lookup
- **Purpose**: Lookup phone number details
- **Auth**: Required (Admin/Manager)
- **Request Body**:
  ```typescript
  {
    phoneNumber: string;
  }
  ```

#### 8. POST /api/business-lookup
- **Purpose**: Lookup business details
- **Auth**: Required (Admin/Manager)
- **Request Body**:
  ```typescript
  {
    businessName: string;
    town: string;
  }
  ```

### Session Management

Sessions will be stored in-memory on the server:

```typescript
// sessionStore.ts
interface SessionData {
  orchestrator: ScrapingOrchestrator;
  eventEmitter: EventEmitter;
  createdAt: number;
}

const sessions = new Map<string, SessionData>();

export function setSession(sessionId: string, data: SessionData) {
  sessions.set(sessionId, data);
}

export function getSession(sessionId: string): SessionData | undefined {
  return sessions.get(sessionId);
}

export function deleteSession(sessionId: string) {
  sessions.delete(sessionId);
}
```

## Error Handling

### Client-Side Error Handling

1. **Network Errors**: Display toast notifications for failed API calls
2. **Validation Errors**: Show inline validation messages for invalid inputs
3. **SSE Connection Errors**: Automatically reconnect with exponential backoff
4. **Access Denied**: Redirect to dashboard with error message

### Server-Side Error Handling

1. **Validation Errors**: Return 400 with descriptive error message
2. **Authentication Errors**: Return 401 for unauthenticated requests
3. **Authorization Errors**: Return 403 for insufficient permissions
4. **Scraping Errors**: Emit error events via SSE, log to ErrorLogger
5. **Internal Errors**: Return 500 with generic error message, log details

### Error Logger

The scraper includes an ErrorLogger utility for structured error logging:

```typescript
errorLogger.logError(message, error, context);
errorLogger.logValidationError(field, value, message, context);
errorLogger.logApiError(endpoint, error, context);
```

## Testing Strategy

### Unit Tests

1. **Component Tests**:
   - Test role-based rendering of Dashboard card
   - Test role-based rendering of Navigation item
   - Test scraper page access control redirect
   - Test individual scraper component functionality

2. **Store Tests**:
   - Test scraper store actions
   - Test state updates and persistence
   - Test SSE connection management

3. **Utility Tests**:
   - Test export service functionality
   - Test auto-export hook behavior

### Integration Tests

1. **API Route Tests**:
   - Test authentication middleware
   - Test authorization for admin/manager roles
   - Test scraping session lifecycle (start, pause, resume, stop)
   - Test SSE event streaming
   - Test Excel export generation

2. **End-to-End Tests**:
   - Test complete scraping workflow as admin
   - Test complete scraping workflow as manager
   - Test access denial for regular users
   - Test session save and load functionality
   - Test export functionality

### Manual Testing Checklist

- [ ] Admin can see and access Smart Scraper from Dashboard
- [ ] Manager can see and access Smart Scraper from Dashboard
- [ ] Regular user cannot see Smart Scraper card
- [ ] Admin can see and access Smart Scraper from Navigation
- [ ] Manager can see and access Smart Scraper from Navigation
- [ ] Regular user cannot see Smart Scraper navigation item
- [ ] Regular user redirected when accessing /scraper directly
- [ ] Unauthenticated user redirected to login
- [ ] Scraping starts successfully with valid inputs
- [ ] Real-time progress updates display correctly
- [ ] Logs display in real-time
- [ ] Pause and resume functionality works
- [ ] Stop functionality works
- [ ] Excel export generates correct file
- [ ] Provider export groups businesses correctly
- [ ] Session save and load works
- [ ] Number lookup returns results
- [ ] Business lookup returns results
- [ ] Concurrency controls affect scraping behavior
- [ ] All scraper UI components render correctly (no styling changes needed)
- [ ] Responsive design works on mobile

## Dependencies

### New Dependencies to Add

The following dependencies from smart-scraper need to be added to smart-cost-calculator's package.json:

```json
{
  "dependencies": {
    "@sparticuz/chromium": "^131.0.0",
    "puppeteer-core": "^23.9.0",
    "react-window": "^2.2.1",
    "uuid": "^13.0.0",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@types/react-window": "^1.8.8",
    "@types/uuid": "^10.0.0"
  }
}
```

### Dependency Compatibility

Both apps already share these dependencies with compatible versions:
- `@supabase/supabase-js`: ^2.53.0
- `clsx`: ^2.1.1
- `lucide-react`: ^0.536.0
- `next`: 15.4.5
- `react`: 19.1.0
- `react-dom`: 19.1.0
- `tailwind-merge`: ^3.3.1
- `zustand`: ^5.0.7

No version conflicts expected.

## Security Considerations

1. **Role-Based Access Control**:
   - Enforce role checks on both client and server
   - Never trust client-side role checks alone
   - Validate user role on every API request

2. **Input Validation**:
   - Sanitize town and industry inputs
   - Validate concurrency settings within safe ranges
   - Prevent injection attacks in lookup queries

3. **Rate Limiting**:
   - Consider implementing rate limiting for scraping API
   - Prevent abuse of lookup endpoints
   - Limit concurrent sessions per user

4. **Data Privacy**:
   - Scraped business data should be treated as sensitive
   - Consider implementing data retention policies
   - Ensure compliance with data protection regulations

5. **Browser Automation Security**:
   - Run Puppeteer in sandboxed environment
   - Limit resource usage (memory, CPU)
   - Implement timeouts to prevent hanging processes

## Performance Considerations

1. **Scraping Performance**:
   - Use concurrency controls to balance speed and resource usage
   - Implement retry logic with exponential backoff
   - Clean up browser instances after use

2. **SSE Performance**:
   - Debounce log events to reduce message frequency
   - Limit log history to prevent memory bloat (300 entries)
   - Close SSE connections when component unmounts

3. **UI Performance**:
   - Use react-window for virtualized rendering of large business lists
   - Implement pagination for results table
   - Debounce search and filter operations

4. **Export Performance**:
   - Generate Excel files server-side to avoid blocking UI
   - Stream large exports instead of loading into memory
   - Implement progress indication for large exports

## Migration Steps

1. **Copy Source Files (No Modifications)**:
   - Copy all components from `smart-scraper/src/components/scraper/` to `smart-cost-calculator/src/components/scraper/` (as-is)
   - Copy all components from `smart-scraper/src/components/ui/` that don't exist in main app (e.g., ErrorBoundary)
   - Copy store from `smart-scraper/src/store/scraper.ts` to `smart-cost-calculator/src/store/scraper.ts` (as-is)
   - Copy lib files from `smart-scraper/src/lib/scraper/` to `smart-cost-calculator/src/lib/scraper/` (as-is)
   - Copy lib files from `smart-scraper/src/lib/export/` to `smart-cost-calculator/src/lib/export/` (as-is)
   - Copy utility files from `smart-scraper/src/lib/` (toast.ts, utils.ts) if they don't conflict
   - Copy hooks from `smart-scraper/src/hooks/` to `smart-cost-calculator/src/hooks/` (as-is)
   - Copy API routes from `smart-scraper/src/app/api/scrape/`, `/export/`, `/lookup/`, `/business-lookup/` to corresponding locations in main app

2. **Update Dependencies**:
   - Add new dependencies to package.json (@sparticuz/chromium, puppeteer-core, react-window, uuid, xlsx)
   - Run `npm install`

3. **Copy Scraper Page**:
   - Copy `smart-scraper/src/app/scraper/page.tsx` to `smart-cost-calculator/src/app/scraper/page.tsx`
   - Add role-based access control at the top of the component (redirect logic)

4. **Update Dashboard**:
   - Modify `smart-cost-calculator/src/app/page.tsx`
   - Add Smart Scraper quick action card with role check (admin/manager only)

5. **Update Navigation**:
   - Modify `smart-cost-calculator/src/components/layout/Navigation.tsx`
   - Add Smart Scraper navigation item with role check (admin/manager only)

6. **Add Authentication Middleware**:
   - Create middleware utility for role-based access control
   - Apply to all scraper API routes

7. **Test Integration**:
   - Verify all imports resolve correctly
   - Test role-based access control
   - Test scraping functionality end-to-end
   - Verify UI renders correctly without any styling issues
