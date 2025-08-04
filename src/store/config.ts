import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Item, FactorData, Scales } from '@/lib/types';

interface ConfigState {
  hardware: Item[];
  connectivity: Item[];
  licensing: Item[];
  factors: FactorData;
  scales: Scales;
  
  // Actions
  updateHardware: (items: Item[]) => void;
  updateConnectivity: (items: Item[]) => void;
  updateLicensing: (items: Item[]) => void;
  updateFactors: (factors: FactorData) => void;
  updateScales: (scales: Scales) => void;
  
  // Load from API (read-only)
  loadFromAPI: () => Promise<void>;
}

// Default configurations
const DEFAULT_HARDWARE: Item[] = [
  { id: "hw1", name: "Desk Phone B&W", cost: 1054, quantity: 0, isExtension: true },
  { id: "hw2", name: "Desk Phone Colour", cost: 1378, quantity: 0, isExtension: true },
  { id: "hw3", name: "Switchboard Colour", cost: 2207, quantity: 0, isExtension: true },
  { id: "hw4", name: "Cordless Phone", cost: 2420, quantity: 0, isExtension: true },
  { id: "hw5", name: "Bluetooth Headset Mono", cost: 1996, quantity: 0, isExtension: false },
  { id: "hw6", name: "Bluetooth Headset Dual", cost: 2340, quantity: 0, isExtension: false },
  { id: "hw7", name: "Corded Headset Dual", cost: 1467, quantity: 0, isExtension: false },
  { id: "hw8", name: "Cellphone", cost: 7500, quantity: 0, isExtension: false },
  { id: "hw9", name: "4 Port PoE", cost: 644, quantity: 0, isExtension: false },
  { id: "hw10", name: "8 Port PoE", cost: 813, quantity: 0, isExtension: false },
  { id: "hw11", name: "16 Port PoE", cost: 2282, quantity: 0, isExtension: false },
  { id: "hw12", name: "8 Port Managed PoE", cost: 1657, quantity: 0, isExtension: false },
  { id: "hw13", name: "16 Port Managed PoE", cost: 2994, quantity: 0, isExtension: false },
  { id: "hw14", name: "Access Point Gigabit", cost: 1350, quantity: 0, isExtension: false },
  { id: "hw15", name: "Cloud Router WAN2", cost: 1613, quantity: 0, isExtension: false },
  { id: "hw16", name: "5G/LTE Router", cost: 1800, quantity: 0, isExtension: false },
  { id: "hw17", name: "PC", cost: 9000, quantity: 0, isExtension: false },
  { id: "hw18", name: "A4 Copier", cost: 17000, quantity: 0, isExtension: false },
  { id: "hw19", name: "Server Cabinet", cost: 1466.25, quantity: 0, isExtension: false },
  { id: "hw20", name: "Additional Mobile App", cost: 0, quantity: 0, isExtension: false },
  { id: "hw21", name: "Additional App on Own Device", cost: 0, quantity: 0, isExtension: false },
  { id: "hw22", name: "Number Porting Per Number", cost: 200, quantity: 0, isExtension: false }
];

const DEFAULT_CONNECTIVITY: Item[] = [
  { id: "conn1", name: "LTE", cost: 599, quantity: 0 },
  { id: "conn2", name: "Fibre", cost: 599, quantity: 0 },
  { id: "conn3", name: "Melon Sim Card", cost: 350, quantity: 0 }
];

const DEFAULT_LICENSING: Item[] = [
  { id: "lic1", name: "Premium License", cost: 90, quantity: 0 },
  { id: "lic2", name: "Service Level Agreement (0 - 5 users)", cost: 299, quantity: 0 },
  { id: "lic3", name: "Service Level Agreement (6 - 10 users)", cost: 399, quantity: 0 },
  { id: "lic4", name: "Service Level Agreement (11 users or more)", cost: 499, quantity: 0 }
];

