# Smart Cost Calculator - Complete Application Documentation

> **A comprehensive Next.js application for calculating and managing smart technology costs with role-based pricing, PDF generation, and real-time data management.**

## 📋 Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Core Features](#core-features)
5. [Database Schema](#database-schema)
6. [State Management](#state-management)
7. [Authentication & Authorization](#authentication--authorization)
8. [Calculation Logic](#calculation-logic)
9. [UI/UX Design System](#uiux-design-system)
10. [Installation & Setup](#installation--setup)
11. [Environment Variables](#environment-variables)
12. [API Routes](#api-routes)
13. [Component Architecture](#component-architecture)
14. [Deployment](#deployment)
15. [Testing Guide](#testing-guide)

---

## Overview

The Smart Cost Calculator is a sophisticated web application designed for calculating costs of smart technology solutions. It features role-based pricing (Admin, Manager, User), dynamic PDF generation, real-time data persistence with Supabase, and a modern glassmorphism UI design.

### Key Capabilities

- **Multi-role Pricing System**: Different pricing tiers for Admin, Manager, and User roles
- **Dynamic Cost Calculation**: Real-time calculations for hardware, connectivity, licensing, and settlement costs
- **PDF Generation**: Professional PDF proposals with detailed breakdowns
- **Deal Management**: Save, load, and analyze deals with comprehensive analytics
- **Admin Configuration**: Full CRUD operations for hardware, connectivity, and licensing items
- **Mobile-First Design**: Responsive layouts with touch-optimized interactions
- **Offline Support**: Local storage fallback for configuration data
- **Real-time Sync**: Supabase integration for cross-device data synchronization

---

## Tech Stack

### Core Framework
- **Next.js 15.4.5** - React framework with App Router
- **React 19.1.0** - UI library
- **TypeScript 5.x** - Type safety

### Styling & UI
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **Custom Design System** - Glassmorphism, animations, gradients
- **Lucide React 0.536.0** - Icon library
- **clsx & tailwind-merge** - Conditional styling utilities

### State Management
- **Zustand 5.0.7** - Lightweight state management
  - `authStore` - Authentication state
  - `calculatorStore` - Calculator data and logic
  - `configStore` - Configuration data (hardware, connectivity, licensing)
  - `offlineStore` - Offline data persistence

### Database & Backend
- **Supabase 2.53.0** - PostgreSQL database, authentication, real-time subscriptions
- **PDF-lib 1.17.1** - PDF generation and manipulation

### Development Tools
- **ESLint** - Code linting
- **Bundle Analyzer** - Performance optimization
- **Autoprefixer** - CSS vendor prefixing

---

## Project Structure

```
smart-cost-calculator/
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── page.tsx                  # Dashboard/Home page
│   │   ├── layout.tsx                # Root layout with navigation
│   │   ├── globals.css               # Global styles
│   │   ├── admin/                    # Admin panel
│   │   │   ├── page.tsx              # Admin dashboard with tabs
│   │   │   └── deals/                # All deals analysis
│   │   │       └── page.tsx          # Deals analytics page
│   │   ├── calculator/               # Calculator page
│   │   │   └── page.tsx              # Multi-step calculator
│   │   ├── login/                    # Authentication
│   │   │   └── page.tsx              # Login page
│   │   ├── my-deals/                 # User's saved deals
│   │   │   └── page.tsx              # Deals list
│   │   └── api/                      # API routes
│   │       └── generate-pdf/         # PDF generation endpoint
│   │           └── route.ts
│   ├── components/                   # React components
│   │   ├── admin/                    # Admin components
│   │   │   ├── HardwareConfig.tsx    # Hardware CRUD
│   │   │   ├── ConnectivityConfig.tsx # Connectivity CRUD
│   │   │   ├── LicensingConfig.tsx   # Licensing CRUD
│   │   │   ├── FactorSheetConfig.tsx # Factor sheet management
│   │   │   ├── ScalesConfig.tsx      # Scales configuration
│   │   │   └── UserManagement.tsx    # User management
│   │   ├── calculator/               # Calculator components
│   │   │   ├── DealDetailsSection.tsx # Deal info form
│   │   │   ├── HardwareSection.tsx   # Hardware selection
│   │   │   ├── ConnectivitySection.tsx # Connectivity selection
│   │   │   ├── LicensingSection.tsx  # Licensing selection
│   │   │   ├── SettlementSection.tsx # Settlement calculation
│   │   │   └── TotalCostsSection.tsx # Final summary
│   │   ├── layout/                   # Layout components
│   │   │   ├── Navigation.tsx        # Main navigation
│   │   │   └── Footer.tsx            # Footer
│   │   ├── ui/                       # UI components
│   │   │   ├── Button.tsx            # Button component
│   │   │   ├── Card.tsx              # Card component
│   │   │   ├── Input.tsx             # Input component
│   │   │   ├── Select.tsx            # Select component
│   │   │   ├── Breadcrumb.tsx        # Breadcrumb navigation
│   │   │   └── modern/               # Modern UI components
│   │   │       └── GlassCard.tsx     # Glassmorphism card
│   │   ├── pdf/                      # PDF components
│   │   │   └── PDFGenerator.tsx      # PDF generation logic
│   │   └── auth/                     # Auth components
│   │       └── ProtectedRoute.tsx    # Route protection
│   ├── lib/                          # Utility libraries
│   │   ├── supabase.ts               # Supabase client
│   │   ├── types.ts                  # TypeScript types
│   │   ├── utils.ts                  # Utility functions
│   │   ├── validation.ts             # Form validation
│   │   ├── toast.ts                  # Toast notifications
│   │   └── accessibility.ts          # A11y utilities
│   └── store/                        # Zustand stores
│       ├── auth.ts                   # Authentication store
│       ├── calculator.ts             # Calculator store
│       ├── config.ts                 # Configuration store
│       └── offline.ts                # Offline storage
├── public/                           # Static assets
│   ├── config/                       # JSON configuration files
│   │   ├── hardware.json             # Hardware items
│   │   ├── connectivity.json         # Connectivity options
│   │   ├── licensing.json            # Licensing options
│   │   ├── factors.json              # Factor sheet
│   │   ├── scales.json               # Pricing scales
│   │   └── deals.json                # Saved deals
│   └── Proposal.pdf                  # Sample PDF
├── .kiro/                            # Kiro IDE specs
│   └── specs/                        # Feature specifications
│       ├── admin-store-mobile-layout/
│       ├── calculator-navigation-improvements/
│       └── app-optimization-cleanup/
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript config
├── tailwind.config.ts                # Tailwind config
├── next.config.js                    # Next.js config
├── .env.local                        # Environment variables
├── supabase-schema.sql               # Database schema
└── README.md                         # This file
```

---

## Core Features

### 1. Multi-Step Calculator

**Location**: `src/app/calculator/page.tsx`

A 6-step wizard for creating cost calculations:

1. **Deal Details** - Customer info, contract terms, location
2. **Hardware** - Select devices with quantities
3. **Connectivity** - Choose connectivity options
4. **Licensing** - Select licensing packages
5. **Settlement** - Calculate installation and settlement costs
6. **Total Costs** - View final breakdown and generate PDF

**Key Features**:
- Tab-based navigation with progress tracking
- Keyboard shortcuts (Arrow keys, 1-6 for direct navigation)
- Form validation at each step
- Auto-save to local storage
- Real-time cost calculations
- Mobile-responsive card layouts

### 2. Role-Based Pricing

**Implementation**: `src/store/calculator.ts`

Three pricing tiers:
- **Admin**: Cost price (base pricing)
- **Manager**: Cost price + manager markup (typically 25%)
- **User**: Cost price + user markup (typically 50%)

```typescript
// Pricing logic
const getItemCost = (item: Item, userRole: string) => {
  if (userRole === 'admin') return item.cost;
  if (userRole === 'manager') return item.managerCost || item.cost;
  return item.userCost || item.cost;
};
```

### 3. Cost Calculation Engine

**Location**: `src/store/calculator.ts`

#### Hardware Costs
```typescript
hardwareCost = Σ(item.cost × item.quantity)
```

#### Connectivity Costs (Monthly)
```typescript
connectivityCost = Σ(option.cost × option.quantity)
```

#### Licensing Costs (Monthly)
```typescript
licensingCost = Σ(license.cost × license.quantity)
```

#### Installation Costs
```typescript
// Sliding scale based on number of points
baseInstallation = points × costPerPoint

// Extension costs
extensionCost = extensionPoints × extensionCostPerPoint

// Fuel costs
fuelCost = distance × costPerKm

totalInstallation = baseInstallation + extensionCost + fuelCost
```

#### Settlement Calculation
```typescript
// Representative calculation
repSettlement = (hardwareCost + installationCost) × (1 + escalation/100)^(term/12)

// Actual calculation (with monthly costs)
monthlyRecurring = connectivityCost + licensingCost
actualSettlement = repSettlement + (monthlyRecurring × term)
```

#### Finance Fee
```typescript
financeFee = actualSettlement × financePercentage / 100
```

#### Gross Profit
```typescript
GP = actualSettlement - (hardwareCost + installationCost + (monthlyRecurring × term) + financeFee)
GPPercentage = (GP / actualSettlement) × 100
```

### 4. PDF Generation

**Location**: `src/app/api/generate-pdf/route.ts`

Generates professional PDF proposals with:
- Company branding
- Deal details
- Itemized hardware breakdown
- Monthly costs breakdown
- Installation costs breakdown
- Settlement calculations
- Total costs summary
- Terms and conditions

**Technology**: pdf-lib for PDF creation

### 5. Admin Configuration Panel

**Location**: `src/app/admin/page.tsx`

Tabbed interface for managing:

#### Hardware Configuration
- Add/Edit/Delete hardware items
- Set cost price, manager cost, user cost
- Mark items as extensions
- Lock items from calculator
- Reorder items
- Bulk markup application

#### Connectivity Configuration
- Manage connectivity options
- Set pricing tiers
- Lock/unlock options

#### Licensing Configuration
- Manage licensing packages
- Set pricing tiers
- Lock/unlock packages

#### Factor Sheet
- Configure calculation factors
- Set escalation rates
- Define finance percentages

#### Scales Configuration
- Installation cost per point
- Extension cost per point
- Fuel cost per kilometer
- Sliding scale pricing

#### User Management
- Create/Edit/Delete users
- Assign roles (Admin, Manager, User)
- Reset passwords

### 6. Deal Management

**Location**: `src/app/my-deals/page.tsx`, `src/app/admin/deals/page.tsx`

- Save deals to Supabase
- Load existing deals
- View deal history
- Admin analytics dashboard
- Deal comparison
- Export to PDF

### 7. Mobile-Optimized UI

**Implementation**: Responsive dual-layout system

**Desktop** (≥768px):
- Table layouts for data
- Full navigation
- Sidebar layouts

**Mobile** (<768px):
- Card-based layouts
- Touch-optimized buttons (44px minimum)
- No horizontal scrolling
- Swipe-free navigation
- Compact forms

**Key Components**:
- `HardwareSection.tsx` - Dual layout (table/cards)
- `ConnectivitySection.tsx` - Dual layout
- `LicensingSection.tsx` - Dual layout
- Admin config components - Dual layout

---

## Database Schema

**File**: `supabase-schema.sql`

### Tables

#### `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'user')),
  full_name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `hardware`
```sql
CREATE TABLE hardware (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  manager_cost DECIMAL(10,2),
  user_cost DECIMAL(10,2),
  is_extension BOOLEAN DEFAULT FALSE,
  locked BOOLEAN DEFAULT FALSE,
  display_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `connectivity`
```sql
CREATE TABLE connectivity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  manager_cost DECIMAL(10,2),
  user_cost DECIMAL(10,2),
  locked BOOLEAN DEFAULT FALSE,
  display_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `licensing`
```sql
CREATE TABLE licensing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  manager_cost DECIMAL(10,2),
  user_cost DECIMAL(10,2),
  locked BOOLEAN DEFAULT FALSE,
  display_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `deals`
```sql
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  deal_name TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  deal_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `factor_sheet`
```sql
CREATE TABLE factor_sheet (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value DECIMAL(10,4) NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `scales`
```sql
CREATE TABLE scales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,
  config JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## State Management

### Auth Store (`src/store/auth.ts`)

```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => boolean;
}
```

### Calculator Store (`src/store/calculator.ts`)

```typescript
interface CalculatorState {
  // Deal Details
  dealDetails: {
    customerName: string;
    dealName: string;
    term: number;
    escalation: number;
    distance: number;
    settlement: number;
  };
  
  // Selected Items
  hardware: Item[];
  connectivity: Item[];
  licensing: Item[];
  
  // Calculations
  hardwareCost: number;
  connectivityCost: number;
  licensingCost: number;
  installationCost: number;
  settlementAmount: number;
  financeFee: number;
  grossProfit: number;
  
  // Actions
  updateDealDetails: (details: Partial<DealDetails>) => void;
  addHardwareItem: (item: Item) => void;
  updateHardwareQuantity: (id: string, quantity: number) => void;
  calculateTotals: () => void;
  saveDeal: () => Promise<void>;
  loadDeal: (id: string) => Promise<void>;
  resetDeal: () => void;
}
```

### Config Store (`src/store/config.ts`)

```typescript
interface ConfigState {
  hardware: Item[];
  connectivity: Item[];
  licensing: Item[];
  factors: FactorSheet;
  scales: Scales;
  
  // Actions
  fetchConfig: () => Promise<void>;
  updateHardware: (items: Item[]) => Promise<void>;
  updateConnectivity: (items: Item[]) => Promise<void>;
  updateLicensing: (items: Item[]) => Promise<void>;
}
```

---

## Authentication & Authorization

### Login Flow

1. User enters credentials on `/login`
2. `authStore.login()` validates against Supabase
3. User object stored in Zustand + localStorage
4. Redirect to dashboard
5. Protected routes check `isAuthenticated`

### Role-Based Access

```typescript
// Admin-only routes
if (user?.role !== 'admin') {
  router.push('/');
}

// Pricing based on role
const cost = user?.role === 'admin' ? item.cost :
             user?.role === 'manager' ? item.managerCost :
             item.userCost;
```

---

## Calculation Logic

### Installation Cost Breakdown

```typescript
// Base installation (sliding scale)
const baseRate = getSlid ingScaleRate(totalPoints);
const baseInstallation = totalPoints × baseRate;

// Extension costs
const extensionPoints = hardware.filter(h => h.isExtension)
  .reduce((sum, h) => sum + h.quantity, 0);
const extensionCost = extensionPoints × scales.extensionCostPerPoint;

// Fuel costs
const fuelCost = distance × scales.costPerKm;

// Total
const totalInstallation = baseInstallation + extensionCost + fuelCost;
```

### Settlement Calculation

```typescript
// Representative calculation (hardware + installation with escalation)
const repSettlement = (hardwareCost + installationCost) × 
  Math.pow(1 + escalation/100, term/12);

// Actual calculation (add monthly recurring costs)
const monthlyRecurring = connectivityCost + licensingCost;
const actualSettlement = repSettlement + (monthlyRecurring × term);
```

### Gross Profit Calculation

```typescript
// Total costs
const totalCosts = hardwareCost + installationCost + 
  (monthlyRecurring × term) + financeFee;

// Gross profit
const GP = actualSettlement - totalCosts;
const GPPercentage = (GP / actualSettlement) × 100;
```

---

## UI/UX Design System

### Color Palette

```typescript
// Primary Colors
primary: {
  50: '#eff6ff',
  500: '#3b82f6',
  900: '#1e3a8a',
}

// Neon Accents
neon: {
  blue: '#00f0ff',
  purple: '#bf00ff',
  pink: '#ff006e',
}

// Glass Effects
glass: {
  light: 'rgba(255, 255, 255, 0.1)',
  medium: 'rgba(255, 255, 255, 0.2)',
}
```

### Animations

- `fade-in` - Fade in effect
- `slide-up` - Slide up animation
- `bounce-gentle` - Gentle bounce
- `pulse-glow` - Glowing pulse
- `blob` - Blob animation for backgrounds
- `shimmer` - Shimmer effect
- `float` - Floating animation

### Glassmorphism

```css
.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
```

### Typography

- **Sans**: Inter, system-ui
- **Mono**: JetBrains Mono, Fira Code

### Responsive Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: ≥ 1024px

---

## Installation & Setup

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Supabase account
- Git

### Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/smart-cost-calculator.git
cd smart-cost-calculator
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up Supabase

1. Create a Supabase project at https://supabase.com
2. Run the SQL schema from `supabase-schema.sql` in the SQL editor
3. Copy your project URL and anon key

### Step 4: Configure Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 5: Seed Initial Data

```bash
# The app will automatically load from public/config/*.json files
# Or manually insert data via Supabase dashboard
```

### Step 6: Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

### Step 7: Create Admin User

```sql
-- Run in Supabase SQL editor
INSERT INTO users (email, password_hash, role, full_name)
VALUES ('admin@example.com', 'hashed_password', 'admin', 'Admin User');
```

---

## Environment Variables

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: Analytics
NEXT_PUBLIC_GA_ID=your_google_analytics_id

# Optional: Feature Flags
NEXT_PUBLIC_ENABLE_OFFLINE=true
NEXT_PUBLIC_ENABLE_PDF_GENERATION=true
```

---

## API Routes

### POST `/api/generate-pdf`

Generate PDF proposal from deal data.

**Request Body**:
```json
{
  "dealDetails": { ... },
  "hardware": [ ... ],
  "connectivity": [ ... ],
  "licensing": [ ... ],
  "calculations": { ... }
}
```

**Response**:
```json
{
  "success": true,
  "pdfUrl": "blob:..."
}
```

---

## Component Architecture

### Calculator Components

#### DealDetailsSection
- Customer name input
- Deal name input
- Contract term selector
- Escalation percentage
- Distance input
- Validation logic

#### HardwareSection
- Item selection with quantities
- Real-time cost calculation
- Extension marking
- Mobile card layout
- Desktop table layout

#### ConnectivitySection
- Monthly connectivity options
- Quantity selection
- Cost calculation
- Dual layout (desktop/mobile)

#### LicensingSection
- License package selection
- Quantity management
- Monthly cost calculation
- Dual layout

#### SettlementSection
- Installation cost breakdown
- Settlement calculation
- Rep vs Actual comparison
- Finance fee calculation

#### TotalCostsSection
- Final cost summary
- Gross profit display
- PDF generation button
- Save deal functionality

### Admin Components

#### HardwareConfig
- CRUD operations for hardware
- Markup percentage controls
- Reordering functionality
- Batch save with change tracking
- Mobile card layout

#### ConnectivityConfig
- CRUD for connectivity options
- Pricing tier management
- Mobile-responsive

#### LicensingConfig
- CRUD for licensing packages
- Pricing management
- Mobile-responsive

---

## Deployment

### Vercel Deployment (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

```bash
npm run deploy
```

### Manual Deployment

```bash
npm run build
npm run start
```

### Environment Setup

Ensure all environment variables are set in your deployment platform.

---

## Testing Guide

### Manual Testing Checklist

#### Calculator Flow
- [ ] Create new deal
- [ ] Fill deal details
- [ ] Select hardware items
- [ ] Select connectivity
- [ ] Select licensing
- [ ] Calculate settlement
- [ ] View total costs
- [ ] Generate PDF
- [ ] Save deal

#### Admin Panel
- [ ] Add hardware item
- [ ] Edit hardware item
- [ ] Delete hardware item
- [ ] Apply markup to all
- [ ] Reorder items
- [ ] Save changes
- [ ] Test on mobile

#### Authentication
- [ ] Login as admin
- [ ] Login as manager
- [ ] Login as user
- [ ] Verify role-based pricing
- [ ] Logout

#### Mobile Testing
- [ ] Test on iPhone
- [ ] Test on Android
- [ ] Verify no horizontal scrolling
- [ ] Test touch targets
- [ ] Test card layouts

---

## Key Files Reference

### Core Application Files

- `src/app/page.tsx` - Dashboard
- `src/app/calculator/page.tsx` - Calculator
- `src/app/admin/page.tsx` - Admin panel
- `src/store/calculator.ts` - Calculator logic
- `src/store/config.ts` - Configuration management
- `src/lib/supabase.ts` - Database client

### Configuration Files

- `package.json` - Dependencies
- `tsconfig.json` - TypeScript config
- `tailwind.config.ts` - Styling config
- `next.config.js` - Next.js config
- `.env.local` - Environment variables

### Documentation Files

- `README.md` - This file
- `MOBILE_UX_FIX.md` - Mobile UX improvements
- `ADMIN_MOBILE_UX_FIX.md` - Admin mobile improvements
- `supabase-schema.sql` - Database schema

---

## Support & Maintenance

### Common Issues

**Issue**: Supabase connection fails
**Solution**: Check environment variables and Supabase project status

**Issue**: PDF generation fails
**Solution**: Verify pdf-lib is installed and API route is accessible

**Issue**: Mobile layout issues
**Solution**: Clear cache, verify Tailwind breakpoints

### Performance Optimization

- Use Next.js Image component for images
- Implement code splitting with dynamic imports
- Enable bundle analyzer: `npm run analyze`
- Optimize Supabase queries with indexes
- Use React.memo for expensive components

---

## License

Private - All Rights Reserved

---

## Credits

Built with Next.js, React, Tailwind CSS, Supabase, and pdf-lib.

---

**Last Updated**: January 2025
**Version**: 0.1.0
**Author**: Smart Cost Calculator Team
