/**
 * Input Validation Middleware
 * Validates and sanitizes request data
 */

export const validateRegister = (req, res, next) => {
  const { username, email, password, confirmPassword } = req.body;
  
  // Check required fields
  if (!username || !email || !password || !confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required'
    });
  }
  
  // Username validation
  if (username.length < 3 || username.length > 50) {
    return res.status(400).json({
      success: false,
      message: 'Username must be between 3 and 50 characters'
    });
  }
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format'
    });
  }
  
  // Password validation
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long'
    });
  }
  
  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Passwords do not match'
    });
  }
  
  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format'
    });
  }
  
  next();
};

export const validateShareFile = (req, res, next) => {
  const { shareWith, role } = req.body;
  
  if (!shareWith || !Array.isArray(shareWith) || shareWith.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'shareWith must be a non-empty array of user IDs'
    });
  }
  
  if (!role || !['owner', 'viewer'].includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid role. Must be "owner" or "viewer"'
    });
  }
  
  next();
};

export default {
  validateRegister,
  validateLogin,
  validateShareFile
};
