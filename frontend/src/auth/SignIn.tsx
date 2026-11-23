import { type FormEvent, useState } from "react";
import { Field } from "../components/FormDialog";
import { useTheme } from "../lib/theme";
import { type Session, WrongCredentials } from "./session";
import "./sign-in.css";

/** The sign-in screen, shown at every address while signed out; on System it follows the device. */
export function SignIn({ session }: { session: Session }) {
  useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSigningIn(true);
    setError("");
    try {
      await session.signIn(email, password);
    } catch (err) {
      const wrong = err instanceof WrongCredentials;
      setError(
        wrong ? "Wrong email or password." : "Couldn't sign in. Try again.",
      );
      if (wrong) setPassword("");
      setSigningIn(false);
    }
  }

  return (
    <main className="sign-in">
      <form className="sign-in-panel" onSubmit={submit}>
        <div className="brand">
          <span className="mark" aria-hidden="true">
            A
          </span>
          Accountable
        </div>
        <h1>Sign in</h1>
        <Field label="Email">
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Password">
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        <button className="btn" type="submit" disabled={signingIn}>
          {signingIn ? "Signing in…" : "Sign in"}
        </button>
        <p className="sign-in-note">Ask whoever runs Accountable to add you.</p>
        {session.local && (
          <p className="sign-in-note">
            Local run: sign in as test@example.com with the password test.
          </p>
        )}
      </form>
    </main>
  );
}
