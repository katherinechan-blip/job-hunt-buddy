# Job Hunt Buddy

A job board MVP built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file in the root directory with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=https://ihduewpdscapnlcuirdw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_mYmC90lWQEiOcIluPX-T0w_lN-OycHp
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- Fetches jobs from Supabase `jobs` table
- Responsive grid layout
- Job cards displaying:
  - Title (bold)
  - Company (gray text)
  - Location
  - Pay (green text, e.g., "$22 - $25/hr")
  - Apply button

## Database Schema

Make sure your Supabase `jobs` table has the following columns:
- `id` (string/uuid)
- `title` (string)
- `company` (string)
- `location` (string)
- `pay` (string)
