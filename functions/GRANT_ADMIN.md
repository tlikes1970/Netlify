# Grant Admin Role - Instructions

## Option 1: Firebase Functions Shell (Recommended)

1. **Start the shell:**
   ```bash
   cd functions
   firebase functions:shell
   ```

2. **Run these commands in the shell:**
   ```javascript
   const { getAuth } = require('firebase-admin/auth');
   const u = await getAuth().getUserByEmail('pprowten@gmail.com');
   await getAuth().setCustomUserClaims(u.uid, { role: 'admin' });
   console.log({ message: 'Admin role granted', uid: u.uid, email: u.email });
   ```

3. **Exit the shell:**
   ```javascript
   process.exit(0)
   ```
   Or press `Ctrl+C` twice

## Option 2: Direct Node Script (if you have service account credentials)

If you have a service account JSON file, you can use:

```bash
cd functions
node grant-admin.js pprowten@gmail.com
```

But this requires setting `GOOGLE_APPLICATION_CREDENTIALS` environment variable to point to your service account key file.

## Important Notes

- **User must sign out and sign back in** for the admin role to take effect
- After granting the first admin, you can use the Admin Dashboard UI at `/admin` to manage other admins
- The custom claim is cached in the user's ID token, so they need to refresh it by signing out/in

