-- Missing INSERT policy for accounts table.
-- Without this, authenticated users get "permission denied" when creating their account during onboarding.
create policy "accounts_insert" on accounts
  for insert with check (owner_user_id = auth.uid());
