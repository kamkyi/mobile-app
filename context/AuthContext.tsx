import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

type AuthUser = {
  id: string;
  email: string;
  name: string;
};

type AuthContextValue = {
  isAuthenticated: boolean;
  user: AuthUser | null;
  isLoading: boolean;
  startWorkOSLogin: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const startWorkOSLogin = useCallback(async () => {
    setIsLoading(true);

    try {
      // TODO(workos-authkit):
      // 1) Start WorkOS AuthKit authorization flow.
      // 2) Handle browser redirect/callback in Expo.
      // 3) Exchange code for session, then fetch user profile.
      // 4) Replace the mock user below with real AuthKit user/session data.
      await new Promise((resolve) => setTimeout(resolve, 800));

      setUser({
        id: "demo-user-id",
        email: "demo@superapp.app",
        name: "Demo User",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(user),
      user,
      isLoading,
      startWorkOSLogin,
      logout,
    }),
    [isLoading, startWorkOSLogin, user, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
