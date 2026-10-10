<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Architecture rules

- Sign-up role (customer | shop) lives only in auth user metadata for now; no app tables yet — the real schema arrives later via migrations with RLS.
- Admin is never self-selectable; `normalizeSignupRole` coerces anything else to customer — prevents self-escalation.
- Plain Vite + React SPA with React Router (`src/App.tsx`); static `dist/` on Vercel with a SPA fallback in `vercel.json` — no SSR, so deep links never 404.
- Signed-in pages sit behind `RequireAuth` in `src/App.tsx` (client-only gate, redirects to `/login`) — session is in browser storage.
- `.env` is not committed; `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are set in Vercel → Environment Variables.
- Landing barber listings come from static sample data in `src/lib/barbers.ts` until the barbers table exists.
- React component files use PascalCase — consistent naming per course convention.
