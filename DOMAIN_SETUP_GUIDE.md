# Domain Setup Guide: dilwalehouston.com

## Overview

This guide explains how to set up custom domains for your party app with separate URLs for guests and admin.

## Domain Structure

- **Guests**: `dilwalehouston.com` → Auto-redirects to Friendsgiving party
- **Admin (Host)**: `admin.dilwalehouston.com` → Full app with host dashboard
- **Backend**: Supabase (already in cloud)

---

## Step 1: Configure DNS Records

Go to your domain registrar (GoDaddy, Namecheap, etc.) and add these DNS records:

### Main Domain (for guests)

```
Type: A
Name: @
Value: 185.199.108.153

Type: A
Name: @
Value: 185.199.109.153

Type: A
Name: @
Value: 185.199.110.153

Type: A
Name: @
Value: 185.199.111.153

Type: CNAME
Name: www
Value: vajih.github.io
```

### Admin Subdomain (for you)

```
Type: CNAME
Name: admin
Value: vajih.github.io
```

**DNS Propagation**: Takes 24-48 hours to propagate globally.

---

## Step 2: Configure GitHub Pages

1. Go to: https://github.com/vajih/party/settings/pages

2. Under **Custom domain**, enter: `dilwalehouston.com`

3. Click **Save**

4. Wait for DNS check to complete (green checkmark)

5. Check **Enforce HTTPS** (after DNS propagates)

GitHub will create a `CNAME` file in your repo automatically.

---

## Step 3: Configure Supabase

1. Go to: https://supabase.com → Your Project → Authentication → URL Configuration

2. **Update Site URL**:

   ```
   https://dilwalehouston.com
   ```

3. **Add Redirect URLs** (whitelist these):

   ```
   https://dilwalehouston.com/**
   https://www.dilwalehouston.com/**
   https://admin.dilwalehouston.com/**
   https://vajih.github.io/party/**
   ```

4. Click **Save**

**Important**: Magic link emails will now use `dilwalehouston.com` domain!

---

## Step 4: Test the Setup

### For Guests:

1. Open browser (incognito/private mode)
2. Visit: `dilwalehouston.com`
3. Should auto-redirect to: `dilwalehouston.com/#/party/friendsgiving2025-1ty7`
4. See party sign-up page

### For You (Host):

1. Open browser
2. Visit: `admin.dilwalehouston.com`
3. Log in with your admin account
4. See full host dashboard with all controls

---

## URLs to Share with Guests

### Primary URL (recommended):

```
dilwalehouston.com
```

### Alternative (direct to party):

```
dilwalehouston.com/#/party/friendsgiving2025-1ty7
```

### Landing page (if using):

```
dilwalehouston.com/friendsgiving.html
```

---

## URLs for You (Host)

### Admin Dashboard:

```
admin.dilwalehouston.com
```

### Backup (GitHub Pages):

```
vajih.github.io/party
```

---

## How It Works

### Code Logic (in `src/main.js`):

```javascript
// Detects if user is on main domain (dilwalehouston.com)
const isMainDomain =
  hostname === "dilwalehouston.com" || hostname === "www.dilwalehouston.com";

// Detects if user is on admin subdomain
const isAdminSubdomain = hostname === "admin.dilwalehouston.com";

// If main domain with no hash → redirect to party
if (isMainDomain && isRootPath && hasNoHash) {
  window.location.href = "/#/party/friendsgiving2025-1ty7";
}

// If admin subdomain → full app access (no redirect)
```

---

## Troubleshooting

### DNS not working?

- Check DNS propagation: https://www.whatsmydns.net/
- Wait 24-48 hours for full propagation
- Clear browser cache

### GitHub Pages not loading?

- Verify CNAME file exists in repo root
- Check Settings → Pages shows green checkmark
- Try accessing via HTTPS (not HTTP)

### Magic links going to wrong domain?

- Double-check Supabase Site URL setting
- Verify redirect URLs are whitelisted
- Log out and request new magic link

### Admin subdomain not working?

- Verify CNAME record: `admin` → `vajih.github.io`
- Check DNS propagation
- Add `admin.dilwalehouston.com/**` to Supabase redirect URLs

---

## Security Notes

1. **HTTPS Required**: Always use HTTPS (enforced by GitHub Pages)
2. **Supabase RLS**: Already configured for row-level security
3. **Admin Access**: Only authenticated hosts can access dashboard
4. **Guest Access**: Anyone with link can join party (by design)

---

## Multiple Parties

To create different parties with different domains:

1. Register another domain (e.g., `newparty.com`)
2. Follow same DNS setup
3. Update party slug in redirect: `/#/party/YOUR_PARTY_SLUG`
4. Update Supabase allowed URLs

---

## Questions?

- Check GitHub repo: https://github.com/vajih/party
- Supabase docs: https://supabase.com/docs
- GitHub Pages docs: https://docs.github.com/en/pages
