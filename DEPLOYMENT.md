# Vercel Deployment Guide

## Prerequisites

1. **GitHub Account**: You need a GitHub account to host your code
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **Git**: Install Git on your system

## Step-by-Step Deployment

### 1. Prepare Your Code

Ensure your project is ready for deployment:

```bash
# Test the build locally
npm run build

# If successful, you're ready to deploy
```

### 2. Push to GitHub

1. **Create a new repository on GitHub**
2. **Initialize Git and push your code**:

```bash
git init
git add .
git commit -m "Initial commit: Smart Cost Calculator"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

### 3. Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com) and sign in**
2. **Click "New Project"**
3. **Import your GitHub repository**
4. **Configure the project**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

5. **Click "Deploy"**

### 4. Post-Deployment Configuration

After deployment, your app will be available at `https://your-project-name.vercel.app`

#### Important Notes:

1. **JSON File Persistence**: The app uses JSON files in `/public/config/` for data storage
2. **API Routes**: All API routes are automatically deployed as serverless functions
3. **Environment Variables**: No environment variables are required for basic functionality

### 5. Verify Deployment

1. **Test the login page**: Use admin credentials (Camryn / Elliot6242!)
2. **Test calculator functionality**: Create a new deal calculation
3. **Test admin panel**: Configure hardware, licensing, etc.
4. **Test PDF generation**: Generate a deal breakdown PDF
5. **Test data persistence**: Verify JSON files are being updated

## Troubleshooting

### Common Issues:

1. **Build Failures**: Check the build logs in Vercel dashboard
2. **API Errors**: Verify API routes are working in the Functions tab
3. **File Permissions**: Ensure JSON files are writable

### Performance Optimization:

1. **Enable Edge Functions**: For better performance
2. **Configure Caching**: For static assets
3. **Monitor Usage**: Check Vercel analytics

## Maintenance

### Regular Tasks:

1. **Monitor Vercel dashboard** for any issues
2. **Check function logs** for API errors
3. **Update dependencies** regularly
4. **Backup JSON data** periodically

### Scaling Considerations:

1. **Database Migration**: Consider moving from JSON files to a proper database
2. **Authentication**: Implement proper authentication system
3. **CDN**: Use Vercel's edge network for global performance

## Support

If you encounter issues:

1. Check Vercel deployment logs
2. Review the application logs
3. Test locally to isolate issues
4. Contact Vercel support if needed 