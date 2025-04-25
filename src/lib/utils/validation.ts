// src/lib/utils/validations.ts
/**
 * Form validation utility functions
 */

export interface ValidationErrors {
    [key: string]: string;
  }
  
  /**
   * Validate required fields in a form
   */
  export function validateRequired(data: Record<string, any>, requiredFields: string[]): ValidationErrors {
    const errors: ValidationErrors = {};
    
    requiredFields.forEach(field => {
      if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
        errors[field] = 'This field is required';
      }
    });
    
    return errors;
  }
  
  /**
   * Validate email format
   */
  export function validateEmail(email: string): string | null {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email)) {
      return 'Please enter a valid email address';
    }
    return null;
  }
  
  /**
   * Validate password strength
   */
  export function validatePassword(password: string): string | null {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    
    // Check for complexity requirements
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (!(hasUpperCase && hasLowerCase && hasNumbers)) {
      return 'Password must include uppercase, lowercase, and numbers';
    }
    
    // For stronger passwords, uncomment this
    // if (!hasSpecialChar) {
    //   return 'Password must include at least one special character';
    // }
    
    return null;
  }
  
  /**
   * Validate phone number
   */
  export function validatePhone(phone: string): string | null {
    // Basic validation for US phone numbers
    const re = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    if (!re.test(phone)) {
      return 'Please enter a valid phone number';
    }
    return null;
  }
  
  /**
   * Validate URL format
   */
  export function validateUrl(url: string): string | null {
    if (!url) return null; // Allow empty URLs
    
    try {
      new URL(url);
      return null;
    } catch (e) {
      return 'Please enter a valid URL (include http:// or https://)';
    }
  }
  
  /**
   * Validate form data with multiple rules
   */
  export function validateForm(data: Record<string, any>, validations: Record<string, (value: any) => string | null>): ValidationErrors {
    const errors: ValidationErrors = {};
    
    Object.entries(validations).forEach(([field, validationFn]) => {
      const error = validationFn(data[field]);
      if (error) {
        errors[field] = error;
      }
    });
    
    return errors;
  }