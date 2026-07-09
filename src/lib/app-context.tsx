import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { FRANCHISES, type Franchise } from "./mock-data";

export type Profile = "franquia" | "franqueado";

interface AppContextValue {
  profile: Profile;
  setProfile: (p: Profile) => void;
  selectedFranchiseId: string;
  setSelectedFranchiseId: (id: string) => void;
  availableFranchises: Franchise[];
  currentFranchise: Franchise;
}

const AppContext = createContext<AppContextValue | null>(null);

// Franqueado só vê estas 2
const FRANQUEADO_IDS = ["f-001", "f-003"];

export function AppProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<Profile>("franquia");
  const [selectedFranchiseId, setSelectedFranchiseIdState] = useState<string>(FRANCHISES[0].id);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = localStorage.getItem("lt-profile") as Profile | null;
    const f = localStorage.getItem("lt-franchise");
    if (p) setProfileState(p);
    if (f) setSelectedFranchiseIdState(f);
  }, []);

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
    profile === "franquia" ? FRANCHISES : FRANCHISES.filter((f) => FRANQUEADO_IDS.includes(f.id));

  const currentFranchise =
    availableFranchises.find((f) => f.id === selectedFranchiseId) ?? availableFranchises[0];

  return (
    <AppContext.Provider
      value={{
        profile,
        setProfile,
        selectedFranchiseId: currentFranchise.id,
        setSelectedFranchiseId,
        availableFranchises,
        currentFranchise,
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
