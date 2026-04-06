# SecureSphere - Project Structure & File Guide

## Complete Project Structure

```
SecureSphere/
├── README.md                      # Main documentation
├── QUICKSTART.md                  # 5-minute quick start guide
├── BACKEND_SETUP.md              # Backend installation guide
├── FRONTEND_SETUP.md             # Frontend installation guide
│
├── backend/
│   ├── package.json              # Backend dependencies
│   ├── .env.example              # Environment variables template
│   ├── .gitignore
│   │
│   ├── src/
│   │   ├── server.js             # Express server entry point
│   │   │
│   │   ├── config/
│   │   │   ├── env.js            # Environment config loader
│   │   │   └── database.js       # MongoDB connection setup
│   │   │
│   │   ├── models/
│   │   │   ├── User.js           # User schema with bcrypt
│   │   │   ├── File.js           # File metadata schema
│   │   │   └── AccessLog.js      # Access audit trail
│   │   │
│   │   ├── controllers/
│   │   │   ├── authController.js # Auth operations
│   │   │   └── fileController.js # File operations
│   │   │
│   │   ├── routes/
│   │   │   ├── authRoutes.js     # Auth endpoints
│   │   │   └── fileRoutes.js     # File endpoints
│   │   │
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js # JWT authentication
│   │   │   ├── errorHandler.js   # Error handling
│   │   │   ├── uploadMiddleware.js # File upload
│   │   │   └── validationMiddleware.js # Input validation
│   │   │
│   │   ├── services/
│   │   │   ├── encryptionService.js # AES-256-GCM encryption
│   │   │   ├── hashingService.js    # Bcrypt & SHA-256
│   │   │   └── accessControlService.js # RBAC
│   │   │
│   │   └── utils/
│   │       └── (utility functions)
│   │
│   └── uploads/                  # Encrypted file storage
│       └── .gitkeep
│
└── frontend/
    ├── package.json              # Frontend dependencies
    ├── index.html               # HTML entry point
    ├── vite.config.js           # Vite configuration
    ├── tailwind.config.js       # Tailwind CSS config
    ├── postcss.config.js        # PostCSS config
    ├── .gitignore
    │
    └── src/
        ├── main.jsx             # React entry point
        ├── App.jsx              # Main app component
        ├── index.css            # Global styles
        │
        ├── pages/
        │   ├── Home.jsx         # Landing page
        │   ├── Login.jsx        # Login page
        │   ├── Register.jsx     # Registration page
        │   ├── Dashboard.jsx    # User files dashboard
        │   ├── Upload.jsx       # File upload page
        │   └── SharedFiles.jsx  # Files shared with user
        │
        ├── components/
        │   ├── Navbar.jsx       # Navigation bar
        │   ├── FileCard.jsx     # File card component
        │   └── UploadForm.jsx   # Upload form
        │
        ├── context/
        │   └── AuthContext.jsx  # Auth state management
        │
        ├── services/
        │   ├── apiService.js    # API calls (auth, files)
        │   └── encryptionService.js # Client-side encryption
        │
        └── utils/
            └── (utility functions)
```

## File Descriptions

### Backend Files

#### Core Configuration
- **server.js** - Express app setup, routes, middleware, error handling
- **config/env.js** - Loads environment variables with defaults
- **config/database.js** - MongoDB connection with error handling

#### Data Models
- **models/User.js** - User schema with pre-save password hashing
- **models/File.js** - File metadata with access control array
- **models/AccessLog.js** - Audit trail for all file operations

#### Route Handlers
- **controllers/authController.js** - Register, login, profile management
- **controllers/fileController.js** - Upload, download, share, delete operations

#### API Routes
- **routes/authRoutes.js** - Auth endpoints (register, login, profile)
- **routes/fileRoutes.js** - File endpoints (CRUD + sharing)

#### Security Middleware
- **middleware/authMiddleware.js** - JWT verification, generateToken()
- **middleware/errorHandler.js** - Global error handling and 404
- **middleware/uploadMiddleware.js** - Multer file upload with validation
- **middleware/validationMiddleware.js** - Input validation for all routes

#### Business Logic Services
- **services/encryptionService.js** - AES-256-GCM encryption/decryption
- **services/hashingService.js** - bcrypt password hashing, SHA-256 file hashing
- **services/accessControlService.js** - RBAC with owner/viewer roles

