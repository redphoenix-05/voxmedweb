# VoxMed Connect

Modern SaaS healthcare platform with role-based dashboards for Admin, Hospital Admin, Receptionist, and Lab Staff.

## Tech Stack

- **Frontend**: React (Vite) + TailwindCSS + ShadCN-style UI
- **Backend**: Node.js + Express (ES modules)
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth (JWT)

## Setup

1. Copy `.env.example` to `.env` and fill in your Supabase credentials.
2. Run the schema in `supabase/schema.sql` via Supabase SQL Editor.
3. Run the seed data in `supabase/seed.sql` via Supabase SQL Editor.

```bash
# Install dependencies
cd client && npm install
cd ../server && npm install

# Run dev servers
cd server && npm run dev     # starts on :5000
cd client && npm run dev     # starts on :5173, proxies /api to :5000
```

## Default Admin Login

- **Email**: admin@voxmed.com
- **Password**: admin@123

## Project Structure

```
voxmedweb/
├── .env                  # shared environment variables
├── client/               # React frontend
│   └── src/
│       ├── components/   # UI components
│       ├── contexts/     # Auth & Theme providers
│       ├── lib/          # API client, Supabase, utils
│       └── pages/        # Route pages by role
├── server/               # Express backend
│   └── src/
│       ├── lib/          # Supabase client
│       ├── middleware/    # auth, validation
│       └── routes/       # API routes by role
└── supabase/             # schema + seed SQL
```
