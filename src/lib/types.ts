export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'manager' | 'user';
  name: string;
  email: string;
  isActive: boolean;
  requiresPasswordChange: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Item {
  id: string;
  name: string;
  cost: number;
  managerCost?: number;
  userCost?: number;
  quantity: number;
  locked?: boolean;
  isExtension?: boolean;
}

export interface Section {
  id: string;
  name: string;
  items: Item[];
}

export interface DealDetails {
  customerName: string;
  term: number;
  escalation: number;
  distanceToInstall: number;
  additionalGrossProfit: number;
  settlement: number;
}

export interface FactorData {
  [term: string]: {
    [escalation: string]: {
      [financeRange: string]: number;
    };
  };
}

export interface Scales {
  installation: { [band: string]: number; };
  finance_fee: { [range: string]: number; };
  gross_profit: { [band: string]: number; };
  additional_costs: { cost_per_kilometer: number; cost_per_point: number; };
}

export interface TotalCosts {
  extensionCount: number;
  hardwareTotal: number;
  hardwareInstallTotal: number;
  baseGrossProfit: number;
  additionalProfit: number;
  totalGrossProfit: number;
  financeFee: number;
  settlementAmount: number;
  financeAmount: number;
  totalPayout: number;
  hardwareRental: number;
  connectivityCost: number;
  licensingCost: number;
  totalMRC: number;
  totalExVat: number;
  totalIncVat: number;
  factorUsed: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  users: User[];
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => boolean;
  addUser: (user: User) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  changePassword: (userId: string, newPassword: string) => void;
  resetPassword: (userId: string, newPassword: string) => void;
  syncUsersToGlobalStorage: () => void;
  loadUsersFromGlobalStorage: () => boolean;
  initializeUsers: () => void;
}

export interface CalculatorState {
  sections: Section[];
  dealDetails: DealDetails;
  initializeStore: () => Promise<void>;
  updateSectionItem: (sectionId: string, itemId: string, updates: Partial<Item>) => void;
  addTemporaryItem: (sectionId: string, item: Item) => void;
  updateDealDetails: (updates: Partial<DealDetails>) => void;
  saveDeal: () => Promise<boolean>;
  calculateTotalCosts: () => TotalCosts;
}

export interface OfflineState {
  isOnline: boolean;
  setOnlineStatus: (status: boolean) => void;
}

export interface Toast {
  show: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
} 