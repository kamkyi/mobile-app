import * as AuthSession from "expo-auth-session";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { Alert, Platform } from "react-native";

WebBrowser.maybeCompleteAuthSession();

type AuthUser = {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  profilePictureUrl?: string;
  emailVerified?: boolean;
  locale?: string;
  authenticationMethod?: string;
  createdAt?: string;
};

type AuthContextValue = {
  isAuthenticated: boolean;
  user: AuthUser | null;
  isLoading: boolean;
  startWorkOSLogin: () => Promise<void>;
  logout: () => void;
};

type StoredAuthSession = {
  user: AuthUser;
  accessToken?: string;
  refreshToken?: string;
  authenticationMethod?: string;
  organizationId?: string | null;
  workosClientId?: string;
  redirectUri?: string;
  loggedInAt?: string;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const AUTH_SESSION_STORAGE_KEY = "auth.session.v1";
const DEFAULT_WORKOS_API_HOSTNAME = "api.workos.com";
const DEFAULT_REDIRECT_SCHEME = "mobile";
const DEFAULT_REDIRECT_PATH = "auth/callback";
const DEFAULT_WEB_REDIRECT_PATH = "auth/callback";

async function getStoredAuthSessionRaw(): Promise<string | null> {
  if (Platform.OS === "web") {
    if (typeof window === "undefined") return null;

    try {
      return window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  return SecureStore.getItemAsync(AUTH_SESSION_STORAGE_KEY);
}

async function setStoredAuthSessionRaw(value: string): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, value);
    } catch {
      // Ignore storage write failures on web (private mode / quota restrictions).
    }
    return;
  }

  await SecureStore.setItemAsync(AUTH_SESSION_STORAGE_KEY, value);
}

async function clearStoredAuthSessionRaw(): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    } catch {
      // Ignore storage delete failures on web.
    }
    return;
  }

  await SecureStore.deleteItemAsync(AUTH_SESSION_STORAGE_KEY);
}

type WorkOSUserRaw = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  profile_picture_url?: string | null;
  email_verified?: boolean;
  locale?: string | null;
  created_at?: string;
};

type WorkOSAuthenticateResponseRaw = {
  user: WorkOSUserRaw;
  access_token: string;
  refresh_token: string;
  authentication_method: string;
  organization_id?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function isAuthUser(value: unknown): value is AuthUser {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === "string" &&
    typeof value.email === "string" &&
    typeof value.name === "string"
  );
}

function isWorkOSUserRaw(value: unknown): value is WorkOSUserRaw {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === "string" &&
    typeof value.email === "string" &&
    (typeof value.first_name === "string" || value.first_name === null) &&
    (typeof value.last_name === "string" || value.last_name === null)
  );
}

function parseStoredAuthSession(rawSession: string): StoredAuthSession | null {
  try {
    const parsed = JSON.parse(rawSession) as Record<string, unknown>;

    if (!isAuthUser(parsed.user)) return null;

    return {
      user: parsed.user as AuthUser,
      accessToken:
        typeof parsed.accessToken === "string" ? parsed.accessToken : undefined,
      refreshToken:
        typeof parsed.refreshToken === "string"
          ? parsed.refreshToken
          : undefined,
      authenticationMethod:
        typeof parsed.authenticationMethod === "string"
          ? parsed.authenticationMethod
          : undefined,
      organizationId:
        typeof parsed.organizationId === "string" ||
        parsed.organizationId === null
          ? parsed.organizationId
          : undefined,
      workosClientId:
        typeof parsed.workosClientId === "string"
          ? parsed.workosClientId
          : undefined,
      redirectUri:
        typeof parsed.redirectUri === "string" ? parsed.redirectUri : undefined,
      loggedInAt:
        typeof parsed.loggedInAt === "string" ? parsed.loggedInAt : undefined,
    };
  } catch {
    return null;
  }
}

