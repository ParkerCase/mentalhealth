# Supabase Built-in CAPTCHA Setup Guide

## ✅ **YES - Switch to Supabase's Built-in CAPTCHA**

**Why this is better:**
- ✅ Server-side validated automatically
- ✅ Integrated directly into Supabase Auth
- ✅ Works with ALL auth methods (email, OAuth, magic links)
- ✅ No custom code needed
- ✅ Better security (validated on Supabase's servers)
- ✅ Less maintenance
- ✅ Free (included with Supabase)

---

## Step 1: Configure Supabase Attack Protection Settings

### **In Supabase Dashboard → Authentication → Attack Protection:**

#### **Setting 1: Enable Captcha protection**
- **Toggle:** Turn **ON** ✅
- **Description:** "Protect authentication endpoints from bots and abuse"
- **What it does:**
  - Automatically shows CAPTCHA on sign-in/sign-up attempts
  - Validates server-side before authentication proceeds
  - Works with email/password, OAuth, and magic links
  - Uses Google's reCAPTCHA v3 (invisible) or v2 (challenge) based on risk

#### **Setting 2: Prevent use of leaked passwords**
- **Status:** Currently shows "DISABLED"
- **Action:** Click **"Configure email provider"** button first
- **What it does:**
  - Checks passwords against databases of leaked passwords
  - Rejects common/weak passwords
  - Protects against credential stuffing attacks

---

## Step 2: Configure Email Provider (Required for Leaked Passwords)

### **Why you need this:**
- Supabase needs to send emails (confirmation, password reset, etc.)
- The "Prevent use of leaked passwords" feature requires email provider setup

### **Options:**

#### **Option A: Use Supabase's Default Email (Easiest)**
1. Go to **Settings → Auth → Email Templates**
2. Supabase provides default email sending (limited)
3. **Pros:** Quick setup, no configuration
4. **Cons:** Limited emails per month, "Sent by Supabase" branding

#### **Option B: Configure Custom SMTP (Recommended for Production)**

Since you're already using **Resend** for contact forms, you can configure Resend as Supabase's email provider:

1. **Get Resend SMTP credentials:**
   - Go to Resend Dashboard → Settings → SMTP
   - Or use Resend API (they provide SMTP settings)

2. **In Supabase Dashboard:**
   - Go to **Settings → Auth → SMTP Settings**
   - Enable **"Custom SMTP"**
   - Enter Resend SMTP credentials:
     ```
     Host: smtp.resend.com
     Port: 587 (or 465 for SSL)
     Username: resend
     Password: [Your Resend API Key]
     Sender email: noreply@arisedivinemasculine.com
     Sender name: AriseDivineMasculine
     ```

3. **Test the connection:**
   - Supabase will send a test email
   - Verify it arrives

#### **Option C: Use Supabase's Email Service (Recommended)**
- Supabase has built-in email service
- Just need to verify your domain
- More reliable than custom SMTP
- Better deliverability

---

## Step 3: Recommended Settings

### **Once Email Provider is Configured:**

1. **Enable Captcha protection:** ✅ **ON**
   - This is the main protection

2. **Prevent use of leaked passwords:** ✅ **ENABLE**
   - After email provider is configured
   - This adds an extra layer of security

3. **Save changes** ✅

---

## Step 4: Remove Old reCAPTCHA Code

Once Supabase CAPTCHA is enabled, you should remove the custom reCAPTCHA implementation:

### **Files to Update:**

1. **Remove reCAPTCHA script from layout:**
   ```typescript
   // src/app/layout.tsx
   // REMOVE this line:
   <script src="https://www.google.com/recaptcha/api.js" async defer></script>
   ```

2. **Replace ReCaptchaAuthForm with AuthUI:**
   ```typescript
   // src/app/api/auth/login/page.tsx
   // CHANGE FROM:
   import ReCaptchaAuthForm from '@/components/auth/ReCaptchaAuthForm'
   <ReCaptchaAuthForm view="sign_in" redirectTo={redirectUrl} />
   
   // TO:
   import AuthUI from '@/components/auth/AuthUI'
   <AuthUI view="sign_in" redirectTo={redirectUrl} />
   ```

   ```typescript
   // src/app/api/auth/register/page.tsx
   // SAME CHANGE:
   import AuthUI from '@/components/auth/AuthUI'
   <AuthUI view="sign_up" redirectTo="/profile" />
   ```

3. **Optional: Delete unused components:**
   - `src/components/auth/ReCaptchaAuthForm.tsx` (can delete)
   - `src/components/auth/ReCaptchaWrapper.tsx` (can delete)
   - Remove `react-google-recaptcha` from package.json (optional)

---

## Step 5: Test the New Flow

### **Test Sign-Up:**
1. Go to `/api/auth/register`
2. Try to register a new account
3. **Expected:** Supabase's CAPTCHA should appear automatically
4. Complete CAPTCHA
5. Submit form
6. Should work seamlessly

### **Test Sign-In:**
1. Go to `/api/auth/login`
2. Enter credentials
3. **Expected:** CAPTCHA may appear (if risk detected) or be invisible (reCAPTCHA v3)
4. Should authenticate successfully

### **Test Leaked Password:**
1. Try to register with password: `password123`
2. **Expected:** Should be rejected if it's in leaked password database
3. Try with a strong, unique password
4. Should work

---

## How Supabase CAPTCHA Works

### **reCAPTCHA v3 (Invisible):**
- Runs in background
- Scores user behavior (0.0 = bot, 1.0 = human)
- Only shows challenge if score is low
- Most users won't see anything

### **reCAPTCHA v2 (Challenge):**
- Shows "I'm not a robot" checkbox
- May require image selection
- Used when risk is detected

### **Automatic Triggers:**
- Multiple failed login attempts
- Unusual traffic patterns
- Suspicious behavior
- Rate limiting violations

---

## Benefits Over Custom Implementation

| Feature | Custom reCAPTCHA | Supabase Built-in |
|---------|----------------|------------------|
| Server Validation | ❌ Not implemented | ✅ Automatic |
| Works with OAuth | ❌ No | ✅ Yes |
| Works with Magic Links | ❌ No | ✅ Yes |
| Risk-based Triggering | ❌ Always shows | ✅ Smart detection |
| Maintenance | ❌ Manual | ✅ Automatic |
| Code Complexity | ❌ High | ✅ Zero |

---

## Migration Checklist

- [ ] Enable "Captcha protection" in Supabase Dashboard
- [ ] Configure email provider (SMTP or Supabase email)
- [ ] Enable "Prevent use of leaked passwords"
- [ ] Save changes in Supabase
- [ ] Remove reCAPTCHA script from `src/app/layout.tsx`
- [ ] Replace `ReCaptchaAuthForm` with `AuthUI` in login page
- [ ] Replace `ReCaptchaAuthForm` with `AuthUI` in register page
- [ ] Test sign-up flow
- [ ] Test sign-in flow
- [ ] Test OAuth flow
- [ ] Verify CAPTCHA appears when needed
- [ ] (Optional) Delete unused reCAPTCHA components
- [ ] (Optional) Remove `react-google-recaptcha` dependency

---

## Important Notes

1. **No Code Changes Needed for CAPTCHA:**
   - Supabase handles everything automatically
   - Your existing auth code will work as-is
   - CAPTCHA appears automatically when needed

2. **Email Provider is Required:**
   - For "Prevent use of leaked passwords" to work
   - For email confirmations
   - For password resets

3. **Backward Compatible:**
   - Existing users won't be affected
   - New sign-ups will see CAPTCHA
   - OAuth flows work seamlessly

4. **Rate Limiting:**
   - Supabase also has built-in rate limiting
   - Works alongside CAPTCHA
   - Protects against brute force attacks

---

## Troubleshooting

### **CAPTCHA not appearing:**
- Check that it's enabled in Supabase Dashboard
- Clear browser cache
- Try in incognito mode
- Check browser console for errors

### **Email provider issues:**
- Verify SMTP credentials are correct
- Test email sending in Supabase Dashboard
- Check Resend API key is valid
- Verify sender email is verified in Resend

### **Leaked passwords not working:**
- Ensure email provider is configured
- Feature may take a few minutes to activate
- Check Supabase logs for errors

---

## Summary

**Recommended Configuration:**
1. ✅ **Enable Captcha protection** - ON
2. ✅ **Prevent use of leaked passwords** - ENABLE (after email setup)
3. ✅ **Configure email provider** - Use Resend SMTP or Supabase email
4. ✅ **Remove custom reCAPTCHA code** - Use `AuthUI` component instead

This gives you:
- Better security
- Less code to maintain
- Automatic protection
- Works with all auth methods
