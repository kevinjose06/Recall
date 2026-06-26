"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onIdTokenChanged, User } from "firebase/auth";
import { auth } from "./firebase";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Keep __session cookie fresh via the server side API handler
        const token = await u.getIdToken();
        await fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
      } else {
        await fetch("/api/session", {
          method: "DELETE",
        });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
