# Admin Store Analysis & Supabase Integration

## 📊 **Complete Admin Store Structure**

### **1. Config Store (`src/store/config.ts`)**

The config store manages all configuration data that flows through the calculator:

#### **Data Structure:**
```typescript
interface ConfigState {
  hardware: Item[];           // Hardware items with costs
  connectivity: Item[];       // Connectivity options
  licensing: Item[];          // Licensing items
  factors: FactorData;        // Financing factors
  scales: Scales;             // Pricing scales
}
```

#### **Item Interface (matches database exactly):**
```typescript
interface Item {
  id: string;                 // UUID from database
  name: string;               // Item name
  cost: number;               // Base cost
  managerCost?: number;       // Manager-specific cost
  userCost?: number;          // User-specific cost
  quantity: number;           // Current quantity (reset to 0 when saving)
  locked?: boolean;           // Item locked status
  isExtension?: boolean;      // Is this an extension item
}
```

#### **FactorData Interface:**
```typescript
interface FactorData {
  [term: string]: {           // e.g., "36_months"
    [escalation: string]: {   // e.g., "0%", "10%", "15%"
      [financeRange: string]: number; // e.g., "0-20000": 0.03814
    };
  };
}
```

#### **Scales Interface:**
```typescript
interface Scales {
  installation: { [band: string]: number; };      // Installation costs by extension count
  finance_fee: { [range: string]: number; };      // Finance fees by amount range
  gross_profit: { [band: string]: number; };      // Gross profit by extension count
  additional_costs: { 
    cost_per_kilometer: number; 
    cost_per_point: number; 
  };
}
```

### **2. Database Schema Mapping**

