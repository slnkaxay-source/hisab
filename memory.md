# Hisab - Complete Project Memory

## Project Info
- Name: Hisab (Personal Debt/Udhari Manager)
- Repo: https://github.com/slnkaxay-source/hisab (PUBLIC)
- Live: https://slnkaxay-source.github.io/hisab/
- Stack: Vanilla JS ES6 Modules + Supabase (Auth, PostgreSQL) + GitHub Pages
- Email: Maileroo (SMTP for auth emails + API for app emails - NOT YET configured)

## Architecture

### Frontend Files
```
/ (root - GitHub Pages root)
├── index.html              # Landing page (hero, features, faq, contact)
├── login.html              # Login form
├── signup.html             # Signup form with password strength
├── forgot-password.html    # Forgot password flow
├── verify-otp.html         # OTP verification (8-digit)
├── dashboard.html          # App shell (sidebar + bottom nav + content area)
├── src/
│   ├── css/
│   │   ├── style.css       # Global styles, vars, utilities, toasts, modals
│   │   ├── landing.css     # Landing page specific styles
│   │   ├── auth.css        # Auth pages styles + OTP input
│   │   └── dashboard.css   # Dashboard/app layout styles
│   └── js/
│       ├── config.js       # SUPABASE_URL + SUPABASE_ANON_KEY
│       ├── landing.js      # Scroll animations, FAQ accordion, mobile nav
│       ├── api/
│       │   ├── supabase.js    # Init supabase client from window.supabase
│       │   ├── auth.js        # signUp, signIn, signOut, getSession, etc.
│       │   ├── profiles.js    # getProfile, updateProfile, getProfileByEmail (uses RPC)
│       │   ├── debtRequests.js # CRUD for debt_requests
│       │   ├── contacts.js    # CRUD for contacts
│       │   └── notifications.js # Get/mark notifications
│       ├── pages/
│       │   ├── dashboard.js   # Main controller: auth check, nav, render functions
│       │   ├── friends.js     # Add/search/delete with registered badge
│       │   ├── requests.js    # Create/sent/received tabs, accept/reject
│       │   ├── notifications.js # Notification center with mark read
│       │   ├── profile.js     # View/edit name, logout
│       │   ├── login.js       # Login form handler
│       │   ├── signup.js      # Signup with validation
│       │   ├── forgotPassword.js # Forgot password handler
│       │   └── verifyOtp.js   # 8-digit OTP verification
│       └── utils/
│           ├── helpers.js     # formatCurrency, formatDate, validateEmail, etc.
│           ├── ui.js          # showToast, showConfirmDialog, showLoading
│           └── router.js      # SPA router (NOT USED currently)
```

### Database (Supabase PostgreSQL)
Tables:
- profiles (id, full_name, email, avatar_url, created_at, updated_at)
- contacts (id, user_id, name, email, phone, is_registered, created_at, updated_at) UNIQUE(user_id, email)
- debt_requests (id, sender_id, receiver_id, receiver_email, amount, reason, note, due_date, status, is_registered, created_at, updated_at)
- notifications (id, user_id, type, title, message, debt_request_id, is_read, created_at)

Functions:
- handle_new_user() - trigger on auth.users insert -> creates profile
- update_timestamp() - trigger on update for all tables
- notify_debt_request() - trigger on debt_request insert -> creates notification for receiver
- notify_debt_response() - trigger on debt_request status update (accepted/rejected) -> creates notification for sender
- lookup_user_by_email(text) - RPC function (SECURITY DEFINER) to look up users by email, bypasses RLS for email checks

RLS Policies:
- profiles: SELECT/UPDATE/INSERT own only
- contacts: SELECT/INSERT/UPDATE/DELETE own only
- debt_requests: SELECT (own sent or received), INSERT (own sent), UPDATE (if sender or receiver)
- notifications: SELECT/INSERT/UPDATE own only

### Supabase Project
- URL: https://gudpgpaygwdccducbdnu.supabase.co
- Anon Key: set in config.js
- Tables applied? YES (via supabase db push)
- Migrations applied: 2 (remote_commit + lookup_function)

