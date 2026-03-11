import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import { type AuthUser, useAuth } from "@/context/AuthContext";
import { getUserProfile, listFlowCyclesByUserId, saveFlowCycle, upsertUserProfile } from "@/db/storage";
import type {
  SaveFlowCycleInput,
  StoredFlowCycle,
  StoredUserProfile,
} from "@/db/types";

type AppDataContextValue = {
  isReady: boolean;
  currentUserProfile: StoredUserProfile | null;
  loadFlowCycles: () => Promise<StoredFlowCycle[]>;
  saveFlowRecord: (
    input: Omit<SaveFlowCycleInput, "userId">,
  ) => Promise<StoredFlowCycle>;
};

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);

function toStoredUserProfile(user: AuthUser): StoredUserProfile {
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    profilePictureUrl: user.profilePictureUrl,
    emailVerified: Boolean(user.emailVerified),
    locale: user.locale,
    updatedAt: new Date().toISOString(),
  };
}

export function AppDataProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] =
    useState<StoredUserProfile | null>(null);

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      try {
        if (!user) {
          if (isMounted) {
            setCurrentUserProfile(null);
            setIsReady(true);
          }
          return;
        }

        const nextProfile = toStoredUserProfile(user);
        await upsertUserProfile(nextProfile);
        const storedProfile = await getUserProfile(user.id);

        if (isMounted) {
          setCurrentUserProfile(storedProfile ?? nextProfile);
          setIsReady(true);
        }
      } catch (error) {
        console.warn("Failed to initialize local app data", error);
        if (isMounted) {
          setCurrentUserProfile(user ? toStoredUserProfile(user) : null);
          setIsReady(true);
        }
      }
    };

    setIsReady(false);
    void hydrate();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const loadFlowCycles = useCallback(async () => {
    if (!user) {
      return [];
    }

    return listFlowCyclesByUserId(user.id);
  }, [user]);

  const saveFlowRecord = useCallback(
    async (input: Omit<SaveFlowCycleInput, "userId">) => {
      if (!user) {
        throw new Error("You must be logged in to save flow data.");
      }

      return saveFlowCycle({
        ...input,
        userId: user.id,
      });
    },
    [user],
  );

  const value = useMemo<AppDataContextValue>(
    () => ({
      isReady,
      currentUserProfile,
      loadFlowCycles,
      saveFlowRecord,
    }),
    [currentUserProfile, isReady, loadFlowCycles, saveFlowRecord],
  );

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);

  if (!context) {
    throw new Error("useAppData must be used within AppDataProvider");
  }

  return context;
}
