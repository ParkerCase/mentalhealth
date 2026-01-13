# Authentication Flow & reCAPTCHA Integration Explanation

## Overview

The application uses **Supabase Auth** for authentication with multiple sign-in methods. There are **two different authentication UI implementations** that handle the flow differently.

---

## Current Authentication Architecture

### 1. **Authentication Methods Supported**
- ✅ Email/Password authentication
- ✅ OAuth (Google, Facebook)
- ⚠️ reCAPTCHA (displayed but **not fully integrated** - see issues below)

### 2. **Key Components**

#### **Component Hierarchy:**
```
Login/Register Pages
├── /api/auth/login/page.tsx
├── /api/auth/register/page.tsx
└── Uses: ReCaptchaAuthForm
    ├── Supabase Auth UI Component
    └── ReCaptchaWrapper (displays reCAPTCHA)
```

---

## Authentication Flow Breakdown

### **Flow 1: Email/Password Sign-In**

#### **Step-by-Step Process:**

1. **User visits `/api/auth/login`**
   - `LoginPage` component renders
   - Checks if user is already authenticated
   - If authenticated → redirects to profile
   - If not → shows login form

2. **Login Form Display**
   - Uses `ReCaptchaAuthForm` component
   - Renders Supabase's built-in `Auth` component
   - Shows email/password fields
   - Displays reCAPTCHA widget below form

3. **User Submits Credentials**
   - User enters email/password
   - User completes reCAPTCHA (if displayed)
   - Clicks "Sign In"

4. **Authentication Request**
   ```typescript
   // In authStore.ts
   signIn: async ({ email, password }) => {
     return supabase.auth.signInWithPassword({ email, password })
   }
   ```
   - **⚠️ ISSUE:** reCAPTCHA token is NOT sent with this request
   - Supabase handles password validation
   - Returns session if credentials are valid

5. **Session Creation**
   - Supabase creates a session
   - Stores session in browser (cookies/localStorage)
   - Triggers auth state change listener

6. **Profile Fetch**
   ```typescript
   // In authStore.ts - onAuthStateChange listener
   if (session?.user) {
     // Fetch user profile from 'profiles' table
     const { data: profile } = await supabase
       .from('profiles')
       .select('*')
       .eq('id', session.user.id)
       .single()
   }
   ```

7. **Redirect**
   - User is redirected to `/profile` (or `redirectUrl` if specified)
   - Auth state is now available throughout the app via `useAuthStore()`

---

### **Flow 2: Email/Password Registration**

#### **Step-by-Step Process:**

1. **User visits `/api/auth/register`**
   - `RegisterPage` component renders
   - Shows registration form

2. **Registration Form**
   - Uses `ReCaptchaAuthForm` component
   - Fields: username, email, password, confirm password, terms checkbox
   - Shows reCAPTCHA widget

3. **User Submits Registration**
   ```typescript
   // In authStore.ts
   signUp: async ({ email, password, username }) => {
     return supabase.auth.signUp({ 
       email, 
       password,
       options: {
         data: {
           preferred_username: username
         }
       }
     })
   }
   ```
   - **⚠️ ISSUE:** reCAPTCHA token is NOT validated
   - Supabase creates user account
   - Sends confirmation email (if email confirmation is enabled)

4. **Email Confirmation**
   - User receives email with confirmation link
   - Clicks link → redirects to callback route
   - Account is activated

5. **Profile Creation**
   - After signup, a profile record should be created in the `profiles` table
   - This may be handled by a database trigger or needs to be implemented

---

### **Flow 3: OAuth (Google/Facebook)**

#### **Step-by-Step Process:**

1. **User Clicks OAuth Button**
   - Supabase Auth UI shows "Sign in with Google" button
   - User clicks button

2. **OAuth Redirect**
   ```typescript
   redirectTo={`${window.location.origin}/api/auth/callback`}
   ```
   - User is redirected to Google/Facebook login
   - After authentication, OAuth provider redirects back

3. **Callback Handler** (`/api/auth/callback/route.ts`)
   ```typescript
   // Extracts authorization code from URL
   const code = requestUrl.searchParams.get('code')
   
   // Exchanges code for session
   const { data, error } = await supabase.auth.exchangeCodeForSession(code)
   
   // Sets auth cookie
   response.cookies.set('supabase-auth-token', ...)
   ```

4. **Session Established**
   - Session is created
   - User is redirected to home/profile
   - Profile is fetched automatically

---

## reCAPTCHA Integration - Current State

### **How reCAPTCHA is Currently Implemented:**

1. **reCAPTCHA Script Loading**
   ```html
   <!-- In src/app/layout.tsx -->
   <script src="https://www.google.com/recaptcha/api.js" async defer></script>
   ```
   - Loaded globally in the root layout
   - Available as `window.grecaptcha`

2. **ReCaptchaWrapper Component**
   ```typescript
   // src/components/auth/ReCaptchaWrapper.tsx
   useEffect(() => {
     if (window.grecaptcha && recaptchaRef.current) {
       grecaptcha.render(recaptchaRef.current, {
         sitekey: '6Ld8JZIrAAAAAJg5i9GqRmopMxOf0tgcmloL6xiJ',
         callback: (token) => onVerify(token),
         'expired-callback': () => onExpired()
       })
     }
   }, [])
   ```
   - Renders reCAPTCHA widget
   - Calls `onVerify(token)` when user completes challenge
   - Calls `onExpired()` when token expires