### Maileroo (Email Service)
- Domain: hisab.maileroo.app
- API Key: 3daceb6ef627f5e0a39b7a09e509a2adb1cd7ca9c2823e0c5e24ef6d46a249c6
- SMTP: hello@hisab.maileroo.app / password: 1b905ed469e379009d8fb5e1
- SMTP Host: smtp.maileroo.app (NOT hisab.maileroo.app)
- SMTP Port: 587 (NOT 585)
- STATUS: NOT configured (user was configuring, likely turned off SMTP)
- Currently using Supabase default email service for auth emails

## Issues Fixed (History)

### 1. Supabase Client Init - CDN Loading
- Problem: Dynamic import of supabase-js from unpkg failed, `createClient is not a function`
- Fix: Changed to UMD script tag in HTML `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js">` which exposes `window.supabase`. Module code then uses `window.supabase.createClient()`.

### 2. Missing showConfirmDialog export
- Problem: ui.js did not export showConfirmDialog, causing import error in friends.js, requests.js, notifications.js, profile.js
- Fix: Added showConfirmDialog function to ui.js with proper modal implementation

### 3. Dashboard blank / Nothing clickable
- Problem: Event listeners for nav items were set up AFTER the supabase auth check. If supabase was null, the function returned early without setting up click handlers.
- Fix: Moved event listener setup BEFORE the auth/supabase check. Added sidebar close on outside click.

### 4. Profile load failure
- Problem: getProfile would fail (error path taken) if profile record didn't exist in DB
- Fix: Changed to try/catch with null handling, fallback to currentUser.user_metadata

### 5. OTP digit mismatch
- Problem: Supabase sends 8-digit OTP but UI expected 6 digits
- Fix: Updated input maxlength, placeholder, and validation to 8 digits

### 6. Email lookup RLS blocked
- Problem: RLS on profiles table prevented users from looking up other users by email (can only see own profile)
- Fix: Created `lookup_user_by_email` SECURITY DEFINER SQL function that bypasses RLS. Updated getProfileByEmail in profiles.js to use `supabase.rpc('lookup_user_by_email', ...)` instead of direct table query.

## Known Issues / Pending

### HIGH PRIORITY
1. User couldn't create debt request - FIXED (RLS issue resolved with RPC function)
2. Profile page - PARTIALLY FIXED (loads but may show empty if no profile record)

### MEDIUM PRIORITY
3. Maileroo SMTP not configured in Supabase Auth settings
   - User tried with wrong settings (port 585, wrong host)
   - Correct: Host=smtp.maileroo.app, Port=587, User=hello@hisab.maileroo.app, Password=1b905ed469e379009d8fb5e1
   - Currently using Supabase default email (no custom SMTP)
   
4. Application emails (debt request, rejection, invitation) - NOT IMPLEMENTED
   - Need Supabase Edge Function using Maileroo API
   - Edge Function should: send email on new request, rejection, invitation
   - Never send email on Accept
   - For unregistered users: send invitation email + save request with email only

5. Unregistered user debt request linking
   - When an unregistered user receives a request and later creates an account with same email, the pending requests should auto-link to their new account
   - Need a trigger or function to handle this

### LOW PRIORITY
6. Skeleton loading not implemented on all pages
7. Dark mode (CSS ready, logic not implemented)
8. Profile picture upload (Supabase Storage)
9. GitHub Pages sometimes shows 404 on page refresh (SPA routing issue - currently using separate HTML files)
10. Bottom nav on mobile - active state not updating properly
11. Sent requests list shows "To: user_id" instead of name (showing raw sender_id)

## How to Run Locally
1. Clone repo
2. No build step needed (vanilla JS)
3. Open index.html locally or use any static server
4. Or visit: https://slnkaxay-source.github.io/hisab/

## Config
All config in: src/js/config.js
Current: Supabase URL + anon key are set. Maileroo API key not used in frontend.