function normalizeHostname(hostname: string) {
  return hostname.replace(/^https?:\/\//i, "").replace(/\/+$/g, "");
}

function getWorkOSBaseUrl() {
  const hostname =
    process.env.EXPO_PUBLIC_WORKOS_API_HOSTNAME?.trim() ||
    DEFAULT_WORKOS_API_HOSTNAME;
  return `https://${normalizeHostname(hostname)}`;
}

function getEnvString(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function getWebRedirectPath(path: string): string {
  const normalizedPath = path.replace(/^\/+/, "");
  const baseUrl = Constants.expoConfig?.experiments?.baseUrl;

  if (typeof baseUrl !== "string") {
    return normalizedPath;
  }

  const normalizedBase = baseUrl.trim().replace(/^\/+|\/+$/g, "");
  return normalizedBase
    ? `${normalizedBase}/${normalizedPath}`
    : normalizedPath;
}

function getWebRedirectUri(path: string): string {
  const configuredUri = process.env.EXPO_PUBLIC_WORKOS_WEB_REDIRECT_URI?.trim();
  if (configuredUri) {
    return configuredUri.replace(/\/+$/g, "");
  }

  return AuthSession.makeRedirectUri({
    path: getWebRedirectPath(path || DEFAULT_WEB_REDIRECT_PATH),
  });
}

function isWorkOSAuthenticateResponseRaw(
  value: unknown,
): value is WorkOSAuthenticateResponseRaw {
  if (!isRecord(value)) return false;

  return (
    isWorkOSUserRaw(value.user) &&
    typeof value.access_token === "string" &&
    typeof value.refresh_token === "string" &&
    typeof value.authentication_method === "string" &&
    (typeof value.organization_id === "string" ||
      typeof value.organization_id === "undefined")
  );
}

function toAuthUser(rawUser: WorkOSUserRaw, authMethod?: string): AuthUser {
  const fullName =
    `${rawUser.first_name ?? ""} ${rawUser.last_name ?? ""}`.trim();

  return {
    id: rawUser.id,
    email: rawUser.email,
    name: fullName || rawUser.email,
    firstName: rawUser.first_name ?? undefined,
    lastName: rawUser.last_name ?? undefined,
    profilePictureUrl: rawUser.profile_picture_url ?? undefined,
    emailVerified: rawUser.email_verified,
    locale: rawUser.locale ?? undefined,
    authenticationMethod: authMethod,
    createdAt: rawUser.created_at,
  };
}

async function authenticateWithCode({
  baseUrl,
  code,
  codeVerifier,
  workosClientId,
}: {
  baseUrl: string;
  code: string;
  codeVerifier: string;
  workosClientId: string;
}) {
  const response = await fetch(`${baseUrl}/user_management/authenticate`, {
    method: "POST",
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      code_verifier: codeVerifier,
      client_id: workosClientId,
    }),
  });

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const errorDescription =
      isRecord(payload) && typeof payload.error_description === "string"
        ? payload.error_description
        : "WorkOS did not accept the authorization code.";
    throw new Error(errorDescription);
  }

  if (!isWorkOSAuthenticateResponseRaw(payload)) {
    throw new Error("Unexpected WorkOS response payload.");
  }

  return payload;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const hydrateAuthSession = async () => {
      try {
        const rawSession = await getStoredAuthSessionRaw();
        if (!rawSession) return;

        const parsedSession = parseStoredAuthSession(rawSession);
        if (!parsedSession) {
          await clearStoredAuthSessionRaw();
          return;
        }

        if (isMounted) {
          setUser(parsedSession.user);
        }
      } catch (error) {
        console.warn("Failed to restore auth session from SecureStore", error);
      } finally {
        if (isMounted) {
          setIsHydrating(false);
        }
      }
    };

    void hydrateAuthSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const startWorkOSLogin = useCallback(async () => {
    setIsLoading(true);

    try {
      const workosClientId = process.env.EXPO_PUBLIC_WORKOS_CLIENT_ID?.trim();
      if (!workosClientId) {
        Alert.alert(
          "Missing WorkOS config",
          "Set EXPO_PUBLIC_WORKOS_CLIENT_ID in your .env file.",
        );
        return;
      }

      const baseUrl = getWorkOSBaseUrl();
      const redirectScheme =
        process.env.EXPO_PUBLIC_WORKOS_REDIRECT_SCHEME?.trim() ||
        DEFAULT_REDIRECT_SCHEME;
      const redirectPath =
        process.env.EXPO_PUBLIC_WORKOS_REDIRECT_PATH?.trim() ||
        DEFAULT_REDIRECT_PATH;
      const redirectUri =
        Platform.OS === "web"
          ? getWebRedirectUri(redirectPath)
          : AuthSession.makeRedirectUri({
              scheme: redirectScheme,
              path: redirectPath,
            });
      const organizationId = getEnvString("EXPO_PUBLIC_WORKOS_ORGANIZATION_ID");
      const connectionId = getEnvString("EXPO_PUBLIC_WORKOS_CONNECTION_ID");
      const domainHint = getEnvString("EXPO_PUBLIC_WORKOS_DOMAIN_HINT");
      const loginHint = getEnvString("EXPO_PUBLIC_WORKOS_LOGIN_HINT");

      const request = new AuthSession.AuthRequest({
        clientId: workosClientId,
        redirectUri,
        responseType: AuthSession.ResponseType.Code,
        usePKCE: true,
        scopes: [],
        extraParams: {
          provider: "authkit",
          screen_hint: "sign-in",
          ...(organizationId && {
            organization_id: organizationId,
          }),
          ...(connectionId && {
            connection_id: connectionId,
          }),
          ...(domainHint && {
            domain_hint: domainHint,
          }),
          ...(loginHint && {
            login_hint: loginHint,
          }),
        },
      });

      const result = await request.promptAsync({
        authorizationEndpoint: `${baseUrl}/user_management/authorize`,
      });

      if (result.type === "cancel" || result.type === "dismiss") {
        return;
      }

      if (result.type === "error") {
        const errorDescription =
          isRecord(result.params) &&
          typeof result.params.error_description === "string"
            ? result.params.error_description
            : "WorkOS login did not complete.";
        throw new Error(errorDescription);
      }

      if (result.type !== "success") {
        throw new Error("WorkOS login did not complete.");
      }

      const code = result.params.code;
      const state = result.params.state;

      if (!code) {
        throw new Error("Missing authorization code from WorkOS callback.");
      }

      if (!request.codeVerifier) {
        throw new Error("Missing PKCE code verifier.");
      }

      if (request.state && state !== request.state) {
        throw new Error("State mismatch in WorkOS callback.");
      }

      const authResponse = await authenticateWithCode({
        baseUrl,
        code,
        codeVerifier: request.codeVerifier,
        workosClientId,
      });
      const nextUser = toAuthUser(
        authResponse.user,
        authResponse.authentication_method,
      );

      setUser(nextUser);

      await setStoredAuthSessionRaw(
        JSON.stringify({
          user: nextUser,
          accessToken: authResponse.access_token,
          refreshToken: authResponse.refresh_token,
          authenticationMethod: authResponse.authentication_method,
          organizationId: authResponse.organization_id ?? null,
          workosClientId,
          redirectUri,
          loggedInAt: new Date().toISOString(),
        } satisfies StoredAuthSession),
      );
    } catch (error) {
      console.warn("Failed to start WorkOS login", error);
      const message =
        error instanceof Error
          ? error.message
          : "Unable to start WorkOS login flow.";
      Alert.alert("Login failed", message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    void clearStoredAuthSessionRaw();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(user),
      user,
      isLoading: isLoading || isHydrating,
      startWorkOSLogin,
      logout,
    }),
    [isHydrating, isLoading, logout, startWorkOSLogin, user],
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
