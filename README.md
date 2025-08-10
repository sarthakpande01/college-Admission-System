# Student Counseling Web Application

A comprehensive web application for student counseling and seat allocation management.

## Features

- **Authentication**: Email/password, Google OAuth, and GitHub OAuth
- **Student Portal**: Personal information submission, academic details, branch preferences
- **Admin Panel**: Student management, ranking, seat allocation, payment verification
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Real OAuth Integration**: Google and GitHub authentication

## Setup Instructions

### 1. Google OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" and create an "OAuth 2.0 Client ID"
5. Set the authorized JavaScript origins to include your domain (e.g., `http://localhost:3000`)
6. Copy the Client ID and replace `YOUR_GOOGLE_CLIENT_ID` in `index.html`

### 2. GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:
   - Application name: "Student Counseling App"
   - Homepage URL: Your domain (e.g., `http://localhost:3000`)
   - Authorization callback URL: `http://localhost:3000/github-callback.html`
4. Copy the Client ID and replace `YOUR_GITHUB_CLIENT_ID` in `script.js`

### 3. Running the Application

1. Open `index.html` in a web browser
2. For OAuth to work properly, serve the files through a local server:
   ```bash
   # Using Python
   python -m http.server 3000
   
   # Using Node.js
   npx http-server -p 3000
   
   # Using PHP
   php -S localhost:3000
   ```
3. Access the application at `http://localhost:3000`

## File Structure

```
├── index.html              # Main landing page
├── style.css               # Main stylesheet
├── script.js               # Main JavaScript functionality
├── student-dashboard.html  # Student dashboard
├── admin-dashboard.html    # Admin dashboard
├── dashboard-style.css     # Dashboard styles
├── dashboard-script.js     # Student dashboard functionality
├── admin-script.js         # Admin dashboard functionality
├── github-callback.html    # GitHub OAuth callback page
└── README.md              # This file
```

## Authentication Flow

### Google OAuth
1. User clicks "Continue with Google"
2. Google Identity Services handles the OAuth flow
3. User selects their Google account
4. Application receives user data and creates session

### GitHub OAuth
1. User clicks "Continue with GitHub"
2. User is redirected to GitHub for authorization
3. GitHub redirects back to callback page
4. Application processes the authorization and creates session

## Admin Access

To access the admin panel:
1. Use the admin code: `ADMIN2024`
2. Register as an admin user
3. Access admin features through the dashboard

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- Google Identity Services API
- GitHub OAuth API
- LocalStorage for data persistence

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Security Notes

- This is a frontend-only application using localStorage
- In production, implement proper backend authentication
- OAuth tokens should be handled server-side
- Add HTTPS for production deployment

## License

This project is for educational purposes. 