# Backend - Installation & Running Guide

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

## Installation Steps

### 1. Install Dependencies

Navigate to the backend directory and install all required packages:

```bash
cd backend
npm install
```

### 2. Environment Configuration

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` and set your values:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/securesphere
JWT_SECRET=your_ultra_secure_jwt_secret_key_should_be_long_random_string
JWT_EXPIRATION=7d
NODE_ENV=development
ENCRYPTION_KEY=your_encryption_key_minimum_32_characters_long
```

### 3. MongoDB Setup

#### Option A: Local MongoDB

For macOS (if using Homebrew):
```bash
# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Or run in foreground
mongod

# Verify MongoDB is running
mongo
```

For other OS, follow: https://docs.mongodb.com/manual/installation/

#### Option B: MongoDB Atlas (Cloud)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create account and cluster
3. Get connection string
4. Update MONGODB_URI in .env:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/securesphere
   ```

### 4. Start the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server will start on `http://localhost:5000`

## Verify Installation

Check the API is working:

```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "SecureSphere API is running",
  "timestamp": "2024-04-06T10:30:00.000Z"
}
```

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── env.js           # Environment configuration
│   │   └── database.js      # MongoDB connection
│   ├── models/
│   │   ├── User.js          # User schema
│   │   ├── File.js          # File metadata schema
│   │   └── AccessLog.js     # Activity logging
│   ├── controllers/
│   │   ├── authController.js
│   │   └── fileController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── fileRoutes.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── errorHandler.js
│   │   ├── uploadMiddleware.js
│   │   └── validationMiddleware.js
│   ├── services/
│   │   ├── encryptionService.js
│   │   ├── hashingService.js
│   │   └── accessControlService.js
│   └── server.js            # Express app entry point
├── uploads/                 # Encrypted file storage
├── package.json
├── .env.example
└── .gitignore
```

## Available Scripts

```bash
# Development server with auto-reload
npm run dev

# Start production server
npm start

# Run tests (when configured)
npm test
```

## Troubleshooting

### MongoDB Connection Failed
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Start MongoDB service or check connection string

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution**: Change PORT in .env or kill process on port 5000

### Module Not Found
```
Error: Cannot find module 'express'
```
**Solution**: Run `npm install`

### JWT Secret Not Set
```
Error: JWT_SECRET is required
```
**Solution**: Set JWT_SECRET in .env file

## API Endpoints

### Public Endpoints
- `GET /api/health` - Health check

### Authentication Endpoints
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user

### Protected Endpoints (require Bearer token)
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `POST /api/files/upload` - Upload file
- `GET /api/files` - Get user files
- `GET /api/files/:id` - Get file details
- `GET /api/files/:id/download` - Download file
- `POST /api/files/:id/share` - Share file
- `DELETE /api/files/:id` - Delete file

## Security Notes

1. **Keep .env Secret**: Never commit .env to version control
2. **Strong JWT Secret**: Use a random, long string (30+ characters)
3. **Strong Encryption Key**: Use 32 characters minimum
4. **MongoDB**: Use strong credentials for production
5. **HTTPS**: Always use HTTPS in production
6. **Rate Limiting**: Implement in production

## Performance Tips

1. Enable compression in Express
2. Use MongoDB indexing
3. Implement caching strategies
4. Monitor file upload size limits
5. Clean up old session/logs periodically

## Deployment

To deploy the backend:

1. Set NODE_ENV=production in .env
2. Use process manager (PM2, Forever)
3. Set up reverse proxy (Nginx)
4. Use MongoDB Atlas for database
5. Deploy to cloud (Heroku, AWS, DigitalOcean, etc.)

Example PM2 startup:
```bash
npm install -g pm2
pm2 start src/server.js --name "securesphere-backend"
pm2 startup
pm2 save
```
