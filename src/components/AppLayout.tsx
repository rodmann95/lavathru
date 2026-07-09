import { type ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useApp } from "@/lib/app-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building2, User } from "lucide-react";

export function AppLayout({ children }: { children: ReactNode }) {
  const { profile, setProfile, selectedFranchiseId, setSelectedFranchiseId, availableFranchises, currentFranchise } = useApp();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 border-b bg-card/50 backdrop-blur flex items-center gap-3 px-4 sticky top-0 z-30">
            <SidebarTrigger />
            <div className="flex-1 flex items-center gap-3 flex-wrap">
              <Badge variant="outline" className="gap-1.5 py-1">
                <Building2 className="h-3 w-3" />
                {currentFranchise.city}
              </Badge>
              <Select value={selectedFranchiseId} onValueChange={setSelectedFranchiseId}>
                <SelectTrigger className="w-[260px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableFranchises.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Select value={profile} onValueChange={(v) => setProfile(v as "franquia" | "franqueado")}>
                <SelectTrigger className="w-[160px] h-9">
                  <User className="h-3.5 w-3.5 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="franquia">Franquia (Matriz)</SelectItem>
                  <SelectItem value="franqueado">Franqueado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-x-hidden">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
