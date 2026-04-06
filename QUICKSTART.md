# SecureSphere - Quick Start Guide

Get SecureSphere up and running in 5 minutes!

## 🚀 Quick Start (All-in-One)

### Terminal 1 - Backend

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file with default values
cat > .env << EOF
PORT=5000
MONGODB_URI=mongodb://localhost:27017/securesphere
JWT_SECRET=change_this_to_a_secure_random_string_in_production
JWT_EXPIRATION=7d
NODE_ENV=development
ENCRYPTION_KEY=this_should_be_32_characters_or_more_for_security
EOF

# Make sure MongoDB is running (in another terminal)
# mongod

# Start backend server
npm run dev
```

Expected output:
```
✓ MongoDB connected successfully
✓ Server running on http://localhost:5000
✓ Environment: development
```

### Terminal 2 - Frontend

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Expected output:
```
Local:   http://localhost:3000
```

### Terminal 3 - MongoDB (if not running)

```bash
# Start MongoDB
mongod
```

## 🛠️ Step-by-Step Setup

### Prerequisites Check

```bash
# Check Node.js version (should be v14+)
node --version

# Check npm version
npm --version

# Verify MongoDB is installed
mongod --version
```

### Backend Setup

```bash
# 1. Navigate to backend
cd backend

# 2. Install packages
npm install

# 3. Create environment file
cp .env.example .env

# 4. Edit .env with your values (optional)
# nano .env  # or use your editor

# 5. Start MongoDB (in separate terminal)
mongod

# 6. Start backend
npm run dev
```

### Frontend Setup

```bash
# 1. In new terminal, navigate to frontend
cd frontend

# 2. Install packages
npm install

# 3. Start development server
npm run dev

# 4. Open http://localhost:3000 in browser
```

## 📝 First Time Setup

### 1. Register Account

1. Go to http://localhost:3000/register
2. Enter:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `Test123456`
3. Click "Register"

### 2. Upload File

1. Go to Upload page
2. Select a file (or drag-drop)
3. Add description (optional)
4. Click "Upload File"
5. See file in Dashboard

### 3. Create Another Account

1. Logout
2. Go to Register
3. Create second user with different email

### 4. Share File

1. Login with first account
2. Go to Dashboard
3. Click "Share" on a file
4. Select second user
5. Choose role (viewer)
6. Login with second user to see shared file

## 🔍 Verify Everything Works

### Check Backend

```bash
curl http://localhost:5000/api/health
```

Should return:
```json
{
  "success": true,
  "message": "SecureSphere API is running"
}
```

### Test API Endpoint

```bash
# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "test123",
    "confirmPassword": "test123"
  }'
```

## 📂 Key Files to Know

### Backend
- `src/server.js` - Server entry point
- `src/config/database.js` - MongoDB connection
- `src/middleware/authMiddleware.js` - JWT auth
- `src/services/encryptionService.js` - File encryption
- `uploads/` - Encrypted files storage

### Frontend
- `src/App.jsx` - Main app component
- `src/context/AuthContext.jsx` - Auth state management
- `src/pages/Dashboard.jsx` - Main dashboard
- `src/services/apiService.js` - API calls

## 🐛 Common Issues

### MongoDB won't start
```bash
# Ensure MongoDB directory exists
mkdir -p /usr/local/var/mongodb
mongod
```

### Port already in use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Missing dependencies
```bash
cd backend
npm install

cd ../frontend
npm install
```

### API connection refused
- Ensure backend is running on port 5000
- Check vite.config.js has correct proxy

## 🔐 Security Checklist

Before production:
- [ ] Change JWT_SECRET in .env
- [ ] Change ENCRYPTION_KEY in .env
- [ ] Use HTTPS/SSL
- [ ] Set NODE_ENV=production
- [ ] Use MongoDB Atlas (not local)
- [ ] Configure proper CORS
- [ ] Review error messages (don't leak sensitive info)
- [ ] Set up rate limiting
- [ ] Use strong MongoDB credentials

## 📦 Production Build

### Build Frontend

```bash
cd frontend
npm run build
```

Output in `frontend/dist/`

### Deploy

Deploy the `dist/` folder to:
- Netlify, Vercel, GitHub Pages (frontend)
- Heroku, AWS, DigitalOcean (backend)

## 📚 Documentation

See:
- `README.md` - Full documentation
- `BACKEND_SETUP.md` - Backend details
- `FRONTEND_SETUP.md` - Frontend details

## 🆘 Need Help?

1. **Check logs** - Terminal output
2. **Check .env** - Verify configuration
3. **Check MongoDB** - Is it running?
4. **Check ports** - 3000 and 5000 free?
5. **Clear cache** - `rm -rf node_modules && npm install`

## ✅ Success Indicators

Backend running:
```
✓ Server running on http://localhost:5000
✓ MongoDB connected successfully
```

Frontend running:
```
✓ Local: http://localhost:3000
✓ Page loads with no errors
```

Application working:
- [ ] Can register new user
- [ ] Can login with credentials
- [ ] Can upload file
- [ ] Can view dashboard
- [ ] Can see encrypted files
- [ ] Can download file
- [ ] Can share with another user

---

**You're all set! SecureSphere is running. Enjoy secure file sharing!** 🔒
