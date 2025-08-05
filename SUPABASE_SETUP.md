# Supabase Setup Guide

## 🗄️ **Database Setup**

### 1. **Create Supabase Project**
1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `smart-cost-calculator`
   - **Database Password**: Choose a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"

### 2. **Get Your Credentials**
1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://your-project.supabase.co`)
   - **Anon Public Key** (starts with `eyJ...`)

### 3. **Create Environment File**
Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 4. **Run Database Schema**
1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the entire content from `supabase-schema.sql`
3. Paste and run the SQL script
4. Verify all tables are created successfully

### 5. **Hash Admin Password**
You need to hash the admin password `Elliot6242!` using bcrypt. You can use an online bcrypt generator or run this in your terminal:

```bash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('Elliot6242!', 10));"
```

Then update the SQL script with the hashed password and run it again.

## 🔧 **Application Changes**

### **What's Been Updated:**

1. **✅ Removed Additional Gross Profit** from Deal Details tab
2. **✅ Added Editable Total Gross Profit** on Total Costs page
3. **✅ Updated PDF Generation** to reflect new structure
4. **✅ Enhanced Database Schema** with proper relationships
5. **✅ Added Supabase Integration** for true cross-browser persistence

### **Key Features:**

- **🔐 True Cross-Browser Persistence**: All data now stored in Supabase database
- **👥 User Management**: Secure user authentication and role-based access
- **📊 Deal Calculations**: Persistent deal storage with user isolation
- **⚙️ Admin Configuration**: Hardware, connectivity, licensing, factors, and scales
- **📄 PDF Generation**: Updated to show only Total Gross Profit (editable)

## 🚀 **Deployment Steps**

### **1. Update Environment Variables**
Add your Supabase credentials to Vercel:
- Go to your Vercel project settings
- Add environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### **2. Deploy to Vercel**
```bash
git add .
git commit -m "Add Supabase integration and update gross profit structure"
git push origin main
```

### **3. Verify Setup**
1. **Login**: Use admin credentials (Camryn / Elliot6242!)
2. **Test Configuration**: Update hardware, connectivity, licensing prices
3. **Test Calculator**: Create a deal and verify Total Gross Profit is editable
4. **Test PDF**: Generate PDF and verify structure
5. **Test Persistence**: Open in different browser/device and verify data syncs

## 🔄 **Migration from localStorage**

The app will automatically migrate from localStorage to Supabase:
- Existing deals will remain in localStorage for backward compatibility
- New deals will be saved to Supabase
- Configuration changes will be saved to Supabase immediately

## 🛠️ **Troubleshooting**

### **Common Issues:**

1. **"Cannot connect to Supabase"**
   - Check environment variables are set correctly
   - Verify Supabase project is active
   - Check network connectivity

2. **"Authentication failed"**
   - Verify admin password is hashed correctly
   - Check user table has the correct data

3. **"Data not syncing"**
   - Check RLS policies are set correctly
   - Verify user authentication is working
   - Check browser console for errors

### **Support:**
- Check Supabase logs in the dashboard
- Review browser console for client-side errors
- Verify all SQL scripts ran successfully

## 📋 **Next Steps**

1. **Test thoroughly** across different browsers and devices
2. **Monitor Supabase usage** to ensure within free tier limits
3. **Set up backups** if needed for production use
4. **Consider upgrading** to paid Supabase plan for production

---

**🎉 Congratulations!** Your Smart Cost Calculator now has true cross-browser persistence with Supabase! 