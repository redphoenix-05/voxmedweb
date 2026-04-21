# Project Details

## Overview

VoxMed Connect is a role-based healthcare management platform built as a full-stack web application. It provides separate dashboards and workflows for platform administrators, hospital administrators, receptionists, and lab staff.

## Tech Stack

- Frontend: React, Vite, React Router, Tailwind CSS, reusable UI components
- Backend: Node.js, Express, Zod validation
- Database and Auth: Supabase PostgreSQL and Supabase Auth
- Deployment shape: Vite client and Node API server

## Workspace Structure

- `client/`: React frontend
- `server/`: Express API server
- `supabase/`: SQL schema and seed data
- `doc/`: project documentation

## Main Functional Areas

- Authentication with JWT-based session handling
- Admin dashboard for platform-level management
- Hospital dashboard for hospital-specific operations
- Reception workflow for booking and scheduling
- Lab workflow for patient reports and uploads

## Supported Roles In Current UI

- `admin`
- `hospital_admin`
- `receptionist`
- `lab_staff`

## Important Files

- `client/src/App.jsx`: client route configuration
- `client/src/contexts/AuthContext.jsx`: auth state lifecycle
- `client/src/components/ProtectedRoute.jsx`: route guard
- `client/src/pages/auth/LoginPage.jsx`: login form and post-login redirect
- `server/src/routes/auth.js`: signup, signin, token refresh, current-user profile
- `server/src/middleware/auth.js`: JWT verification and role attachment

## Authentication Notes

- The client stores `token`, `refresh_token`, and `user` in local storage.
- The server returns the signed-in auth user together with the matching `profiles` row.
- Protected routes are role-gated on the client.

## Current Known Constraint

- The frontend currently exposes dashboard routes only for `admin`, `hospital_admin`, `receptionist`, and `lab_staff`. Other roles may authenticate successfully but do not have a dedicated dashboard route in the current UI.