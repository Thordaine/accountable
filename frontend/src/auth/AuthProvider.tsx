import { useQueryClient } from "@tanstack/react-query";
import { createContext, type ReactNode, use, useEffect, useState } from "react";
import { api, setSession } from "../api/client";
import type { User } from "../api/types";
import type { Session } from "./session";
import { SignIn } from "./SignIn";

type Auth = { user: User; signOut: () => Promise<void> };

const AuthContext = createContext<Auth | null>(null);

/** Who is signed in, from `/api/me`; null when signed out. */
async function currentUser(session: Session) {
  if (!(await session.token())) return null;
  return api<User>("/me").catch(() => null);
}

/** Shows the app when signed in and the sign-in screen when not. */
export function AuthProvider({
  session,
  children,
}: {
  session: Session;
  children: ReactNode;
}) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>();

  useEffect(() => {
    setSession(session);
    const check = async () => {
      const found = await currentUser(session);
      if (!found) queryClient.clear();
      setUser(found);
    };
    check();
    return session.onChange(check);
  }, [session, queryClient]);

  if (user === undefined) return null;
  if (user === null) return <SignIn session={session} />;
  return (
    <AuthContext value={{ user, signOut: () => session.signOut() }}>
      {children}
    </AuthContext>
  );
}

/** The signed-in user and how to sign out. */
export function useAuth() {
  return use(AuthContext)!;
}
