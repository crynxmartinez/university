# Deployment Guide - Assalaam University LMS

This guide covers deploying the Assalaam University Learning Management System to Vercel.

## 📋 Prerequisites

- GitHub account with repository access
- Vercel account (free tier works)
- PostgreSQL database (hosted)

## 🗄️ Database Setup

### Option 1: Vercel Postgres (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to Storage → Create Database
3. Select "Postgres"
4. Choose a region close to your users
5. Copy the `DATABASE_URL` connection string

### Option 2: External PostgreSQL Provider

Choose one of these providers:
- **Supabase** - https://supabase.com (Free tier available)
- **Railway** - https://railway.app (Free tier available)
- **Neon** - https://neon.tech (Free tier available)
- **AWS RDS** - https://aws.amazon.com/rds/ (Paid)

After creating your database, copy the PostgreSQL connection string.

## 🚀 Deployment Steps

### Step 1: Push Code to GitHub

Ensure your code is pushed to GitHub:

```bash
git add .
git commit -m "Production ready deployment"
git push origin main
```

### Step 2: Deploy Backend (Server)

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/new

2. **Import Repository**
   - Click "Import Project"
   - Select your GitHub repository: `crynxmartinez/university`
   - Click "Import"

3. **Configure Project**
   - **Project Name**: `university-server` (or your preferred name)
   - **Framework Preset**: Other
   - **Root Directory**: `server`
   - Click "Edit" next to Root Directory and select `server` folder

4. **Environment Variables**
   Click "Environment Variables" and add:
   
   ```
   DATABASE_URL = postgresql://user:password@host:5432/database
   JWT_SECRET = your-strong-random-secret-key-here
   NODE_ENV = production
   ```
   
   **Important**: 
   - Use your actual database connection string for `DATABASE_URL`
   - Generate a strong random string for `JWT_SECRET` (at least 32 characters)
   - Never commit these values to Git

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete (2-3 minutes)
   - Copy the deployment URL (e.g., `https://university-server.vercel.app`)

6. **Run Database Migrations**
   
   After first deployment, you need to push the Prisma schema:
   
   - Go to your project settings in Vercel
   - Navigate to "Deployments"
   - Click on the latest deployment
   - Open the "Functions" tab
   - The build process should have run `prisma generate` and `prisma db push` automatically
   
   If you need to manually run migrations:
   - Install Prisma CLI locally: `npm install -g prisma`
   - Set your `DATABASE_URL` environment variable locally
   - Run: `npx prisma db push`

### Step 3: Deploy Frontend (Client)

1. **Import Repository Again**
   - Go to https://vercel.com/new
   - Select the same repository: `crynxmartinez/university`

2. **Configure Project**
   - **Project Name**: `university-client` (or your preferred name)
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - Click "Edit" next to Root Directory and select `client` folder

3. **Environment Variables**
   Click "Environment Variables" and add:
   
   ```
   VITE_API_URL = https://university-server.vercel.app/api
   ```
   
   **Important**: Use the actual URL from your backend deployment (Step 2.5)

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete (2-3 minutes)
   - Your frontend will be live at the provided URL

### Step 4: Verify Deployment

1. **Test Backend**
   - Visit: `https://university-server.vercel.app/api/health`
   - Should return: `{"status":"ok","message":"Assalaam University API"}`

2. **Test Frontend**
   - Visit your frontend URL
   - Should see the homepage
   - Try logging in (if you've seeded the database)

3. **Check Database Connection**
   - Try creating a user account
   - Verify data is saved to database

## 🔧 Post-Deployment Configuration

### Update CORS (Optional but Recommended)

For production security, update CORS in `server/src/index.js`:

```javascript
// Replace this:
res.header('Access-Control-Allow-Origin', '*')

// With your frontend domain:
res.header('Access-Control-Allow-Origin', 'https://university-client.vercel.app')
```

Then commit and push to trigger redeployment.

### Seed Database (Optional)

If you want to seed initial data:

1. **Locally**:
   ```bash
   cd server
   DATABASE_URL="your-production-db-url" npm run db:seed
   ```

2. **Or create admin manually** via API:
   ```bash
   POST https://university-server.vercel.app/api/users
   {
     "role": "SUPER_ADMIN",
     "email": "admin@example.com",
     "password": "temporary-password"
   }
   ```

### Custom Domains (Optional)

1. **Go to Project Settings** in Vercel
2. Click "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions
5. Update `VITE_API_URL` if using custom domain for backend

## 🔄 Continuous Deployment

Vercel automatically redeploys when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Your changes"
git push origin main
```

Vercel will:
1. Detect the push
2. Build both projects
3. Deploy new versions
4. Zero-downtime deployment

## 🐛 Troubleshooting

### Build Fails

**Issue**: "Module not found" or dependency errors

**Solution**:
- Check `package.json` dependencies
- Ensure `node_modules` is in `.gitignore`
- Verify `package-lock.json` is committed

### Database Connection Fails

**Issue**: "Can't reach database server"

**Solution**:
- Verify `DATABASE_URL` is correct
- Check database is running and accessible
- Ensure IP whitelist includes Vercel IPs (if using IP restrictions)

### Prisma Schema Not Applied

**Issue**: "Table does not exist"

**Solution**:
- Run `npx prisma db push` manually with production `DATABASE_URL`
- Check Vercel build logs for Prisma errors
- Verify `postinstall` script runs: `"postinstall": "prisma generate"`

### API Calls Fail from Frontend

**Issue**: CORS errors or 404s

**Solution**:
- Verify `VITE_API_URL` is correct in Vercel environment variables
- Check backend is deployed and accessible
- Ensure CORS headers are set correctly

### Environment Variables Not Working

**Issue**: App behaves as if env vars are missing

**Solution**:
- Redeploy after adding environment variables
- Check variable names match exactly (case-sensitive)
- For Vite, ensure variables start with `VITE_`

## 📊 Monitoring

### Vercel Analytics

1. Go to your project in Vercel
2. Click "Analytics" tab
3. View:
   - Page views
   - Performance metrics
   - Error rates

### Database Monitoring

Use your database provider's dashboard to monitor:
- Connection count
- Query performance
- Storage usage

## 🔐 Security Checklist

- ✅ `JWT_SECRET` is strong and unique
- ✅ `DATABASE_URL` is not committed to Git
- ✅ CORS is restricted to your frontend domain
- ✅ Environment variables are set in Vercel (not in code)
- ✅ `.env` files are in `.gitignore`
- ✅ Debug endpoints are removed (already done)

## 📝 Environment Variables Summary

### Backend (Server)
```
DATABASE_URL = postgresql://user:password@host:5432/database
JWT_SECRET = your-strong-random-secret-key
NODE_ENV = production
```

### Frontend (Client)
```
VITE_API_URL = https://your-backend-url.vercel.app/api
```

## 🎯 Next Steps

After successful deployment:

1. **Test all features**:
   - User registration and login
   - Course/program creation
   - Enrollment
   - Exam taking
   - Attendance marking

2. **Create admin account** (if not seeded)

3. **Configure custom domains** (optional)

4. **Set up monitoring** and alerts

5. **Document admin credentials** securely

## 📧 Support

For deployment issues:
- Check Vercel build logs
- Review Vercel documentation: https://vercel.com/docs
- Contact system administrator

---

**Deployment Complete!** 🎉

Your LMS is now live and accessible worldwide via Vercel's CDN.
