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
- Signed-in pages live under `src/routes/_authenticated/` (client-only gate, redirects to `/login`) — session is in browser storage.
- Landing barber listings come from static sample data in `src/lib/barbers.ts` until the barbers table exists.
- React component files use PascalCase — consistent naming per course convention.