3. **ReCaptchaAuthForm Component**
   ```typescript
   const [recaptchaToken, setRecaptchaToken] = useState('')
   const [isRecaptchaVerified, setIsRecaptchaVerified] = useState(false)
   
   const handleRecaptchaVerify = (token: string) => {
     setRecaptchaToken(token)
     setIsRecaptchaVerified(true)
   }
   ```
   - Stores the reCAPTCHA token in state
   - Shows "✅ reCAPTCHA verified" message
   - **BUT:** Token is never used!

---

## ⚠️ **Critical Issues with Current Implementation**

### **Issue 1: reCAPTCHA Token Not Validated**

**Problem:**
- The reCAPTCHA token is captured and stored in component state
- **But it's never sent to the backend or validated**
- Authentication proceeds regardless of reCAPTCHA completion
- This means reCAPTCHA is essentially **cosmetic only** - it doesn't actually protect against bots

**Current Code:**
```typescript
// Token is captured but never used
const [recaptchaToken, setRecaptchaToken] = useState('')

// Sign-in happens without token validation
signIn: async ({ email, password }) => {
  return supabase.auth.signInWithPassword({ email, password })
  // ❌ No reCAPTCHA token sent here
}
```

### **Issue 2: No Backend Validation**

**Problem:**
- There's no backend API endpoint to verify the reCAPTCHA token
- Even if token was sent, there's no server-side validation
- Google's reCAPTCHA requires server-side verification for security

**What's Missing:**
```typescript
// This should exist but doesn't:
// POST /api/auth/verify-recaptcha
// Validates token with Google's API
```

### **Issue 3: Supabase Auth UI Bypasses reCAPTCHA**

**Problem:**
- The `ReCaptchaAuthForm` uses Supabase's built-in `Auth` component
- This component handles form submission internally
- The reCAPTCHA is displayed separately and not integrated into the auth flow
- Users can submit the form without completing reCAPTCHA

---

## How It Should Work (Proper Implementation)

### **Correct Flow:**

1. **User completes reCAPTCHA**
   - Token is generated: `"03AGdBq24..."`

2. **Form Submission**
   ```typescript
   // Should include token
   const response = await fetch('/api/auth/verify-recaptcha', {
     method: 'POST',
     body: JSON.stringify({ token: recaptchaToken })
   })
   
   if (!response.ok) {
     throw new Error('reCAPTCHA verification failed')
   }
   ```

3. **Backend Validation**
   ```typescript
   // Backend API route
   const verifyResponse = await fetch(
     `https://www.google.com/recaptcha/api/siteverify?secret=${SECRET_KEY}&response=${token}`,
     { method: 'POST' }
   )
   
   const data = await verifyResponse.json()
   if (!data.success) {
     return NextResponse.json({ error: 'Invalid reCAPTCHA' }, { status: 400 })
   }
   ```

4. **Then Proceed with Auth**
   - Only after reCAPTCHA validation succeeds
   - Proceed with Supabase authentication

---

## Alternative: Supabase Built-in Protection

**Note:** Supabase has built-in bot protection that doesn't require reCAPTCHA:
- Rate limiting
- IP-based blocking
- Suspicious activity detection

**If you want to keep reCAPTCHA:**
- Need to implement proper server-side validation
- Integrate token into auth flow
- Block form submission until verified

**If you want to remove reCAPTCHA:**
- Remove `ReCaptchaWrapper` component
- Remove reCAPTCHA script from layout
- Rely on Supabase's built-in protection

---

## Current Authentication State Management

### **Zustand Store (`authStore.ts`)**

```typescript
interface AuthState {
  user: User | null           // Supabase user object
  profile: Profile | null      // Custom profile from 'profiles' table
  loading: boolean            // Initial loading state
  initialized: boolean        // Whether auth has been initialized
  initialize: () => Promise<void>
  signIn: (credentials) => Promise<{data, error}>
  signUp: (credentials) => Promise<{data, error}>
  signOut: () => Promise<{error}>
  refreshProfile: () => Promise<void>
}
```

### **How State is Managed:**

1. **Initialization**
   - `initialize()` is called when app loads
   - Checks for existing session
   - Sets up auth state change listener
   - Fetches user profile if session exists

2. **Auth State Listener**
   ```typescript
   supabase.auth.onAuthStateChange(async (event, session) => {
     set({ user: session?.user || null })
     // Automatically fetches profile when user changes
   })
   ```
   - Listens for login/logout events
   - Automatically updates user state
   - Fetches profile when user logs in

3. **Profile Management**
   - Profile is separate from Supabase user
   - Stored in custom `profiles` table
   - Contains: username, full_name, avatar_url, bio, location
   - Fetched after authentication

---

## Protected Routes

### **How Routes are Protected:**

1. **Client-Side Protection**
   ```typescript
   // In pages that require auth
   useEffect(() => {
     if (!authLoading && !user) {
       router.push('/api/auth/login?redirectUrl=/locator')
     }
   }, [user, authLoading, router])
   ```

2. **Server-Side Protection** (if needed)
   - Can use middleware.ts
   - Check for session cookie
   - Redirect if not authenticated

---

## Summary

### **What Works:**
✅ Email/password authentication  
✅ OAuth (Google, Facebook)  
✅ Session management  
✅ Profile fetching  
✅ Protected routes (client-side)  
✅ Auth state management with Zustand  

### **What Doesn't Work Properly:**
❌ reCAPTCHA validation (token captured but never verified)  
❌ Server-side reCAPTCHA verification  
❌ Integration of reCAPTCHA into auth flow  

### **Recommendation:**
1. **Option A:** Remove reCAPTCHA and rely on Supabase's built-in protection
2. **Option B:** Implement proper reCAPTCHA validation:
   - Create backend API endpoint
   - Verify token with Google before auth
   - Block form submission until verified
   - Add token to auth requests

The current implementation shows reCAPTCHA to users but doesn't actually use it for security, which could be misleading.
