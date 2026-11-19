# MFM Hilltop Media Training 2026 registration portal

A Next.js + Supabase starter website with participant registration, private payment-receipt uploads, generated registration codes, and a protected admin dashboard.

## Event details already entered
- MFM members only (including members of other MFM branches)
- Dates: 21, 22, 23, 28, 29 and 30 December 2026
- Time: 10:00 AM daily
- Venue: Church Auditorium, 14 Comrade Sunday Ekuma Street, off Hilltop Road, after SS Field, behind the MTN Mast, Abakaliki, Ebonyi State
- Fee: ₦3,000
- GTBank; Nwora Prosper; 1005660467
- 12 training categories are included

## Important before publishing
This project is a deployable starter, not a live website yet. It needs a Supabase project and Vercel deployment. Never put a Supabase service-role key in this project or in browser code. Only use the public anon key.

## 1. Create Supabase backend
1. Create a project at https://supabase.com.
2. Open SQL Editor and run the complete contents of `supabase/setup.sql`.
3. In Project Settings > API, copy the Project URL and anon/public key.
4. In Authentication settings, enable Email + Password sign-in.
5. Create the organiser's admin user in Authentication > Users (use an email and password controlled by the church).
6. Copy that user's UUID. In SQL Editor run:
   `insert into public.training_admins (user_id) values ('PASTE-ADMIN-USER-UUID-HERE');`
7. Keep the admin email/password private. Use a strong unique password.

## 2. Configure locally
1. Install Node.js (LTS) on a computer.
2. Extract this ZIP and open the project folder in a terminal.
3. Copy `.env.example` to `.env.local`.
4. Put the Supabase Project URL and anon key in `.env.local`.
5. Run `npm install`, then `npm run dev`.
6. Open http://localhost:3000 to test.

## 3. Deploy on Vercel
1. Upload this project to a new GitHub repository.
2. Import that repository into Vercel.
3. In Vercel Project Settings > Environment Variables, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy. Test a registration and then sign in at `/admin`.

## Admin dashboard
Visit `/admin`. Admins can review participants, view uploaded receipts, update payment and registration statuses, and export the participant list as CSV. Only user IDs added to `training_admins` can access participant records.

## Notes
- A registration code is generated when a participant submits the form.
- A submission is pending until the organisers verify the transfer and update its status.
- The account details and registration fee are displayed exactly as provided. Confirm that the account is authorised by the church before making the site public.
- The form requires an email address and a payment receipt. If you prefer not to require email or want a different confirmation workflow, update the form before launch.
- Test the complete process with a small test registration before sharing the public link.
