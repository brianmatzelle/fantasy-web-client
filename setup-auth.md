# Authentication Setup Guide

## Prerequisites

1. **MongoDB**: Ensure MongoDB is running locally on port 27017
   ```bash
   # Start MongoDB (if using systemd)
   sudo systemctl start mongod
   
   # Or if using MongoDB Community Edition directly
   mongod --dbpath /data/db
   ```

2. **Environment Variables**: Update `.env.local` with your specific settings:
   ```bash
   # Generate a secure secret
   openssl rand -base64 32
   ```

## Setup Steps

### 1. Create Admin User (Optional)

Connect to MongoDB and create an initial admin user:

```bash
# Connect to MongoDB
mongosh

# Switch to your database
use fantasy-football-ai

# Create an admin user directly in the database
db.users.insertOne({
  email: "admin@example.com",
  name: "Admin User",
  password: "$2a$12$LQv3c1yqBwEHxv68JA0cNOHCyYgOZRZMfgHMTkiTBOCOv1oBdgTyy", // "password123"
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### 2. Test the Application

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Test Authentication Flow**:
   - Visit `http://localhost:3000`
   - You should be redirected to `/auth/signin`
   - Try signing up with a new account
   - Try signing in with existing credentials

3. **Test Authorization**:
   - Visit `/admin` (requires admin role)
   - Visit `/premium` (requires premium or admin role)
   - Visit `/unauthorized` to see the access denied page

### 3. Default Test Accounts

After running the app, you can create test accounts:

- **Regular User**: Sign up normally through the UI
- **Admin User**: Use the MongoDB command above or promote a user via the admin panel

## Security Features Implemented

### Authentication (AuthN)
- ✅ User registration and login with email/password
- ✅ Password hashing with bcrypt (12 rounds)
- ✅ JWT-based session management with secure cookies
- ✅ Session persistence and automatic refresh
- ✅ Secure logout functionality

### Authorization (AuthZ)
- ✅ Role-based access control (user, premium, admin)
- ✅ Middleware-based route protection
- ✅ API route authorization
- ✅ UI component-level access control
- ✅ Admin panel for user management

### Security Best Practices
- ✅ HTTPS-ready configuration
- ✅ Environment variable management
- ✅ Password strength validation
- ✅ SQL injection prevention (MongoDB)
- ✅ XSS protection with secure cookies
- ✅ CSRF protection via NextAuth.js
- ✅ Input validation and sanitization

## API Endpoints

### Authentication
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout
- `GET /api/auth/session` - Get current session

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile

### Admin
- `GET /api/admin/users` - List all users (admin only)
- `PUT /api/admin/users` - Update user roles (admin only)

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**:
   - Ensure MongoDB is running
   - Check the `MONGODB_URI` in `.env.local`

2. **NextAuth Configuration Error**:
   - Verify `NEXTAUTH_SECRET` is set
   - Check `NEXTAUTH_URL` matches your domain

3. **Session Issues**:
   - Clear browser cookies
   - Restart the development server

4. **Permission Errors**:
   - Check user roles in the database
   - Verify middleware configuration

### Database Schema

The system automatically creates the following collections:

- `users` - User accounts and profiles
- `accounts` - NextAuth.js account linking
- `sessions` - Active user sessions
- `verification_tokens` - Email verification (if enabled)

## Production Deployment

Before deploying to production:

1. **Update Environment Variables**:
   - Set a strong `NEXTAUTH_SECRET`
   - Update `NEXTAUTH_URL` to your domain
   - Use a secure MongoDB connection string

2. **Enable HTTPS**:
   - Configure SSL certificates
   - Update all URLs to use HTTPS

3. **Database Security**:
   - Enable MongoDB authentication
   - Use database connection with credentials
   - Set up database backups

4. **Monitor and Log**:
   - Set up error monitoring
   - Configure audit logging
   - Monitor authentication attempts