const DEFAULT_FACTORS: FactorData = {
  "36_months": {
    "0%": {
      "0-20000": 0.03814,
      "20001-50000": 0.03814,
      "50001-100000": 0.03755,
      "100000+": 0.03707
    },
    "10%": {
      "0-20000": 0.03511,
      "20001-50000": 0.03511,
      "50001-100000": 0.03454,
      "100000+": 0.03409
    },
    "15%": {
      "0-20000": 0.04133,
      "20001-50000": 0.04003,
      "50001-100000": 0.03883,
      "100000+": 0.03803
    }
  },
  "48_months": {
    "0%": {
      "0-20000": 0.03155,
      "20001-50000": 0.03155,
      "50001-100000": 0.03093,
      "100000+": 0.03043
    },
    "10%": {
      "0-20000": 0.02805,
      "20001-50000": 0.02805,
      "50001-100000": 0.02741,
      "100000+": 0.02694
    },
    "15%": {
      "0-20000": 0.03375,
      "20001-50000": 0.03245,
      "50001-100000": 0.03125,
      "100000+": 0.03045
    }
  },
  "60_months": {
    "0%": {
      "0-20000": 0.02772,
      "20001-50000": 0.02772,
      "50001-100000": 0.02705,
      "100000+": 0.02658
    },
    "10%": {
      "0-20000": 0.02327,
      "20001-50000": 0.02327,
      "50001-100000": 0.02315,
      "100000+": 0.02267
    },
    "15%": {
      "0-20000": 0.02937,
      "20001-50000": 0.02807,
      "50001-100000": 0.02687,
      "100000+": 0.02607
    }
  }
};

const DEFAULT_SCALES: Scales = {
  installation: {
    "0-4": 3500,
    "5-8": 3500,
    "9-16": 7000,
    "17-32": 10500,
    "33+": 15000
  },
  finance_fee: {
    "0-20000": 1800,
    "20001-50000": 1800,
    "50001-100000": 2800,
    "100001+": 3800
  },
  gross_profit: {
    "0-4": 10000,
    "5-8": 150000,
    "9-16": 20000,
    "17-32": 25000,
    "33+": 30000
  },
  additional_costs: {
    cost_per_kilometer: 1.5,
    cost_per_point: 750
  }
};

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      hardware: DEFAULT_HARDWARE,
      connectivity: DEFAULT_CONNECTIVITY,
      licensing: DEFAULT_LICENSING,
      factors: DEFAULT_FACTORS,
      scales: DEFAULT_SCALES,

      updateHardware: (items: Item[]) => {
        set({ hardware: items });
      },

      updateConnectivity: (items: Item[]) => {
        set({ connectivity: items });
      },

      updateLicensing: (items: Item[]) => {
        set({ licensing: items });
      },

      updateFactors: (factors: FactorData) => {
        set({ factors });
      },

      updateScales: (scales: Scales) => {
        set({ scales });
      },

      loadFromAPI: async () => {
        try {
          // Try to load from API, but fall back to defaults if it fails
          const [hardwareRes, connectivityRes, licensingRes, factorsRes, scalesRes] = await Promise.allSettled([
            fetch('/api/config/hardware'),
            fetch('/api/config/connectivity'),
            fetch('/api/config/licensing'),
            fetch('/api/config/factors'),
            fetch('/api/config/scales')
          ]);

          const hardware = hardwareRes.status === 'fulfilled' && hardwareRes.value.ok 
            ? await hardwareRes.value.json() 
            : DEFAULT_HARDWARE;
          
          const connectivity = connectivityRes.status === 'fulfilled' && connectivityRes.value.ok 
            ? await connectivityRes.value.json() 
            : DEFAULT_CONNECTIVITY;
          
          const licensing = licensingRes.status === 'fulfilled' && licensingRes.value.ok 
            ? await licensingRes.value.json() 
            : DEFAULT_LICENSING;
          
          const factors = factorsRes.status === 'fulfilled' && factorsRes.value.ok 
            ? await factorsRes.value.json() 
            : DEFAULT_FACTORS;
          
          const scales = scalesRes.status === 'fulfilled' && scalesRes.value.ok 
            ? await scalesRes.value.json() 
            : DEFAULT_SCALES;

          set({
            hardware,
            connectivity,
            licensing,
            factors,
            scales
          });
        } catch (error) {
          console.error('Error loading config from API:', error);
          // Keep current state if API fails
        }
      },
    }),
    {
      name: 'config-storage',
    }
  )
); 