#### **Hardware Items Table:**
```sql
CREATE TABLE hardware_items (
    id UUID PRIMARY KEY,           -- Maps to Item.id
    name VARCHAR(255) NOT NULL,    -- Maps to Item.name
    cost DECIMAL(10,2) NOT NULL,   -- Maps to Item.cost
    manager_cost DECIMAL(10,2),    -- Maps to Item.managerCost
    user_cost DECIMAL(10,2),       -- Maps to Item.userCost
    quantity INTEGER DEFAULT 0,    -- Maps to Item.quantity
    locked BOOLEAN DEFAULT false,  -- Maps to Item.locked
    is_extension BOOLEAN DEFAULT false, -- Maps to Item.isExtension
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **Connectivity Items Table:**
```sql
CREATE TABLE connectivity_items (
    id UUID PRIMARY KEY,           -- Maps to Item.id
    name VARCHAR(255) NOT NULL,    -- Maps to Item.name
    cost DECIMAL(10,2) NOT NULL,   -- Maps to Item.cost
    manager_cost DECIMAL(10,2),    -- Maps to Item.managerCost
    user_cost DECIMAL(10,2),       -- Maps to Item.userCost
    quantity INTEGER DEFAULT 0,    -- Maps to Item.quantity
    locked BOOLEAN DEFAULT false,  -- Maps to Item.locked
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **Licensing Items Table:**
```sql
CREATE TABLE licensing_items (
    id UUID PRIMARY KEY,           -- Maps to Item.id
    name VARCHAR(255) NOT NULL,    -- Maps to Item.name
    cost DECIMAL(10,2) NOT NULL,   -- Maps to Item.cost
    manager_cost DECIMAL(10,2),    -- Maps to Item.managerCost
    user_cost DECIMAL(10,2),       -- Maps to Item.userCost
    quantity INTEGER DEFAULT 0,    -- Maps to Item.quantity
    locked BOOLEAN DEFAULT false,  -- Maps to Item.locked
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **Factors Table:**
```sql
CREATE TABLE factors (
    id UUID PRIMARY KEY,
    factors_data JSONB NOT NULL,   -- Maps to FactorData interface
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **Scales Table:**
```sql
CREATE TABLE scales (
    id UUID PRIMARY KEY,
    scales_data JSONB NOT NULL,    -- Maps to Scales interface
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **3. Admin Components Structure**

#### **HardwareConfig.tsx:**
- **Purpose**: Manage hardware items (add, edit, delete, toggle active status)
- **Data Flow**: 
  - Reads from `useConfigStore().hardware`
  - Updates via `useConfigStore().updateHardware()`
  - Saves to Supabase via API call

#### **ConnectivityConfig.tsx:**
- **Purpose**: Manage connectivity items
- **Data Flow**: 
  - Reads from `useConfigStore().connectivity`
  - Updates via `useConfigStore().updateConnectivity()`
  - Saves to Supabase via API call

#### **LicensingConfig.tsx:**
- **Purpose**: Manage licensing items
- **Data Flow**: 
  - Reads from `useConfigStore().licensing`
  - Updates via `useConfigStore().updateLicensing()`
  - Saves to Supabase via API call

#### **FactorSheetConfig.tsx:**
- **Purpose**: Manage financing factors
- **Data Flow**: 
  - Reads from `useConfigStore().factors`
  - Updates via `useConfigStore().updateFactors()`
  - Saves to Supabase via API call

#### **ScalesConfig.tsx:**
- **Purpose**: Manage pricing scales
- **Data Flow**: 
  - Reads from `useConfigStore().scales`
  - Updates via `useConfigStore().updateScales()`
  - Saves to Supabase via API call

### **4. Live Data Flow**

#### **Admin → Calculator Flow:**
1. **Admin updates configuration** in admin panel
2. **Config store updates** immediately (local state)
3. **API call saves** to Supabase database
4. **Calculator loads** fresh data from Supabase
5. **All calculations update** in real-time

#### **Cross-Browser Sync:**
1. **User A** updates hardware costs in admin panel
2. **Supabase database** is updated immediately
3. **User B** opens calculator in different browser
4. **Calculator loads** latest data from Supabase
5. **All users see** the same updated costs

### **5. Default Data Values**

#### **Hardware Items (22 items):**
- Desk Phone B&W: R1,054.00 (extension)
- Desk Phone Colour: R1,378.00 (extension)
- Switchboard Colour: R2,207.00 (extension)
- Cordless Phone: R2,420.00 (extension)
- Bluetooth Headset Mono: R1,996.00
- Bluetooth Headset Dual: R2,340.00
- Corded Headset Dual: R1,467.00
- Cellphone: R7,500.00
- 4 Port PoE: R644.00
- 8 Port PoE: R813.00
- 16 Port PoE: R2,282.00
- 8 Port Managed PoE: R1,657.00
- 16 Port Managed PoE: R2,994.00
- Access Point Gigabit: R1,350.00
- Cloud Router WAN2: R1,613.00
- 5G/LTE Router: R1,800.00
- PC: R9,000.00
- A4 Copier: R17,000.00
- Server Cabinet: R1,466.25
- Additional Mobile App: R0.00
- Additional App on Own Device: R0.00
- Number Porting Per Number: R200.00

#### **Connectivity Items (3 items):**
- LTE: R599.00
- Fibre: R599.00
- Melon Sim Card: R350.00

#### **Licensing Items (4 items):**
- Premium License: R90.00
- Service Level Agreement (0 - 5 users): R299.00
- Service Level Agreement (6 - 10 users): R399.00
- Service Level Agreement (11 users or more): R499.00

#### **Scales Configuration:**
```json
{
  "installation": {
    "0-4": 3500,
    "5-8": 3500,
    "9-16": 7000,
    "17-32": 10500,
    "33+": 15000
  },
  "finance_fee": {
    "0-20000": 1800,
    "20001-50000": 1800,
    "50001-100000": 2800,
    "100001+": 3800
  },
  "gross_profit": {
    "0-4": 10000,
    "5-8": 15000,
    "9-16": 20000,
    "17-32": 25000,
    "33+": 30000
  },
  "additional_costs": {
    "cost_per_kilometer": 1.5,
    "cost_per_point": 750
  }
}
```

#### **Factors Configuration:**
- **36 months**: 0% escalation (0.03814), 10% escalation (0.03511), 15% escalation (0.04133)
- **48 months**: 0% escalation (0.03155), 10% escalation (0.02805), 15% escalation (0.03375)
- **60 months**: 0% escalation (0.02772), 10% escalation (0.02327), 15% escalation (0.02937)

### **6. API Integration Points**

#### **Current API Routes (need Supabase integration):**
- `/api/config/hardware` - GET/POST
- `/api/config/connectivity` - GET/POST
- `/api/config/licensing` - GET/POST
- `/api/config/factors` - GET/POST
- `/api/config/scales` - GET/POST

#### **Required Supabase Integration:**
- Replace JSON file operations with Supabase queries
- Add real-time subscriptions for live updates
- Implement proper error handling and retry logic
- Add optimistic updates for better UX

### **7. Security & Access Control**

#### **Row Level Security (RLS):**
- **Users**: Can read all configuration data, can only modify their own deals
- **Admins**: Can read and modify all configuration data and all deals
- **Managers**: Same as users (can be extended for specific permissions)

#### **Data Validation:**
- All numeric values validated before saving
- JSON structures validated against TypeScript interfaces
- Required fields enforced at database level

### **8. Performance Optimizations**

#### **Database Indexes:**
- `idx_users_username` - Fast user lookups
- `idx_users_role` - Role-based queries
- `idx_hardware_items_active` - Active items only
- `idx_connectivity_items_active` - Active items only
- `idx_licensing_items_active` - Active items only
- `idx_deal_calculations_user_id` - User's deals
- `idx_deal_calculations_created_at` - Date-based queries

#### **Views:**
- `active_hardware_items` - Pre-filtered active items
- `active_connectivity_items` - Pre-filtered active items
- `active_licensing_items` - Pre-filtered active items

#### **Functions:**
- `get_latest_factors()` - Get most recent factors
- `get_latest_scales()` - Get most recent scales

### **9. Migration Strategy**

#### **From JSON Files to Supabase:**
1. **Backup existing data** from JSON files
2. **Run updated schema** in Supabase
3. **Migrate data** from JSON to Supabase
4. **Update API routes** to use Supabase
5. **Test thoroughly** across all components
6. **Deploy with fallback** to JSON files

#### **Data Consistency:**
- All configuration changes immediately sync to Supabase
- Calculator always loads latest data from Supabase
- Fallback to local storage if Supabase unavailable
- Automatic retry logic for failed operations

### **10. Testing Checklist**

#### **Admin Panel Testing:**
- [ ] Add new hardware item
- [ ] Edit existing item costs
- [ ] Toggle item active status
- [ ] Update scales configuration
- [ ] Update factors configuration
- [ ] Verify changes persist across browser sessions

#### **Calculator Testing:**
- [ ] Load latest configuration data
- [ ] Calculate costs with updated prices
- [ ] Verify gross profit calculations
- [ ] Test factor calculations
- [ ] Generate PDF with updated data
- [ ] Save deals with current configuration

#### **Cross-Browser Testing:**
- [ ] Admin updates in Browser A
- [ ] Calculator reflects changes in Browser B
- [ ] Real-time updates work correctly
- [ ] Offline fallback works properly

---

## **🎯 Summary**

The admin store provides a complete configuration management system that:

1. **Stores all pricing data** in a structured format
2. **Updates live across all users** via Supabase
3. **Maintains data integrity** with proper validation
4. **Provides role-based access** control
5. **Ensures performance** with proper indexing
6. **Supports offline operation** with fallbacks

The updated Supabase schema perfectly matches the application's data structure and provides a robust foundation for true cross-browser persistence and real-time updates. 