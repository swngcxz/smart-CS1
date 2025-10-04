function validateStaff(req, res, next) {
  const { fullName, role, email, password, contactNumber } = req.body;
  
  // Check required fields
  if (!fullName || !role || !email || !password) {
    return res.status(400).json({ 
      error: 'Missing required fields (fullName, role, email, password)' 
    });
  }

  // Validate full name (at least 2 words, only letters and spaces)
  const nameRegex = /^[a-zA-Z\s]{2,50}$/;
  if (!nameRegex.test(fullName.trim())) {
    return res.status(400).json({ 
      error: 'Full name must be 2-50 characters, contain only letters and spaces, and have at least first and last name' 
    });
  }

  // Check if full name has at least 2 words (first and last name)
  const nameWords = fullName.trim().split(/\s+/);
  if (nameWords.length < 2) {
    return res.status(400).json({ 
      error: 'Full name must include both first and last name' 
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      error: 'Please enter a valid email address' 
    });
  }

  // Validate password strength
  if (password.length < 8) {
    return res.status(400).json({ 
      error: 'Password must be at least 8 characters long' 
    });
  }

  // Password must contain at least one uppercase, one lowercase, one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ 
      error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' 
    });
  }

  // Validate Philippines phone number if provided
  if (contactNumber && contactNumber.trim() !== '') {
    // Accept formats: +63XXXXXXXXXX, 09XXXXXXXXX, 9XXXXXXXXX
    const phPhoneRegex = /^(\+63|0)?9\d{9}$/;
    if (!phPhoneRegex.test(contactNumber.replace(/\s+/g, ''))) {
      return res.status(400).json({ 
        error: 'Please enter a valid Philippines mobile number (e.g., +639123456789 or 09123456789)' 
      });
    }
  }

  // Validate role
  const validRoles = ['janitor', 'driver', 'maintenance', 'staff'];
  if (!validRoles.includes(role.toLowerCase())) {
    return res.status(400).json({ 
      error: 'Invalid role. Must be one of: janitor, driver, maintenance, staff' 
    });
  }

  next();
}


module.exports = validateStaff;
