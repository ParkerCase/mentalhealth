# Fix Turnstile CAPTCHA Domain Whitelist Issue

## Problem
You're seeing "captcha verification process failed" errors on mobile and incognito mode. This is because **Cloudflare Turnstile requires your domains to be whitelisted**.

## Solution: Whitelist Your Domains in Cloudflare Turnstile

### Step 1: Go to Cloudflare Dashboard
1. Log into your Cloudflare account
2. Navigate to **Turnstile** section
3. Find your site (the one with Site Key: `0x4AAAAAACMWFXWUf25tGMHf`)

### Step 2: Add Allowed Domains
In your Turnstile site settings, you need to add **ALL** domains where your app will be accessed:

**Add these domains:**
- `arisedivinemasculine.com` (your production domain)
- `*.arisedivinemasculine.com` (wildcard for all subdomains)
- `localhost` (for local development)
- `127.0.0.1` (for local development)
- `*.vercel.app` (if you're using Vercel preview deployments)
- Your specific Vercel deployment URL (e.g., `your-app.vercel.app`)

### Step 3: Save Settings
After adding all domains, save the settings. Changes may take a few minutes to propagate.

## Alternative: Temporarily Disable CAPTCHA (For Testing)

If you need to test authentication while fixing the domain issue:

1. **In Supabase Dashboard:**
   - Go to **Authentication → Attack Protection**
   - Toggle **CAPTCHA protection** to **OFF** temporarily
   - This will allow sign-ins without CAPTCHA verification

2. **Re-enable after fixing:**
   - Once domains are whitelisted, turn CAPTCHA back **ON**

## Why This Happens

Turnstile validates that requests come from whitelisted domains to prevent abuse. When you access from:
- Mobile devices
- Incognito mode
- Different domains/subdomains
- Local development

...if those domains aren't whitelisted, Turnstile will reject the CAPTCHA verification.

## Quick Test

After whitelisting domains:
1. Try signing in from your production domain
2. Try signing in from mobile
3. Try signing in from incognito mode

All should work once domains are properly configured.