#### Storage
- **uploads/** - Directory for encrypted files

### Frontend Files

#### Entry Points
- **index.html** - HTML template
- **main.jsx** - React root render
- **App.jsx** - App structure with routing

#### Pages (Full Pages)
- **pages/Home.jsx** - Landing page with features
- **pages/Login.jsx** - Login form with validation
- **pages/Register.jsx** - Registration form
- **pages/Dashboard.jsx** - User's uploaded files
- **pages/Upload.jsx** - File upload interface
- **pages/SharedFiles.jsx** - Files shared with user

#### Components (Reusable)
- **components/Navbar.jsx** - Navigation with auth state
- **components/FileCard.jsx** - File display card
- **components/UploadForm.jsx** - File upload with drag-drop

#### State Management
- **context/AuthContext.jsx** - Global auth state (user, token, login, logout)

#### API & Utilities
- **services/apiService.js** - All API endpoints (fetch-based)
- **services/encryptionService.js** - Client-side AES encryption
- **index.css** - Tailwind CSS + global styles

#### Configuration
- **vite.config.js** - Vite dev server, API proxy
- **tailwind.config.js** - Dark theme customization
- **postcss.config.js** - CSS processing
- **package.json** - React, React Router, Axios, CryptoJS

### Documentation Files

- **README.md** - Complete feature and API documentation
- **QUICKSTART.md** - 5-minute setup guide
- **BACKEND_SETUP.md** - Backend installation details
- **FRONTEND_SETUP.md** - Frontend installation details
- **PROJECT_FILES.md** - This file

## Key Features by Component

### Authentication (Backend)
- User registration with validation
- Password hashing with bcrypt
- JWT token generation and verification
- Protected routes with authMiddleware

### Authentication (Frontend)
- AuthContext for global state
- Protected routes with ProtectedRoute component
- Token storage in localStorage
- Automatic redirect to login if not authenticated

### File Encryption (Backend)
- AES-256-GCM encryption with PBKDF2
- Automatic encryption on upload
- Decryption on download
- SHA-256 file integrity hashing

### File Management (Backend)
- Multer file upload handling
- File metadata storage in MongoDB
- Access control with owner/viewer roles
- File sharing between users
- Download tracking and access logs

### File Management (Frontend)
- Drag-and-drop upload
- File preview for images
- File download with decryption
- File listing with pagination
- Share/delete operations

### Security Features
- JWT authentication
- bcrypt password hashing
- AES-256 file encryption
- SHA-256 file hashing
- Role-based access control (RBAC)
- Input validation
- Error handling
- CORS configuration

## Technology Stack Details

### Backend
- **Node.js/Express** - Server framework
- **MongoDB/Mongoose** - Database and ODM
- **bcryptjs** - Password hashing
- **jwt-simple** - JWT token handling
- **crypto** (Node.js built-in) - Encryption
- **Multer** - File upload middleware
- **CORS** - Cross-origin support

### Frontend
- **React 18** - UI library
- **React Router v6** - Routing
- **Vite** - Build tool
- **Tailwind CSS 3** - Styling
- **CryptoJS** - Client-side encryption
- **Fetch API** - API calls (custom service)

## API Endpoints Summary

### Public
- `GET /api/health` - Health check

### Authentication
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get profile (protected)
- `PUT /api/auth/profile` - Update profile (protected)

### Files
- `POST /api/files/upload` - Upload (protected)
- `GET /api/files` - List files (protected)
- `GET /api/files/:id` - File details (protected)
- `GET /api/files/:id/download` - Download (protected)
- `POST /api/files/:id/share` - Share (protected)
- `POST /api/files/:id/revoke` - Revoke access (protected)
- `DELETE /api/files/:id` - Delete (protected)

## Database Schema Overview

### User Collection
- username, email, password (hashed)
- profile (firstName, lastName, avatar)
- preferences (theme, twoFactorEnabled)
- timestamps

### File Collection
- name, originalName, mimeType, size
- hash (SHA-256), owner, filePath
- isEncrypted, description, tags
- access array (userId, role, grantedAt, isActive)
- downloadCount, lastAccessedAt
- timestamps

### AccessLog Collection
- userId, fileId, action, status
- ipAddress, userAgent, details
- timestamp

## Development Workflow

1. **Backend Development**
   - Edit files in `backend/src/`
   - Server auto-reloads with nodemon
   - API available at http://localhost:5000

2. **Frontend Development**
   - Edit files in `frontend/src/`
   - Hot reload with Vite
   - UI available at http://localhost:3000
   - API proxy to http://localhost:5000

3. **Testing**
   - Register user
   - Upload file
   - Share with another user
   - Download and decrypt

## Deployment Considerations

1. **Backend**
   - Use MongoDB Atlas
   - Deploy to Heroku, AWS, DigitalOcean
   - Set environment variables securely
   - Use PM2 for process management

2. **Frontend**
   - Build with `npm run build`
   - Deploy `dist/` to Netlify, Vercel, or CDN
   - Configure API endpoint
   - Enable security headers

## Security Best Practices Implemented

✅ Password hashing with bcrypt (10 rounds)
✅ JWT for stateless authentication
✅ AES-256-GCM file encryption
✅ SHA-256 file integrity verification
✅ PBKDF2 key derivation (100,000 iterations)
✅ RBAC with owner and viewer roles
✅ Input validation on all endpoints
✅ Error handling without info leaks
✅ Protected routes (frontend)
✅ Protected API endpoints (backend)
✅ CORS configuration
✅ Access logging for audit trails

## Next Steps for Customization

1. **Add 2FA** - Implement two-factor authentication
2. **File Versioning** - Track file versions
3. **Real-time Updates** - Socket.io for notifications
4. **Advanced Search** - Full-text search for files
5. **File Comments** - Add comments to files
6. **User Roles** - Admin, moderator roles
7. **Rate Limiting** - Prevent abuse
8. **Backup/Recovery** - File backup system
9. **Analytics** - Usage analytics dashboard
10. **Integration** - OAuth, SSO, etc.

---

**SecureSphere is now ready for development and deployment!** 🚀
