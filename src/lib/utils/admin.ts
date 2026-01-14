// src/lib/utils/admin.ts

/**
 * List of allowed admin email addresses
 */
const ALLOWED_ADMIN_EMAILS = [
  'jongfisher70@gmail.com',
  'parkere.case@gmail.com'
].map(email => email.toLowerCase())

/**
 * Check if a user has admin access based on their email address
 * @param email - The user's email address
 * @returns boolean - true if the user has admin access
 */
export function isAdminUser(email: string | null | undefined): boolean {
  if (!email) return false
  
  // Check if email is in the allowed admin emails list
  return ALLOWED_ADMIN_EMAILS.includes(email.toLowerCase())
}

/**
 * Extract domain from email address
 * @param email - The email address
 * @returns string - The domain part of the email
 */
export function getEmailDomain(email: string): string {
  const parts = email.split('@')
  return parts.length > 1 ? parts[1].toLowerCase() : ''
}

/**
 * Check if email domain is in the allowed admin domains list
 * @param email - The user's email address
 * @param allowedDomains - Array of allowed domains
 * @returns boolean - true if the domain is allowed
 */
export function isEmailDomainAllowed(email: string | null | undefined, allowedDomains: string[]): boolean {
  if (!email) return false
  
  const domain = getEmailDomain(email)
  return allowedDomains.includes(domain)
}

/**
 * Get the list of allowed admin email addresses
 * @returns string[] - Array of allowed admin emails
 */
export function getAllowedAdminEmails(): string[] {
  return [...ALLOWED_ADMIN_EMAILS]
}

/**
 * Check if a user has admin access
 * @param email - The user's email address
 * @returns boolean - true if the user has admin access
 */
export function hasAdminAccess(email: string | null | undefined): boolean {
  return isAdminUser(email)
}
