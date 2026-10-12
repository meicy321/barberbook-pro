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

- The role source of truth is `profiles.role`, never `user_metadata` (read via `useProfile`). Sign-up writes customer | shop; a DB trigger only lets a signed-in user change customer → shop, so admin is never self-served.
- After sign-in, `homePathForRole` sends shop → `/shop`, everyone else → `/dashboard`. No admin branch until an admin can exist.
- Shop area (`/shop` setup, `/shop/bookings` services & schedule) sits in `ShopLayout`; a customer there sees the "Become a shop" offer instead.
- Every schema/RLS change goes through a Supabase migration; regenerate `src/integrations/supabase/types.ts` after each one.
- Barber photos live in the public `barber-photos` bucket at `<barber_id>/<uuid>.<ext>` — the Storage policy checks the first folder against the caller's barbers. Deleting a photo removes the file and the `barber_photos` row.
- Prices are whole units of `platform_settings.currency` (300 = NT$300); never store ×100. Slots are `platform_settings.slot_minutes` long.
- Admin is never self-selectable; `normalizeSignupRole` coerces anything else to customer — prevents self-escalation.
- Plain Vite + React SPA with React Router (`src/App.tsx`); static `dist/` on Vercel with a SPA fallback in `vercel.json` — no SSR, so deep links never 404.
- Signed-in pages sit behind `RequireAuth` in `src/App.tsx` (client-only gate, redirects to `/login`) — session is in browser storage.
- `.env` is not committed; `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are set in Vercel → Environment Variables.
- Landing barber listings come from static sample data in `src/lib/barbers.ts` until the barbers table exists.
- React component files use PascalCase — consistent naming per course convention.
