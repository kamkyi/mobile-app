import type {
  SaveProfessionalProfileInput,
  SaveFlowCycleInput,
  StoredProfessionalProfile,
  StoredFlowCycle,
  StoredUserProfile,
} from "@/db/types";

const LOCAL_STORAGE_KEY = "app.db.v1";

type PersistedState = {
  flowCycles: StoredFlowCycle[];
  professionalProfiles: StoredProfessionalProfile[];
  userProfiles: StoredUserProfile[];
};

function createEmptyState(): PersistedState {
  return {
    flowCycles: [],
    professionalProfiles: [],
    userProfiles: [],
  };
}

function sanitizeState(value: unknown): PersistedState {
  if (!value || typeof value !== "object") {
    return createEmptyState();
  }

  const parsed = value as Partial<PersistedState>;
  const professionalProfiles = Array.isArray(parsed.professionalProfiles)
    ? parsed.professionalProfiles.map((item) => ({
        ...item,
        bio: typeof item?.bio === "string" ? item.bio : undefined,
        serviceLatitude:
          typeof item?.serviceLatitude === "number"
            ? item.serviceLatitude
            : undefined,
        serviceLongitude:
          typeof item?.serviceLongitude === "number"
            ? item.serviceLongitude
            : undefined,
        serviceLocation:
          typeof item?.serviceLocation === "string" ? item.serviceLocation : "",
        genders: Array.isArray(item?.genders)
          ? item.genders.filter((gender) => typeof gender === "string")
          : [],
        roles: Array.isArray(item?.roles)
          ? item.roles.filter((role) => typeof role === "string")
          : [],
      }))
    : [];

  return {
    flowCycles: Array.isArray(parsed.flowCycles) ? parsed.flowCycles : [],
    professionalProfiles,
    userProfiles: Array.isArray(parsed.userProfiles) ? parsed.userProfiles : [],
  };
}

let state = createEmptyState();
let initialized = false;

function ensureInitialized() {
  if (initialized || typeof window === "undefined") {
    initialized = true;
    return;
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    state = raw ? sanitizeState(JSON.parse(raw)) : createEmptyState();
  } catch {
    state = createEmptyState();
  }

  initialized = true;
}

function persist() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota/private mode persistence failures on web.
  }
}

export async function listFlowCyclesByUserId(userId: string) {
  ensureInitialized();

  return state.flowCycles
    .filter((item) => item.userId === userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function saveFlowCycle(input: SaveFlowCycleInput) {
  ensureInitialized();

  const now = new Date().toISOString();
  const existingIndex = input.id
    ? state.flowCycles.findIndex((item) => item.id === input.id)
    : -1;
  const existing = existingIndex >= 0 ? state.flowCycles[existingIndex] : undefined;

  const nextRecord: StoredFlowCycle = {
    id:
      input.id ??
      `flow-${input.userId}-${Date.now().toString(36)}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
    userId: input.userId,
    startDate: input.startDate,
    endDate: input.endDate,
    cycleLength: input.cycleLength,
    periodLength: input.periodLength,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  if (existingIndex >= 0) {
    state.flowCycles[existingIndex] = nextRecord;
  } else {
    state.flowCycles.unshift(nextRecord);
  }

  persist();

  return nextRecord;
}

export async function upsertUserProfile(profile: StoredUserProfile) {
  ensureInitialized();

  const existingIndex = state.userProfiles.findIndex(
    (item) => item.userId === profile.userId,
  );

  if (existingIndex >= 0) {
    state.userProfiles[existingIndex] = profile;
  } else {
    state.userProfiles.push(profile);
  }

  persist();
}

export async function getUserProfile(userId: string) {
  ensureInitialized();
  return state.userProfiles.find((item) => item.userId === userId) ?? null;
}

export async function listUserProfiles() {
  ensureInitialized();
  return [...state.userProfiles].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getProfessionalProfile(userId: string) {
  ensureInitialized();
  return state.professionalProfiles.find((item) => item.userId === userId) ?? null;
}

export async function listProfessionalProfiles() {
  ensureInitialized();
  return [...state.professionalProfiles].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}

export async function saveProfessionalProfile(input: SaveProfessionalProfileInput) {
  ensureInitialized();

  const now = new Date().toISOString();
  const existingIndex = state.professionalProfiles.findIndex(
    (item) => item.userId === input.userId,
  );
  const existing =
    existingIndex >= 0 ? state.professionalProfiles[existingIndex] : undefined;

  const nextProfile: StoredProfessionalProfile = {
    userId: input.userId,
    roles: [...input.roles],
    genders: [...input.genders],
    nickname: input.nickname,
    dateOfBirth: input.dateOfBirth,
    serviceLocation: input.serviceLocation,
    serviceLatitude: input.serviceLatitude,
    serviceLongitude: input.serviceLongitude,
    bio: input.bio,
    profileImageUri: input.profileImageUri,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  if (existingIndex >= 0) {
    state.professionalProfiles[existingIndex] = nextProfile;
  } else {
    state.professionalProfiles.push(nextProfile);
  }

  persist();
  return nextProfile;
}
