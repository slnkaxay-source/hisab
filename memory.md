# Hisab - Progress Memory

## Last Updated: 2026-07-13

## Completed
- [x] GitHub repo created & public: https://github.com/slnkaxay-source/hisab
- [x] GitHub Pages enabled: https://slnkaxay-source.github.io/hisab/
- [x] Project structure set up
- [x] Supabase database schema applied (profiles, contacts, debt_requests, notifications)
- [x] RLS policies configured in schema
- [x] Landing page (index.html) - Hero, Features, Why, FAQ, Contact
- [x] Auth pages (login.html, signup.html, forgot-password.html)
- [x] Dashboard shell (dashboard.html) - sidebar, bottom nav, top bar
- [x] Core JavaScript API modules (auth, profiles, debtRequests, contacts, notifications)
- [x] Utility modules (helpers.js, ui.js - toast, loading, confirm dialog)
- [x] Dashboard page (cards: receive/pay/pending/friends/accepted/unread + quick actions + activity)
- [x] Friends page (add/search/delete contacts, badge for registered/unregistered)
- [x] Requests page (create/sent/received tabs, accept/reject with confirm dialogs)
- [x] Notifications page (list with type icons, mark read, mark all read)
- [x] Profile page (view/edit name, email, member since, logout)
- [x] Global CSS with design system (variables, utilities, responsive)
- [x] Landing, auth, dashboard specific CSS
- [x] Config updated with Supabase URL + anon key

## In Progress
- [ ] Maileroo SMTP config in Supabase Auth settings (user doing)

## Pending
- [ ] Create Supabase Edge Functions for sending application emails via Maileroo API
- [ ] Link unregistered debt requests when user signs up (trigger function)
- [ ] Test full auth flow with email verification
- [ ] Test debt request flow (create, accept, reject)
- [ ] Test notification system
- [ ] Dark mode implementation
- [ ] Add skeleton loading to all pages
- [ ] Profile picture upload (Supabase Storage)

## Config
- Supabase URL: https://gudpgpaygwdccducbdnu.supabase.co
- Supabase Anon Key: set in config.js
- Maileroo Domain: hisab.maileroo.app
- Maileroo API Key: provided
- SMTP: hello@hisab.maileroo.app (user configuring in dashboard)

## Repo
- URL: https://github.com/slnkaxay-source/hisab
- Pages: https://slnkaxay-source.github.io/hisab/
- Branch: master
