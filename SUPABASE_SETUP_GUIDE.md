# Supabase Setup Guide

## 🚀 **Step-by-Step Setup Instructions**

### **1. Environment Variables Setup**

Create a `.env.local` file in your project root with the following content:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://gcggzmzlegxldvupufmu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZ2d6bXpsZWd4bGR2dXB1Zm11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzOTg3ODUsImV4cCI6MjA2OTk3NDc4NX0.zyno00F93Nds-JboCye4ZOZUhWjHX3SU6IeqZzB_HgU

# Service Role Key (for server-side operations only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZ2d6bXpsZWd4bGR2dXB1Zm11Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDM5ODc4NSwiZXhwIjoyMDY5OTc0Nzg1fQ.kqW4NcmGNyga78TCAFUiZ4TU7l55O0RTcfJ4rrUl1eU
```

### **2. Database Schema Setup**

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard/project/gcggzmzlegxldvupufmu
2. **Navigate to SQL Editor**
3. **Copy and paste the entire contents** of `supabase-schema.sql` into the SQL editor
4. **Click "Run"** to execute the schema

### **3. Verify Setup**

After running the SQL, you should see:
- ✅ **7 tables created**: users, hardware_items, connectivity_items, licensing_items, factors, scales, deal_calculations
- ✅ **22 hardware items** inserted with exact data from your JSON files
- ✅ **3 connectivity items** inserted
- ✅ **4 licensing items** inserted
- ✅ **1 factors record** inserted with exact data
- ✅ **1 scales record** inserted with exact data
- ✅ **1 admin user** created (username: admin, password: admin123)
- ✅ **All indexes, views, and functions** created
- ✅ **Row Level Security** enabled with proper policies

### **4. Test the Integration**

1. **Restart your development server**:
   ```bash
   npm run dev
   ```

2. **Test admin panel**:
   - Go to `/admin`
   - Login with username: `admin`, password: `admin123`
   - Try updating hardware costs
   - Verify changes are saved to Supabase

3. **Test calculator**:
   - Go to `/calculator`
   - Verify data loads from Supabase
   - Check that calculations use the latest data

### **5. Database Structure Overview**

#### **Tables Created:**

| Table | Purpose | Records |
|-------|---------|---------|
| `users` | User authentication | 1 (admin user) |
| `hardware_items` | Hardware configuration | 22 items |
| `connectivity_items` | Connectivity options | 3 items |
| `licensing_items` | Licensing options | 4 items |
| `factors` | Financing factors | 1 record |
| `scales` | Pricing scales | 1 record |
| `deal_calculations` | Stored deals | 0 (empty) |

#### **Key Features:**
- ✅ **Exact data matching** your JSON files
- ✅ **String IDs** preserved (hw1, hw2, conn1, etc.)
- ✅ **All costs** including manager_cost and user_cost
- ✅ **Extension flags** for hardware items
- ✅ **Locked status** for items
- ✅ **Active/inactive** status for soft deletes
- ✅ **Row Level Security** for data protection
- ✅ **Performance indexes** for fast queries
- ✅ **Helper functions** for easy data access

### **6. Admin User Details**

- **Username**: `admin`
- **Password**: `admin123`
- **Role**: `admin`
- **Permissions**: Full access to all configuration and deals

### **7. Data Flow**

```
Admin Panel → Config Store → API → Supabase → Calculator → Real-time Updates
```

### **8. Troubleshooting**

#### **If you get connection errors:**
1. Verify environment variables are set correctly
2. Check that `.env.local` is in the project root
3. Restart the development server after setting environment variables

#### **If data doesn't load:**
1. Check browser console for errors
2. Verify Supabase tables were created successfully
3. Check that RLS policies are working correctly

#### **If admin login fails:**
1. Verify the admin user was created in the database
2. Check that the password hash is correct
3. Try creating a new admin user manually

### **9. Next Steps**

After successful setup:

1. **Test all admin functions**:
   - Hardware configuration
   - Connectivity configuration
   - Licensing configuration
   - Factor sheet configuration
   - Scales configuration

2. **Test calculator functions**:
   - Data loading
   - Calculations
   - Deal saving
   - PDF generation

3. **Test cross-browser sync**:
   - Update data in one browser
   - Verify changes appear in another browser

### **10. Production Deployment**

When deploying to production:

1. **Set environment variables** in your hosting platform
2. **Update admin password** for security
3. **Configure proper CORS** settings in Supabase
4. **Set up monitoring** for database usage
5. **Configure backups** if needed

---

## 🎉 **Success!**

Your Smart Cost Calculator is now fully integrated with Supabase! All configuration changes will be saved to the cloud and synchronized across all users in real-time. 