import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  FRANCHISES,
  CLIENTS,
  SUBSCRIBERS,
  SERVICES,
  USERS,
  COUPONS,
  PLANS,
  MOCK_FINANCIAL_ENTRIES,
  type Franchise,
  type Client,
  type Subscriber,
  type User,
  type Coupon,
  type Plan,
  type FinancialEntry,
  type CostCenter,
  COST_CENTERS,
} from "./mock-data";

export type Profile = "franquia" | "franqueado";

interface AppContextValue {
  profile: Profile;
  setProfile: (p: Profile) => void;
  selectedFranchiseId: string;
  setSelectedFranchiseId: (id: string) => void;
  availableFranchises: Franchise[];
  currentFranchise: Franchise;
  
  // Reactive Lists
  franchises: Franchise[];
  setFranchises: React.Dispatch<React.SetStateAction<Franchise[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  services: typeof SERVICES;
  setServices: React.Dispatch<React.SetStateAction<typeof SERVICES>>;
  coupons: Coupon[];
  setCoupons: React.Dispatch<React.SetStateAction<Coupon[]>>;
  plans: Plan[];
  setPlans: React.Dispatch<React.SetStateAction<Plan[]>>;
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  subscribers: Subscriber[];
  setSubscribers: React.Dispatch<React.SetStateAction<Subscriber[]>>;
  financialEntries: FinancialEntry[];
  setFinancialEntries: React.Dispatch<React.SetStateAction<FinancialEntry[]>>;
  costCenters: CostCenter[];
  setCostCenters: React.Dispatch<React.SetStateAction<CostCenter[]>>;

  // Helper function
  isSubscribed: (plate: string) => Subscriber | undefined;
}

const AppContext = createContext<AppContextValue | null>(null);

const FRANQUEADO_IDS = ["f-001", "f-002", "f-003"];

export function AppProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<Profile>("franquia");
  const [selectedFranchiseId, setSelectedFranchiseIdState] = useState<string>(FRANCHISES[0].id);

  // Lists state
  const [franchises, setFranchises] = useState<Franchise[]>(FRANCHISES);
  const [users, setUsers] = useState<User[]>(USERS);
  const [services, setServices] = useState<typeof SERVICES>(SERVICES);
  const [coupons, setCoupons] = useState<Coupon[]>(COUPONS);
  const [plans, setPlans] = useState<Plan[]>(PLANS);
  const [clients, setClients] = useState<Client[]>(CLIENTS);
  const [subscribers, setSubscribers] = useState<Subscriber[]>(SUBSCRIBERS);
  const [financialEntries, setFinancialEntries] = useState<FinancialEntry[]>(MOCK_FINANCIAL_ENTRIES);
  const [costCenters, setCostCenters] = useState<CostCenter[]>(COST_CENTERS);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = localStorage.getItem("lt-profile") as Profile | null;
    const f = localStorage.getItem("lt-franchise");
    
    if (p) setProfileState(p);
    if (f) setSelectedFranchiseIdState(f);

    const loadLocal = <T,>(key: string, setter: (val: T) => void) => {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          setter(JSON.parse(stored));
        } catch (e) {
          console.error(`Failed to load ${key} from localStorage`, e);
        }
      }
    };

    loadLocal("lt-franchises", setFranchises);
    loadLocal("lt-users", setUsers);
    loadLocal("lt-services", setServices);
    loadLocal("lt-coupons", setCoupons);
    loadLocal("lt-plans", setPlans);
    loadLocal("lt-clients", setClients);
    loadLocal("lt-subscribers", setSubscribers);
    loadLocal("lt-financial-entries", setFinancialEntries);
    loadLocal("lt-cost-centers", setCostCenters);
  }, []);

  // Sync state helpers
  const saveToLocal = (key: string, data: any) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, JSON.stringify(data));
    }
  };

  const setFranchisesWithSync = (val: Franchise[] | ((curr: Franchise[]) => Franchise[])) => {
    setFranchises((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      saveToLocal("lt-franchises", next);
      return next;
    });
  };

  const setUsersWithSync = (val: User[] | ((curr: User[]) => User[])) => {
    setUsers((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      saveToLocal("lt-users", next);
      return next;
    });
  };

  const setServicesWithSync = (val: typeof SERVICES | ((curr: typeof SERVICES) => typeof SERVICES)) => {
    setServices((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      saveToLocal("lt-services", next);
      return next;
    });
  };

  const setCouponsWithSync = (val: Coupon[] | ((curr: Coupon[]) => Coupon[])) => {
    setCoupons((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      saveToLocal("lt-coupons", next);
      return next;
    });
  };

  const setPlansWithSync = (val: Plan[] | ((curr: Plan[]) => Plan[])) => {
    setPlans((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      saveToLocal("lt-plans", next);
      return next;
    });
  };

  const setClientsWithSync = (val: Client[] | ((curr: Client[]) => Client[])) => {
    setClients((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      saveToLocal("lt-clients", next);
      return next;
    });
  };

  const setSubscribersWithSync = (val: Subscriber[] | ((curr: Subscriber[]) => Subscriber[])) => {
    setSubscribers((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      saveToLocal("lt-subscribers", next);
      return next;
    });
  };

  const setFinancialEntriesWithSync = (val: FinancialEntry[] | ((curr: FinancialEntry[]) => FinancialEntry[])) => {
    setFinancialEntries((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      saveToLocal("lt-financial-entries", next);
      return next;
    });
  };

  const setCostCentersWithSync = (val: CostCenter[] | ((curr: CostCenter[]) => CostCenter[])) => {
    setCostCenters((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      saveToLocal("lt-cost-centers", next);
      return next;
    });
  };

  const setProfile = (p: Profile) => {
    setProfileState(p);
    localStorage.setItem("lt-profile", p);
    // Franqueado: garantir que franquia atual está permitida
    if (p === "franqueado" && !FRANQUEADO_IDS.includes(selectedFranchiseId)) {
      setSelectedFranchiseIdState(FRANQUEADO_IDS[0]);
      localStorage.setItem("lt-franchise", FRANQUEADO_IDS[0]);
    }
  };

  const setSelectedFranchiseId = (id: string) => {
    setSelectedFranchiseIdState(id);
    localStorage.setItem("lt-franchise", id);
  };

  const availableFranchises =
    profile === "franquia" ? franchises : franchises.filter((f) => FRANQUEADO_IDS.includes(f.id));

  const currentFranchise =
    availableFranchises.find((f) => f.id === selectedFranchiseId) ?? availableFranchises[0] ?? franchises[0];

  const isSubscribed = (plate: string) => {
    return subscribers.find((s) => s.plate.toUpperCase() === plate.toUpperCase());
  };

  return (
    <AppContext.Provider
      value={{
        profile,
        setProfile,
        selectedFranchiseId: currentFranchise ? currentFranchise.id : "",
        setSelectedFranchiseId,
        availableFranchises,
        currentFranchise,

        // Lists
        franchises,
        setFranchises: setFranchisesWithSync,
        users,
        setUsers: setUsersWithSync,
        services,
        setServices: setServicesWithSync,
        coupons,
        setCoupons: setCouponsWithSync,
        plans,
        setPlans: setPlansWithSync,
        clients,
        setClients: setClientsWithSync,
        subscribers,
        setSubscribers: setSubscribersWithSync,
        financialEntries,
        setFinancialEntries: setFinancialEntriesWithSync,
        costCenters,
        setCostCenters: setCostCentersWithSync,

        // Helpers
        isSubscribed,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
