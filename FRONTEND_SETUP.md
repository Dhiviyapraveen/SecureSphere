# Frontend - Installation & Running Guide

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Backend running on http://localhost:5000 (for development)

## Installation Steps
### 1. Install Dependencies

Navigate to the frontend directory and install all required packages:

```bash
cd frontend
npm install
```

Installs:
- React and React DOM
- React Router for navigation
- Axios for API calls
- Tailwind CSS for styling
- CryptoJS for encryption utilities
- Vite as build tool

### 2. Start Development Server

Run the development server with hot module replacement:

```bash
npm run dev
```

Frontend will be available at: `http://localhost:3000`

The dev server includes:
- Hot reloading on file changes
- Proxy to backend API at `http://localhost:5000`
- Source maps for debugging

### 3. Verify Frontend is Running

Open your browser:
```
http://localhost:3000
```

You should see the SecureSphere home page with:
- SecureSphere logo and branding
- Feature highlights
- Login and Register buttons

## Project Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── Home.jsx           # Landing page
│   │   ├── Login.jsx          # Login page
│   │   ├── Register.jsx       # Registration page
│   │   ├── Dashboard.jsx      # User files dashboard
│   │   ├── Upload.jsx         # File upload page
│   │   └── SharedFiles.jsx    # Files shared with user
│   ├── components/
│   │   ├── Navbar.jsx         # Navigation bar
│   │   ├── FileCard.jsx       # File card component
│   │   └── UploadForm.jsx     # Upload form component
│   ├── context/
│   │   └── AuthContext.jsx    # Authentication context
│   ├── services/
│   │   ├── apiService.js      # API calls
│   │   └── encryptionService.js # Encryption utilities
│   ├── App.jsx                # Main app component
│   ├── main.jsx               # Entry point
│   └── index.css              # Global styles
├── public/                    # Static assets
├── index.html                 # HTML template
├── vite.config.js            # Vite configuration
├── tailwind.config.js        # Tailwind CSS config
├── postcss.config.js         # PostCSS config
├── package.json
└── .gitignore
```

## Available Scripts

```bash
# Start development server (hot reload)
npm run dev

# Build for production
npm run build
# Output: dist/ folder

# Preview production build locally
npm run preview
```

## Build for Production

Create optimized production build:

```bash
npm run build
```

This creates a `dist/` folder with:
- Minified JavaScript and CSS
- Optimized images
- Source maps (optional)
- ~100KB bundled and gzipped

### Deployment

After building, deploy the `dist/` folder to:
- Static hosting (Netlify, Vercel, GitHub Pages)
- Web server (Nginx, Apache)
- Cloud platform (AWS S3 + CloudFront, etc.)

## Features Overview

### Pages

1. **Home** (`/`)
   - Landing page with features
   - Login/Register buttons

2. **Login** (`/login`)
   - Email/password login
   - Link to register

3. **Register** (`/register`)
   - Username, email, password registration
   - Validation and error handling

4. **Dashboard** (`/dashboard`)
   - View all uploaded files
   - Download, share, delete files
   - Pagination support

5. **Upload** (`/upload`)
   - Drag-and-drop file upload
   - File description and tags
   - Files encrypted before upload

6. **Shared Files** (`/shared`)
   - View files shared by others
   - Download shared files

### Components

1. **Navbar**
   - Navigation links
   - User profile display
   - Logout button
   - Responsive design

2. **FileCard**
   - File info display
   - Action buttons (download, share, delete)
   - Tags and metadata
   - File icons by type

3. **UploadForm**
   - Drag-and-drop area
   - File preview
   - Description textarea
   - Tags input
   - File size validation

## API Integration

Frontend communicates with backend:

```javascript
// Example API call
import { fileAPI } from './services/apiService';

// Upload file
await fileAPI.uploadFile(formData, token);

// Get files
const response = await fileAPI.getMyFiles(page, limit, token);

// Download file
const response = await fileAPI.downloadFile(fileId, token);
```

## Authentication Flow

1. User registers/logs in
2. Backend returns JWT token
3. Token stored in localStorage
4. Token sent in Authorization header for protected requests
5. AuthContext manages auth state globally

```javascript
// Using auth context
const { user, token, login, logout } = useContext(AuthContext);
```

## Styling

**Dark Theme** using Tailwind CSS:
- Dark slate backgrounds (#1e293b, #0f172a)
- Blue accents (#3b82f6)
- Red for danger actions (#ef4444)
- Responsive grid layouts

## Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#1e293b',
        danger: '#ef4444'
      }
    }
  }
};
```

## Troubleshooting

### Dev server won't start
```
Error: EADDRINUSE: address already in use :::3000
```
**Solution**: Change port in vite.config.js or kill process on port 3000

### API requests fail
```
Error: Cannot GET /api/files
```
**Solution**: 
- Ensure backend is running on port 5000
- Check proxy in vite.config.js

### Build fails
```
Error: Module not found
```
**Solution**: 
- Run `npm install`
- Check import paths

### Blank page after build
```
404 on refresh with client-side routing
```
**Solution**:
- Configure server for SPA routing
- Use fallback to index.html

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- Code splitting with React Router
- Lazy loading for routes
- CSS purging with Tailwind
- Image optimization opportunities
- Bundle size ~150KB gzipped

## Security Considerations

1. **Token Storage**: Stored in localStorage (consider sessionStorage)
2. **HTTPS**: Use in production
3. **CORS**: Configured for development
4. **Input Validation**: Check user inputs
5. **XSS Protection**: React auto-escapes JSX

## Environment Notes

For production deployment:
- Build: `npm run build`
- Set API endpoint in environment variables
- Configure CORS for backend domain
- Use secure cookie for token storage (instead of localStorage)
- Enable security headers

## Getting Help

For issues:
1. Check browser console (F12)
2. Check network tab for API errors
3. Check vite.config.js and tailwind.config.js
4. Verify backend is running
5. Clear cache and reinstall: `rm -rf node_modules && npm install`
