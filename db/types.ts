export type StoredUserProfile = {
  userId: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  profilePictureUrl?: string;
  emailVerified: boolean;
  locale?: string;
  updatedAt: string;
};

export type StoredFlowCycle = {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  cycleLength: number;
  periodLength: number;
  createdAt: string;
  updatedAt: string;
};

export type SaveFlowCycleInput = {
  id?: string;
  userId: string;
  startDate: string;
  endDate: string;
  cycleLength: number;
  periodLength: number;
};
