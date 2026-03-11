import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";

import type {
  SaveFlowCycleInput,
  StoredFlowCycle,
  StoredUserProfile,
} from "@/db/types";

const DATABASE_NAME = "links.db";
const DATABASE_VERSION = 1;

type FlowCycleRow = {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  cycle_length: number;
  period_length: number;
  created_at: string;
  updated_at: string;
};

type UserProfileRow = {
  user_id: string;
  email: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
  profile_picture_url: string | null;
  email_verified: number;
  locale: string | null;
  updated_at: string;
};

const CREATE_USER_PROFILES_TABLE = `
  CREATE TABLE IF NOT EXISTS user_profiles (
    user_id TEXT PRIMARY KEY NOT NULL,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    profile_picture_url TEXT,
    email_verified INTEGER NOT NULL DEFAULT 0,
    locale TEXT,
    updated_at TEXT NOT NULL
  );
`;

const CREATE_FLOW_CYCLES_TABLE = `
  CREATE TABLE IF NOT EXISTS flow_cycles (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    cycle_length INTEGER NOT NULL,
    period_length INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`;

const CREATE_FLOW_CYCLES_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_flow_cycles_user_updated
  ON flow_cycles (user_id, updated_at DESC);
`;

function mapFlowCycleRow(row: FlowCycleRow): StoredFlowCycle {
  return {
    id: row.id,
    userId: row.user_id,
    startDate: row.start_date,
    endDate: row.end_date,
    cycleLength: row.cycle_length,
    periodLength: row.period_length,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapUserProfileRow(row: UserProfileRow): StoredUserProfile {
  return {
    userId: row.user_id,
    email: row.email,
    name: row.name,
    firstName: row.first_name ?? undefined,
    lastName: row.last_name ?? undefined,
    profilePictureUrl: row.profile_picture_url ?? undefined,
    emailVerified: Boolean(row.email_verified),
    locale: row.locale ?? undefined,
    updatedAt: row.updated_at,
  };
}

let dbPromise: Promise<SQLiteDatabase> | null = null;

async function getDatabase() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await openDatabaseAsync(DATABASE_NAME);
      await db.execAsync("PRAGMA journal_mode = WAL;");
      await db.execAsync(CREATE_USER_PROFILES_TABLE);
      await db.execAsync(CREATE_FLOW_CYCLES_TABLE);
      await db.execAsync(CREATE_FLOW_CYCLES_INDEX);
      await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION};`);
      return db;
    })();
  }

  return dbPromise;
}

export async function listFlowCyclesByUserId(userId: string) {
  const db = await getDatabase();
  const rows = await db.getAllAsync<FlowCycleRow>(
    `
      SELECT
        id,
        user_id,
        start_date,
        end_date,
        cycle_length,
        period_length,
        created_at,
        updated_at
      FROM flow_cycles
      WHERE user_id = ?
      ORDER BY updated_at DESC
    `,
    userId,
  );

  return rows.map(mapFlowCycleRow);
}

export async function saveFlowCycle(input: SaveFlowCycleInput) {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const nextId =
    input.id ??
    `flow-${input.userId}-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  const existing = await db.getFirstAsync<{ created_at: string }>(
    "SELECT created_at FROM flow_cycles WHERE id = ?",
    nextId,
  );
  const createdAt = existing?.created_at ?? now;

  await db.runAsync(
    `
      INSERT INTO flow_cycles (
        id,
        user_id,
        start_date,
        end_date,
        cycle_length,
        period_length,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        user_id = excluded.user_id,
        start_date = excluded.start_date,
        end_date = excluded.end_date,
        cycle_length = excluded.cycle_length,
        period_length = excluded.period_length,
        updated_at = excluded.updated_at
    `,
    nextId,
    input.userId,
    input.startDate,
    input.endDate,
    input.cycleLength,
    input.periodLength,
    createdAt,
    now,
  );

  return {
    id: nextId,
    userId: input.userId,
    startDate: input.startDate,
    endDate: input.endDate,
    cycleLength: input.cycleLength,
    periodLength: input.periodLength,
    createdAt,
    updatedAt: now,
  };
}

export async function upsertUserProfile(profile: StoredUserProfile) {
  const db = await getDatabase();

  await db.runAsync(
    `
      INSERT INTO user_profiles (
        user_id,
        email,
        name,
        first_name,
        last_name,
        profile_picture_url,
        email_verified,
        locale,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        email = excluded.email,
        name = excluded.name,
        first_name = excluded.first_name,
        last_name = excluded.last_name,
        profile_picture_url = excluded.profile_picture_url,
        email_verified = excluded.email_verified,
        locale = excluded.locale,
        updated_at = excluded.updated_at
    `,
    profile.userId,
    profile.email,
    profile.name,
    profile.firstName ?? null,
    profile.lastName ?? null,
    profile.profilePictureUrl ?? null,
    profile.emailVerified ? 1 : 0,
    profile.locale ?? null,
    profile.updatedAt,
  );
}

export async function getUserProfile(userId: string) {
  const db = await getDatabase();
  const row = await db.getFirstAsync<UserProfileRow>(
    `
      SELECT
        user_id,
        email,
        name,
        first_name,
        last_name,
        profile_picture_url,
        email_verified,
        locale,
        updated_at
      FROM user_profiles
      WHERE user_id = ?
      LIMIT 1
    `,
    userId,
  );

  return row ? mapUserProfileRow(row) : null;
}
