# Vercel Deployment Fix Guide

## Issue: Vercel not auto-deploying from GitHub

If Vercel stopped auto-deploying due to too many deployments or webhook issues, here are solutions:

## Solution 1: Reconnect GitHub Integration (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Git**
4. Click **Disconnect** (if connected) or **Connect Git Repository**
5. Reconnect to your GitHub repository
6. Ensure **Production Branch** is set to `main`
7. Save changes

This will recreate the webhook and should restore auto-deployments.

## Solution 2: Manual Deployment via Vercel CLI

If you have Vercel CLI installed:

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project directory
cd /Users/parkercase/mentalhealthsm
vercel --prod
```

## Solution 3: Manual Deployment via Vercel Dashboard

1. Go to your project in Vercel Dashboard
2. Click **Deployments** tab
3. Click **Redeploy** on the latest deployment
4. Or click **Deploy** → **Deploy Git Repository** → Select your repo and branch

## Solution 4: Check GitHub Webhook

1. Go to your GitHub repository: `https://github.com/ParkerCase/mentalhealth`
2. Go to **Settings** → **Webhooks**
3. Look for Vercel webhook (should have `vercel.com` in URL)
4. If missing or shows errors, you may need to reconnect in Vercel (Solution 1)

## Solution 5: Rate Limiting

If you hit GitHub API rate limits:
- Wait 1 hour and try again
- Or use Vercel CLI for manual deployments (Solution 2)

## Quick Fix: Force Deployment

The empty commit we just pushed should trigger a deployment. If it didn't:

1. Check Vercel Dashboard → Deployments tab
2. Look for any failed deployments
3. If you see errors, fix them and redeploy manually

## Current Status

- ✅ All code changes are committed and pushed to `main` branch
- ✅ Latest commit: `7a07aaf` - "Trigger Vercel deployment"
- ⚠️ Vercel auto-deployment may need reconnection

## Next Steps

1. Try Solution 1 first (reconnect GitHub in Vercel)
2. If that doesn't work, use Solution 2 (Vercel CLI)
3. As a last resort, use Solution 3 (manual dashboard deployment)
