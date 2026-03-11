import type {
  SaveFlowCycleInput,
  StoredFlowCycle,
  StoredUserProfile,
} from "@/db/types";

const LOCAL_STORAGE_KEY = "app.db.v1";

type PersistedState = {
  flowCycles: StoredFlowCycle[];
  userProfiles: StoredUserProfile[];
};

function createEmptyState(): PersistedState {
  return {
    flowCycles: [],
    userProfiles: [],
  };
}

function sanitizeState(value: unknown): PersistedState {
  if (!value || typeof value !== "object") {
    return createEmptyState();
  }

  const parsed = value as Partial<PersistedState>;

  return {
    flowCycles: Array.isArray(parsed.flowCycles) ? parsed.flowCycles : [],
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
