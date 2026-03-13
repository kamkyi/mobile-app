import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import {
  MAX_PROFESSIONAL_ROLE_SELECTION,
  normalizeProfessionalRoles,
} from "@/constants/professional";
import { type AuthUser, useAuth } from "@/context/AuthContext";
import {
  getProfessionalProfile,
  getUserProfile,
  listFlowCyclesByUserId,
  saveProfessionalProfile as persistProfessionalProfile,
  saveFlowCycle,
  upsertUserProfile,
} from "@/db/storage";
import type {
  SaveProfessionalProfileInput,
  SaveFlowCycleInput,
  StoredProfessionalProfile,
  StoredFlowCycle,
  StoredUserProfile,
} from "@/db/types";

type AppDataContextValue = {
  isReady: boolean;
  currentProfessionalProfile: StoredProfessionalProfile | null;
  currentUserProfile: StoredUserProfile | null;
  saveProfessionalProfile: (
    input: Omit<SaveProfessionalProfileInput, "userId">,
  ) => Promise<StoredProfessionalProfile>;
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
  const [currentProfessionalProfile, setCurrentProfessionalProfile] =
    useState<StoredProfessionalProfile | null>(null);
  const [currentUserProfile, setCurrentUserProfile] =
    useState<StoredUserProfile | null>(null);

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      try {
        if (!user) {
          if (isMounted) {
            setCurrentProfessionalProfile(null);
            setCurrentUserProfile(null);
            setIsReady(true);
          }
          return;
        }

        const nextProfile = toStoredUserProfile(user);
        await upsertUserProfile(nextProfile);
        const [storedProfile, storedProfessionalProfile] = await Promise.all([
          getUserProfile(user.id),
          getProfessionalProfile(user.id),
        ]);

        if (isMounted) {
          setCurrentProfessionalProfile(storedProfessionalProfile);
          setCurrentUserProfile(storedProfile ?? nextProfile);
          setIsReady(true);
        }
      } catch (error) {
        console.warn("Failed to initialize local app data", error);
        if (isMounted) {
          setCurrentProfessionalProfile(null);
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

  const saveProfessionalProfile = useCallback(
    async (input: Omit<SaveProfessionalProfileInput, "userId">) => {
      if (!user) {
        throw new Error("You must be logged in to save a professional profile.");
      }

      const roles = normalizeProfessionalRoles(input.roles).slice(
        0,
        MAX_PROFESSIONAL_ROLE_SELECTION,
      );
      const nextProfile = await persistProfessionalProfile({
        ...input,
        roles,
        userId: user.id,
      });
      setCurrentProfessionalProfile(nextProfile);
      return nextProfile;
    },
    [user],
  );

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
      currentProfessionalProfile,
      currentUserProfile,
      saveProfessionalProfile,
      loadFlowCycles,
      saveFlowRecord,
    }),
    [
      currentProfessionalProfile,
      currentUserProfile,
      isReady,
      loadFlowCycles,
      saveFlowRecord,
      saveProfessionalProfile,
    ],
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
