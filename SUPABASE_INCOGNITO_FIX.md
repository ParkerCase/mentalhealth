# Fix Supabase Auth in Incognito Mode

## Supabase Auth DOES Work in Incognito

Supabase authentication works perfectly fine in incognito mode. The issue is likely one of these:

1. **CAPTCHA failing** (most likely) - Even if domains are whitelisted, there might be a configuration issue
2. **Redirect URLs not configured** in Supabase Dashboard
3. **Site URL mismatch** in Supabase settings

## Step 1: Check Supabase Redirect URLs

Go to **Supabase Dashboard → Authentication → URL Configuration**:

### Required Settings:

1. **Site URL:**
   - Production: `https://sedivinemasculine.com`
   - Or your Vercel URL: `https://your-app.vercel.app`

2. **Redirect URLs** (add ALL of these):
   ```
   https://sedivinemasculine.com/**
   https://sedivinemasculine.com/api/auth/callback
   https://*.vercel.app/api/auth/callback
   http://localhost:3000/api/auth/callback
   http://localhost:3000/**
   ```

3. **Additional Redirect URLs:**
   - Add any other domains where your app is accessed
   - Include mobile app URLs if applicable

## Step 2: Verify CAPTCHA Configuration

Even if domains are whitelisted in Turnstile, check:

1. **In Supabase Dashboard → Authentication → Attack Protection:**
   - CAPTCHA protection: **ON**
   - Provider: **Turnstile**
   - Secret Key: Should match your Cloudflare Turnstile secret key

2. **In Cloudflare Turnstile:**
   - Verify the Secret Key matches what's in Supabase
   - Check that ALL domains are whitelisted (including subdomains)
   - Make sure the site is **Active** (not paused)

## Step 3: Test Without CAPTCHA (Temporary)

To isolate if it's a CAPTCHA issue:

1. **Temporarily disable CAPTCHA:**
   - Supabase Dashboard → Authentication → Attack Protection
   - Toggle "CAPTCHA protection" to **OFF**
   - Try signing in from incognito
   - If it works → CAPTCHA is the issue
   - If it doesn't → It's a redirect URL issue

## Step 4: Check Browser Console

Open browser console (F12) in incognito mode and look for:
- CAPTCHA errors
- Network errors (401, 403)
- CORS errors
- Redirect errors

## Common Issues:

### Issue 1: Redirect URL Mismatch
**Error:** `redirect_to url must have authorized url`
**Fix:** Add the exact URL to Supabase redirect URLs list

### Issue 2: CAPTCHA Domain Not Whitelisted
**Error:** `captcha verification process failed`
**Fix:** Add domain to Cloudflare Turnstile allowed domains

### Issue 3: Site URL Mismatch
**Error:** Authentication works but redirects fail
**Fix:** Update Site URL in Supabase to match your production domain

## Quick Test:

1. Open incognito window
2. Go to your login page
3. Open browser console (F12)
4. Try to sign in
5. Check console for errors
6. Check Network tab for failed requests

The error message will tell you exactly what's wrong!
