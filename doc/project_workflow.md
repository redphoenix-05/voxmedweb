# Project Workflow

## Development Flow

1. Start the backend from `server/` with `npm run dev`.
2. Start the frontend from `client/` with `npm run dev`.
3. Open the client in the browser and test role-based flows.
4. Use Supabase schema and seed files when the database needs to be initialized or repaired.

## Authentication Workflow

1. User submits credentials on the login page.
2. Client sends the request to `POST /auth/signin`.
3. Server signs in with Supabase Auth.
4. Server fetches the matching profile row from `profiles`.
5. Server returns access token, refresh token, and user profile data.
6. Client stores session data and updates auth context.
7. Client redirects the user to the appropriate dashboard or requested protected route.

## Route Protection Workflow

1. Protected pages render through `ProtectedRoute`.
2. If auth state is still loading, the page loader is shown.
3. If the user is not authenticated, the app redirects to `/login` and preserves the originally requested route.
4. If the user is authenticated but does not have an allowed role, the app redirects to `/unauthorized`.
5. If the user is authenticated and authorized, the nested dashboard layout and page render.

## Registration Workflow

1. Hospital admin registers through the public register page.
2. Server creates the auth user in Supabase.
3. Server creates the hospital record.
4. Server links the hospital admin in `hospital_staff`.
5. User returns to login and signs in.

## Data Flow Summary

- Frontend handles navigation, role-based UI rendering, and form submission.
- Backend handles validation, authentication, authorization, and database access.
- Supabase stores both auth identities and application data.