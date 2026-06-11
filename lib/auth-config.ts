// Admins log in with a plain username. Supabase Auth is email-based, so each
// username maps to an internal email of the form `<username>@<USERNAME_DOMAIN>`.
// When creating an admin in the Supabase dashboard, use that email address.
// The domain is a placeholder — it never needs to receive mail.
export const USERNAME_DOMAIN = 'sessionshub.local'
