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
- After sign-in, `homePathForRole` sends shop → `/shop`, everyone else → `/barbers`; a `?next=/path` on `/login` wins (same-site paths only). No admin branch until an admin can exist.
- Buyer side (M1.2): `/barbers` (browse), `/barbers/:id` (detail + Book dialog), `/bookings` (my bookings). A booking is written only through the `create_booking` RPC (1 booking + N `booking_slots`, atomic); slots have no status — free = no `booking_slots` row. Cancel = set `status='cancelled'`; the `trg_free_slots_on_cancel` trigger frees the slots. Buyer times are shown in Asia/Taipei.
- Shop area (`/shop` setup, `/shop/bookings` services & schedule) sits in `ShopLayout`; a customer there sees the "Become a shop" offer instead.
- Every schema/RLS change goes through a Supabase migration; regenerate `src/integrations/supabase/types.ts` after each one.
- Barber photos live in the public `barber-photos` bucket at `<barber_id>/<uuid>.<ext>` — the Storage policy checks the first folder against the caller's barbers. Deleting a photo removes the file and the `barber_photos` row.
- Prices are whole units of `platform_settings.currency` (300 = NT$300); never store ×100. Slots are `platform_settings.slot_minutes` long.
- Admin is never self-selectable; `normalizeSignupRole` coerces anything else to customer — prevents self-escalation.
- Plain Vite + React SPA with React Router (`src/App.tsx`); static `dist/` on Vercel with a SPA fallback in `vercel.json` — no SSR, so deep links never 404.
- Signed-in pages sit behind `RequireAuth` in `src/App.tsx` (client-only gate, redirects to `/login`) — session is in browser storage.
- `.env` is not committed; `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are set in Vercel → Environment Variables.
- Landing-page "popular barbers" still use static sample data in `src/lib/barbers.ts`; `/barbers` reads the real `barbers` table.
- React component files use PascalCase — consistent naming per course convention.
