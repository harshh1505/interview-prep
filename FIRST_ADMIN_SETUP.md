# CAPACITY CONNECT — USER & ADMIN ROLE-BASED AUTHENTICATION SETUP GUIDE

This guide explains how the two-role (`user` and `admin`) authentication and administration system works in **Capacity Connect**, and how to safely promote your first account to administrator.

---

## 1. ARCHITECTURE OVERVIEW

The application supports **ONLY TWO ROLES**:
1. `user` — Default role for candidates. Can practice interviews, upload resumes, and track personal progress.
2. `admin` — Authorized platform administrator. Can access `/admin/*` control panel, manage users, promote/demote roles, manage programs, view system health, and export reports.

### Security Boundary
- **Role Selection Screen (`/`)**: A clean navigation entry point to choose between User Login (`/login`) and Admin Login (`/admin/login`).
- **Database Source of Truth**: The `public.profiles` table (`role` column) determines authorization.
- **Server-Side Authorization**: Every `/admin/*` page and `/api/admin/*` API endpoint verifies `profiles.role === 'admin'` on the server side using `requireAdminUser()`. Client-side tampering (e.g. `localStorage.role`) cannot bypass server authorization.
- **Mock Account Safety**: Showcase demo/mock sessions are strictly prohibited from gaining admin authorization (Rule 46). Admin access requires a real Supabase authenticated account with `role = 'admin'` in PostgreSQL.

---

## 2. STEP-BY-STEP FIRST ADMIN ACCOUNT PROMOTION

### Step 1: Create a Normal Account
1. Open the application landing page at `http://localhost:3000/`.
2. Click **User** card or navigate to `http://localhost:3000/signup`.
3. Fill in your name, email address, and password, and complete signup.
4. Note your registered email address (e.g., `admin.owner@capacityconnect.com`).

### Step 2: Promote the Account to Admin in Supabase
Run the following SQL statement in the **Supabase SQL Editor** (or via psql):

```sql
-- 1. Apply database schema migration if not already run:
-- (Runs migration_roles_and_admin.sql)

-- 2. Promote your user account to admin:
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'admin.owner@capacityconnect.com'
);

-- 3. Verify the role change:
SELECT id, full_name, role, created_at 
FROM public.profiles 
WHERE role = 'admin';
```

---

## 3. ACCESSING THE ADMIN PORTAL

1. Visit `http://localhost:3000/` and click **Admin** card (or go directly to `http://localhost:3000/admin/login`).
2. Log in with your promoted administrator email and password.
3. Upon successful verification of `role === 'admin'`, you will be redirected to the **Admin Control Panel** (`/admin/dashboard`).

---

## 4. PROMOTING & DEMOTING OTHER USERS FROM ADMIN PANEL

Once logged in as an administrator:
1. Navigate to **Users** (`/admin/users`) in the Admin Sidebar.
2. Click **View / Manage** next to any candidate.
3. Click **Promote User to Admin ↑** (or **Demote Admin to User ↓**).
4. Confirm the prompt in the confirmation modal.
5. The action will be logged to `admin_audit_logs` for security tracking.

*(Note: An admin account cannot accidentally demote itself.)*

---

## 5. REMOVING ADMIN PRIVILEGES VIA SQL

To revert an administrator account back to a normal user via SQL:

```sql
UPDATE public.profiles
SET role = 'user'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'target.user@capacityconnect.com'
);
```

---

## 6. VERIFYING SECURITY & ROUTE PROTECTION

You can test authorization boundaries as follows:

1. **Unauthenticated access test**: Visit `/admin/dashboard` while logged out.
   - *Expected*: Redirected to `/admin/login`.
2. **Normal user access test**: Log in as a normal user (`role = 'user'`) and visit `/admin/dashboard` or call `GET /api/admin/users`.
   - *Expected*: Blocked with `403 Forbidden` / redirected to `/admin/login?error=unauthorized`.
3. **Admin access test**: Log in as an admin (`role = 'admin'`) and visit `/admin/dashboard`.
   - *Expected*: Full access granted.
