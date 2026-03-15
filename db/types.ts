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

export type ProfessionalRoleImageCollection = {
  role: string;
  imageUris: string[];
};

export type ProfessionalShopProduct = {
  id: string;
  title: string;
  description?: string;
  price: number;
  imageUris: string[];
  createdAt: string;
};

export type StoredProfessionalProfile = {
  userId: string;
  roles: string[];
  genders: string[];
  nickname: string;
  dateOfBirth: string;
  serviceLocation: string;
  serviceLatitude?: number;
  serviceLongitude?: number;
  bio?: string;
  profileImageUri?: string;
  walletCoins: number;
  roleImageCollections: ProfessionalRoleImageCollection[];
  shopProducts: ProfessionalShopProduct[];
  createdAt: string;
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

export type SaveProfessionalProfileInput = {
  userId: string;
  roles: string[];
  genders: string[];
  nickname: string;
  dateOfBirth: string;
  serviceLocation: string;
  serviceLatitude?: number;
  serviceLongitude?: number;
  bio?: string;
  profileImageUri?: string;
  walletCoins?: number;
  roleImageCollections?: ProfessionalRoleImageCollection[];
  shopProducts?: ProfessionalShopProduct[];
};
