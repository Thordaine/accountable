# Sign-in and people

Part of the spec; [`docs/spec.md`](../spec.md) has the summary and the index. The user menu is in [app-shell.md](app-shell.md), and how local runs sign in is in [running.md](running.md).

## Signing in

- Signed out, every address shows the sign-in screen instead of the page, with no top navigation bar. After signing in, the page at that address opens.
- The sign-in screen is one rounded panel in the middle of the page background, with the Accountable mark and name, the heading "Sign in", an Email field, a Password field and a **Sign in** button. Enter in either field signs in.
- While it signs in, the button is disabled and says "Signing in…".
- A wrong email or password shows "Wrong email or password." under the fields, and the password field is emptied. Any other failure, such as no internet connection, shows "Couldn't sign in. Try again."
- There's no sign-up, no password reset and no other way to sign in. The screen says "Ask whoever runs Accountable to add you." People are added in Supabase's dashboard. The browser is given the publishable key, so anyone could call Supabase directly: the project has sign-ups and anonymous sign-ins turned off, which is what keeps strangers out.
- The browser keeps you signed in, so a refresh or a restart doesn't sign you out. You stay signed in until you sign out or the session ends.
- **Sign out** is in the user menu. It shows the sign-in screen at once.
- If the server refuses a request because the session has ended, the app shows the sign-in screen, and after signing in, the same page.
- The sign-in screen follows the theme chosen in this browser. It has no menu, so the theme can't be changed while signed out.

## Who you are

- The server checks the sign-in on every request and takes who you are from it, never from anything else the browser sends. Signed out, every API route refuses, and so does a sign-in that carries no email.
- Everyone who can sign in can do everything. There are no roles.
- A person goes by the `display_name` in their Supabase user metadata, or their email if they have none. Supabase's Add user dialog doesn't ask for a name, so it is set in the SQL editor: `update auth.users set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"display_name": "<name>"}' where email = '<email>';`. A new or changed name shows from their next sign-in; records already saved keep the name they were saved with.
- Their initials come from that name: the first letters of its first and last words, in capitals, such as "IP" for "Ingo Prause". A one-word name, or an email, gives its first letter.

## Who added a record

- Each organization, contact, deal and activity records who added it and who last changed it, beside when.
- A record keeps the name its person had when they saved it, so renaming someone in Supabase changes only what they save afterwards.
- Automatic entries are added by the person whose change wrote them. When winning a deal changes a contact's status, that person last changed the contact.
- The sample data shows "Sample data" as who added and last changed each record.
- Where it shows is in [records.md](records.md) and [activities.md](activities.md).
