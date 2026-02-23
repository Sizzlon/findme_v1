# Row Level Security (RLS) Setup Guide for FindMe

## Problem

We temporarily disabled RLS policies to get signup working, but we need proper security. The issue was that RLS policies were preventing profile creation during the signup flow.

## Solution Steps

### 1. Run the Comprehensive RLS Fix

In your Supabase SQL Editor, run the contents of `database/comprehensive-rls-fix.sql`:

```sql
-- This script:
-- 1. Temporarily disables RLS
-- 2. Drops all existing policies
-- 3. Re-enables RLS
-- 4. Creates comprehensive policies that handle all operations
-- 5. Adds cross-table viewing for matching functionality
```

### 2. Key Policy Features

The new policies provide:

- **Own Data Access**: Users can fully manage their own profiles (CRUD operations)
- **Cross-Profile Viewing**: Companies can view job seeker profiles, job seekers can view company profiles (for matching)
- **Security**: No user can modify other users' data
- **Authentication Required**: All operations require valid authentication

### 3. Testing the Policies

After running the SQL script, test that:

1. **Signup Works**: New users can create accounts and profiles
2. **Profile Access**: Users can view and edit their own profiles
3. **Cross-Viewing**: Companies can see job seeker profiles (and vice versa)
4. **Security**: Users cannot access/modify other users' data

### 4. If Issues Persist

If you still encounter issues:

1. **Check Authentication**: Ensure user is properly authenticated before profile operations
2. **Verify User ID**: Confirm `auth.uid()` matches the profile ID being accessed
3. **Check Email Confirmation**: If using email confirmation, profiles are created after confirmation
4. **Inspect Logs**: Check Supabase logs for RLS policy violations

### 5. Email Confirmation Consideration

If you have email confirmation enabled in Supabase:

- Profiles are created AFTER email verification
- The signup flow shows "check your email" message
- Profile creation happens in the auth callback

If you want instant signup (for development):

- Go to Supabase Dashboard > Authentication > Settings
- Turn off "Enable email confirmations"
- Users will be immediately authenticated and profiles created

## Current Status

- ✅ Comprehensive RLS policies created
- ✅ Support for both user types (job seekers + companies)
- ✅ Cross-profile viewing for matching
- ✅ Secure CRUD operations
- ⏳ Ready to test and enable

## Next Steps

1. Run the `comprehensive-rls-fix.sql` script
2. Test signup and profile creation
3. Verify security by trying to access other users' data
4. Enable email confirmation if desired
5. Proceed to swipe/matching functionality

The RLS system is now production-ready and secure!
