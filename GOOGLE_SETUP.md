# Google OAuth Setup Guide

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.developers.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API and Google Sign-In API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Choose "Web application" as the application type
6. Add your domain to "Authorized JavaScript origins":
   - For local development: `http://localhost:3000`, `http://localhost:5000`
   - For production: `https://yourdomain.com`
7. Add your redirect URI to "Authorized redirect URIs":
   - For local development: `http://localhost:3000`, `http://localhost:5000`
   - For production: `https://yourdomain.com`
8. Click "Create" and copy your Client ID

## Step 2: Update Configuration

1. Open `google-config.js`
2. Replace `YOUR_GOOGLE_CLIENT_ID_HERE` with your actual Client ID
3. Update the `REDIRECT_URI` if needed

## Step 3: Update HTML

1. Open `index.html`
2. Replace `YOUR_GOOGLE_CLIENT_ID_HERE` with your actual Client ID in the `data-client_id` attribute

## Step 4: Test

1. Open your website
2. Click "Login" button
3. You should see a "Sign in with Google" button
4. Click it to test the Google OAuth flow

## Features

✅ **Real Google OAuth Integration** - Uses official Google Sign-In API
✅ **Fallback Support** - Works even if Google API fails to load
✅ **User Profile Data** - Gets name, email, profile picture
✅ **Secure Token Storage** - Stores authentication tokens locally
✅ **Responsive Design** - Works on all device sizes
✅ **Error Handling** - Graceful fallbacks and user notifications

## Troubleshooting

- **Button not showing**: Check if Google API loaded (check browser console)
- **Login not working**: Verify your Client ID and domain settings
- **Redirect issues**: Ensure your domain is in authorized origins
- **CORS errors**: Check that your domain matches exactly in Google Console

## Security Notes

- Never expose your Client Secret in frontend code
- Use HTTPS in production
- Implement proper server-side validation
- Consider implementing refresh token rotation
