MFM HILLTOP MEDIA TRAINING 2026 — FREE REGISTRATION PREPARATION

WHAT IS INCLUDED
- app/page.tsx: public free-registration page; saves through a secure Supabase RPC and downloads a PDF confirmation.
- app/admin/page.tsx: admin dashboard; reads participants and updates registration status.
- app/layout.tsx and globals.css: Next.js app shell and admin styles.
- lib/supabase.ts: browser Supabase client using public environment variables.
- supabase/free-registration-setup.sql: matching database setup.
- package.json: includes jsPDF, which the PDF generator requires.

IMPORTANT
This is a prepared replacement bundle, not yet installed on your live site. Do not upload individual files into the repository root. The GitHub repository currently displays page.tsx and registration-page.tsx at its root, while Next.js route files belong inside app/. This bundle puts them in the correct app/ routes.

NEXT STEPS (NOT YET DONE)
1. Confirm whether the existing Supabase registrations table contains real registrations before running the SQL. The script preserves rows and legacy payment columns, but the setup must still be checked against the live database.
2. Run the SQL in Supabase SQL Editor.
3. Create/confirm the organiser's Auth user, then add that user's UUID to public.training_admins using the final SQL comment.
4. In Vercel, confirm NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set. Never use a service-role key in browser code.
5. Upload the included project files into the matching paths, then deploy and test one registration and one admin login.

PDF NOTE
The confirmation PDF is generated in the participant's browser after the database confirms registration. It downloads to their device; this code does not email or WhatsApp the PDF.
