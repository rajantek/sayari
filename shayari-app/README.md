# Shayari app (React + Vite + Supabase + Netlify)

## 1. Database
Run `schema.sql` (provided separately) in Supabase -> SQL Editor.

## 2. Google login
1. Google Cloud Console -> APIs & Services -> Credentials -> Create OAuth client ID (Web application).
2. Authorized redirect URI: `https://YOUR-PROJECT.supabase.co/auth/v1/callback`
3. Supabase -> Authentication -> Providers -> Google: paste Client ID + Secret, enable.
4. Supabase -> Authentication -> URL Configuration:
   - Site URL: your Netlify URL
   - Redirect URLs: add your Netlify URL and `http://localhost:5173`

## 3. Run locally
```
cp .env.example .env     # fill in Supabase URL + anon key (Settings -> API)
npm install
npm run dev
```

## 4. Deploy on Netlify
Push to GitHub -> Netlify "Import from Git". `netlify.toml` already sets the build command,
publish dir, and SPA redirect. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
under Site settings -> Environment variables, then redeploy.

Never put the Supabase service_role key in this project.
