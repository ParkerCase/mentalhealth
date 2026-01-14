# Supabase Email Not Sending - Troubleshooting Guide

## Problem
After signing up, users are told to "check their email" but no email is received.

## Common Causes & Solutions

### 1. **Email Confirmation is Disabled**
Supabase might have email confirmation disabled, which means users are auto-confirmed but no email is sent.

**Check:**
- Go to **Supabase Dashboard → Authentication → Settings**
- Look for **"Enable email confirmations"** toggle
- If **OFF**: Users are auto-confirmed (no email sent)
- If **ON**: Emails should be sent

**Solution:**
- If you want emails: Turn **ON** "Enable email confirmations"
- If you don't need emails: Keep it **OFF** and users can sign in immediately

### 2. **Email Provider Not Configured**
Supabase needs an email provider to send emails.

**Check:**
- Go to **Supabase Dashboard → Settings → Auth → SMTP Settings**
- Check if **"Custom SMTP"** is enabled
- If not configured, Supabase uses default email service (limited)

**Solution:**
- **Option A**: Use Supabase's default email (limited, but works)
  - No configuration needed
  - Limited emails per month
  - May go to spam
  
- **Option B**: Configure Resend SMTP (Recommended)
  - Go to **Resend Dashboard → Settings → SMTP**
  - Get SMTP credentials
  - In Supabase: **Settings → Auth → SMTP Settings**
  - Enable **"Custom SMTP"**
  - Enter:
    ```
    Host: smtp.resend.com
    Port: 587
    Username: resend
    Password: [Your Resend API Key]
    Sender email: noreply@arisedivinemasculine.com
    Sender name: AriseDivineMasculine
    ```

### 3. **Email in Spam Folder**
Check spam/junk folder - Supabase emails often end up there.

### 4. **Email Sending Limits**
Free tier Supabase has email sending limits.

**Check:**
- Go to **Supabase Dashboard → Settings → Billing**
- Check if you've hit email sending limits

### 5. **Email Templates Not Configured**
Supabase needs email templates to send confirmation emails.

**Check:**
- Go to **Supabase Dashboard → Authentication → Email Templates**
- Check if **"Confirm signup"** template exists
- Verify template has `{{ .ConfirmationURL }}` variable

**Solution:**
- If template is missing, Supabase will use default template
- You can customize templates here

### 6. **Site URL Not Configured**
Supabase needs the correct Site URL for email links.

**Check:**
- Go to **Supabase Dashboard → Settings → Auth → URL Configuration**
- **Site URL** should be: `https://arisedivinemasculine.com`
- **Redirect URLs** should include:
  - `https://arisedivinemasculine.com/api/auth/callback`
  - `http://localhost:3000/api/auth/callback` (for local dev)

## Quick Fix: Disable Email Confirmation (For Testing)

If you want users to sign in immediately without email confirmation:

1. **Supabase Dashboard → Authentication → Settings**
2. Turn **OFF** "Enable email confirmations"
3. Users can now sign in immediately after sign-up

**Note:** This is less secure but useful for testing or if you don't need email verification.

## Recommended Configuration

For production with email confirmation:

1. ✅ **Enable email confirmations** - ON
2. ✅ **Configure SMTP** - Use Resend or Supabase email
3. ✅ **Set Site URL** - `https://arisedivinemasculine.com`
4. ✅ **Add redirect URLs** - Include all domains where app is accessed
5. ✅ **Test email sending** - Use Supabase's test email feature

## Testing Email Sending

1. **Supabase Dashboard → Authentication → Email Templates**
2. Click **"Send test email"**
3. Enter your email address
4. Check if email arrives

If test email doesn't arrive:
- Check spam folder
- Verify SMTP settings
- Check email sending limits
- Verify sender email is correct

## Debugging Steps

1. **Check Supabase Logs:**
   - Go to **Supabase Dashboard → Logs → Auth Logs**
   - Look for email sending errors
   - Check for rate limiting messages

2. **Check Browser Console:**
   - Open browser console (F12)
   - Look for errors during sign-up
   - Check network tab for failed requests

3. **Check Supabase Auth Users:**
   - Go to **Supabase Dashboard → Authentication → Users**
   - Find the user who signed up
   - Check if `email_confirmed_at` is null
   - If null, email confirmation is required
   - If not null, user is already confirmed

## Current Status Check

To check your current Supabase email configuration:

1. **Authentication → Settings:**
   - [ ] "Enable email confirmations" - ON/OFF?
   - [ ] "Enable email change" - ON/OFF?

2. **Settings → Auth → SMTP Settings:**
   - [ ] Custom SMTP enabled?
   - [ ] SMTP credentials configured?

3. **Settings → Auth → URL Configuration:**
   - [ ] Site URL set correctly?
   - [ ] Redirect URLs include all domains?

4. **Authentication → Email Templates:**
   - [ ] "Confirm signup" template exists?
   - [ ] Template has confirmation URL variable?

## Next Steps

1. Check Supabase Dashboard settings (see above)
2. If email confirmation is OFF: Users can sign in immediately
3. If email confirmation is ON: Configure email provider
4. Test email sending using Supabase's test feature
5. Check spam folder if emails are sent but not received
