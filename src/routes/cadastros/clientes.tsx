import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trophy, Car, Plus, Settings2, Trash2, Pencil } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { formatBRL } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/cadastros/clientes")({
  head: () => ({ meta: [{ title: "Clientes — Lava Thru" }] }),
  component: ClientesPage,
});

function ClientesPage() {
  const { clients, setClients, subscribers, setSubscribers, plans, franchises, profile, currentFranchise } = useApp();
  const [period, setPeriod] = useState("90");
  const [selected, setSelected] = useState<(typeof clients)[number] | null>(null);

  // Edit client states
  const [editClientTarget, setEditClientTarget] = useState<(typeof clients)[number] | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  function openEditClient(client: (typeof clients)[number]) {
    setEditClientTarget(client);
    setEditName(client.name);
    setEditPhone(client.phone || "");
  }

  function handleSaveClient() {
    if (!editClientTarget || !editName) return;
    setClients(prev => prev.map(c => c.id === editClientTarget.id ? { ...c, name: editName, phone: editPhone } : c));
    
    // Also update selected if it's the one being edited
    if (selected && selected.id === editClientTarget.id) {
      setSelected(prev => prev ? { ...prev, name: editName, phone: editPhone } : null);
    }
    
    toast.success("Cliente atualizado com sucesso!");
    setEditClientTarget(null);
  }

  // Plate and plan management states
  const [newPlateInput, setNewPlateInput] = useState("");
  const [maintenancePlate, setMaintenancePlate] = useState<string | null>(null);

  // Plan maintenance form states
  const [mPlanId, setMPlanId] = useState("");
  const [mFranchiseId, setMFranchiseId] = useState("");
  const [mLavagesIncluded, setMLavagesIncluded] = useState("8");
  const [mLavagesUsed, setMLavagesUsed] = useState("0");

  const ranked = useMemo(() => [...clients].sort((a, b) => b.visits - a.visits), [clients]);

  // Handle adding a new plate to the current client
  function handleAddPlate(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    const cleanPlate = newPlateInput.trim().toUpperCase();
    if (!cleanPlate) {
      toast.error("Por favor, digite uma placa válida");
      return;
    }

    if (selected.plates.includes(cleanPlate)) {
      toast.error("Esta placa já está vinculada a este cliente");
      return;
    }

    // Update clients array
    const updatedClients = clients.map((c) => {
      if (c.id === selected.id) {
        const nextPlates = [...c.plates, cleanPlate];
        return {
          ...c,
          plates: nextPlates,
        };
      }
      return c;
    });

    setClients(updatedClients);
    toast.success(`Placa ${cleanPlate} vinculada com sucesso!`);
    setNewPlateInput("");

    // Update locally selected client display
    setSelected((prev) => prev ? { ...prev, plates: [...prev.plates, cleanPlate] } : null);
  }

  // Handle opening plan maintenance dialog
  function handleOpenMaintenance(plate: string) {
    setMaintenancePlate(plate);
    const sub = subscribers.find((s) => s.plate.toUpperCase() === plate.toUpperCase());
    if (sub) {
      // Find matching plan if possible
      const matchingPlan = plans.find((p) => p.lavagesIncluded === sub.planIncluded) ?? plans[0];
      setMPlanId(matchingPlan?.id || "");
      setMFranchiseId(sub.franchiseId);
      setMLavagesIncluded(sub.planIncluded.toString());
      setMLavagesUsed(sub.planUsed.toString());
    } else {
      setMPlanId(plans[0]?.id || "");
      setMFranchiseId(franchises[0]?.id || "");
      setMLavagesIncluded(plans[0]?.lavagesIncluded.toString() || "8");
      setMLavagesUsed("0");
    }
  }

  // Handle saving plan changes (create or update subscriber)
  function handleSavePlan() {
    if (!selected || !maintenancePlate) return;
    const subIndex = subscribers.findIndex((s) => s.plate.toUpperCase() === maintenancePlate.toUpperCase());
    const selectedPlan = plans.find((p) => p.id === mPlanId);

    const isNew = subIndex === -1;
    const washesIncluded = parseInt(mLavagesIncluded, 10);
    const washesUsed = parseInt(mLavagesUsed, 10);

    let nextSubscribers = [...subscribers];

    if (isNew) {
      const newSub = {
        id: `s-${Math.floor(100 + Math.random() * 900)}`,
        plate: maintenancePlate,
        name: selected.name,
        phone: selected.phone,
        email: `${selected.name.toLowerCase().replace(/\s+/g, "")}@email.com`,
        document: "000.000.000-00",
        planIncluded: washesIncluded,
        planUsed: washesUsed,
        since: new Date().toISOString().split("T")[0],
        franchiseId: mFranchiseId,
      };
      nextSubscribers.push(newSub);
      toast.success(`Plano assinado com sucesso para a placa ${maintenancePlate}!`);
    } else {
      nextSubscribers = nextSubscribers.map((s, idx) => {
        if (idx === subIndex) {
          return {
            ...s,
            planIncluded: washesIncluded,
            planUsed: washesUsed,
            franchiseId: mFranchiseId,
          };
        }
        return s;
      });
      toast.success(`Plano da placa ${maintenancePlate} atualizado com sucesso!`);
    }

    setSubscribers(nextSubscribers);

    // Update subscriber status on the client
    const updatedClients = clients.map((c) => {
      if (c.id === selected.id) {
        // A client is subscriber if any of their plates are in subscribers
        const hasSubscriberPlate = c.plates.some((p) =>
          nextSubscribers.some((s) => s.plate.toUpperCase() === p.toUpperCase())
        );
        return {
          ...c,
          isSubscriber: hasSubscriberPlate,
        };
      }
      return c;
    });
    setClients(updatedClients);

    // Update active modal view
    setSelected((prev) => {
      if (!prev) return null;
      const hasSubscriberPlate = prev.plates.some((p) =>
        nextSubscribers.some((s) => s.plate.toUpperCase() === p.toUpperCase())
      );
      return { ...prev, isSubscriber: hasSubscriberPlate };
    });

    setMaintenancePlate(null);
  }

  // Handle plan cancellation for a plate
  function handleCancelPlan() {
    if (!selected || !maintenancePlate) return;
    if (!confirm(`Tem certeza que deseja cancelar o plano da placa ${maintenancePlate}?`)) return;

    const nextSubscribers = subscribers.filter((s) => s.plate.toUpperCase() !== maintenancePlate.toUpperCase());
    setSubscribers(nextSubscribers);

    // Update client status
    const updatedClients = clients.map((c) => {
      if (c.id === selected.id) {
        const hasSubscriberPlate = c.plates.some((p) =>
          nextSubscribers.some((s) => s.plate.toUpperCase() === p.toUpperCase())
        );
        return {
          ...c,
          isSubscriber: hasSubscriberPlate,
        };
      }
      return c;
    });
    setClients(updatedClients);

    setSelected((prev) => {
      if (!prev) return null;
      const hasSubscriberPlate = prev.plates.some((p) =>
        nextSubscribers.some((s) => s.plate.toUpperCase() === p.toUpperCase())
      );
      return { ...prev, isSubscriber: hasSubscriberPlate };
    });

    toast.success(`Assinatura do veículo ${maintenancePlate} cancelada.`);
    setMaintenancePlate(null);
  }

  // Sync included wash defaults when plan type changes in dropdown
  function handlePlanChange(planId: string) {
    setMPlanId(planId);
    const selectedPlan = plans.find((p) => p.id === planId);
    if (selectedPlan) {
      setMLavagesIncluded(selectedPlan.lavagesIncluded.toString());
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">Ranking por uso e faturamento</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
            <SelectItem value="all">Todo o período</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader><CardTitle>Ranking de clientes</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Placas Vinculadas</TableHead>
                <TableHead className="text-right">Visitas</TableHead>
                <TableHead className="text-right">Total gasto</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranked.map((c, i) => (
                <TableRow key={c.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell>
                    {i < 3 ? <Trophy className={`h-4 w-4 ${["text-yellow-500", "text-slate-400", "text-orange-600"][i]}`} /> : i + 1}
                  </TableCell>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="font-mono text-sm max-w-[200px] truncate">
                    {c.plates?.join(", ") || c.plate}
                  </TableCell>
                  <TableCell className="text-right font-semibold">{c.visits}</TableCell>
                  <TableCell className="text-right">{formatBRL(c.totalSpent)}</TableCell>
                  <TableCell>
                    {c.isSubscriber ? <Badge className="bg-brand text-brand-foreground">Assinante</Badge> : <Badge variant="outline">Avulso</Badge>}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditClient(c)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setSelected(c)}>Detalhes</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Main Details Dialog */}
      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-md md:max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name}</DialogTitle>
                <DialogDescription>{selected.phone}</DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-3 gap-3 py-2">
                <Stat label="Visitas" value={selected.visits.toString()} />
                <Stat label="Total gasto" value={formatBRL(selected.totalSpent)} />
                <Stat label="Última visita" value={new Date(selected.lastVisit).toLocaleDateString("pt-BR")} />
              </div>
              
              <div className="text-sm pb-2">
                <div className="font-semibold mb-1">Status do Assinante:</div>
                {selected.isSubscriber
                  ? <Badge className="bg-brand text-brand-foreground">Assinante Ativo</Badge>
                  : <Badge variant="outline">Cliente avulso</Badge>}
              </div>

              {/* Múltiplas Placas */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-bold text-sm text-foreground">Placas Vinculadas ({selected.plates?.length || 1})</h3>
                
                {/* Form para vincular nova placa */}
                <form onSubmit={handleAddPlate} className="flex gap-2">
                  <Input
                    placeholder="Adicionar Placa (ex: BRA2E19)"
                    value={newPlateInput}
                    onChange={(e) => setNewPlateInput(e.target.value.toUpperCase())}
                    className="font-mono uppercase max-w-[200px]"
                  />
                  <Button type="submit" size="sm" className="bg-brand text-brand-foreground hover:opacity-90">
                    <Plus className="h-4 w-4 mr-1" /> Vincular
                  </Button>
                </form>

                {/* Lista de Placas */}
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {(selected.plates || [selected.plate]).map((plate) => {
                    const sub = subscribers.find((s) => s.plate.toUpperCase() === plate.toUpperCase());
                    return (
                      <div key={plate} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/10 transition-colors">
                        <div className="space-y-1">
                          <div className="font-mono font-bold text-base flex items-center gap-1.5">
                            <Car className="h-4 w-4 text-brand" />
                            {plate}
                          </div>
                          {sub ? (
                            <div className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                              <Badge className="bg-success text-success-foreground text-[10px] h-4">
                                {sub.planIncluded === 8 ? "Bronze" : sub.planIncluded === 12 ? "Prata" : sub.planIncluded === 40 ? "Ouro" : "Personalizado"}
                              </Badge>
                              <span>Uso: {sub.planUsed}/{sub.planIncluded} lavagens</span>
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground">
                              <Badge variant="outline" className="text-[10px] h-4">Sem plano</Badge>
                            </div>
                          )}
                        </div>
                        <Button size="sm" variant="outline" onClick={() => handleOpenMaintenance(plate)} className="h-8 gap-1">
                          <Settings2 className="h-3.5 w-3.5" />
                          Plano
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Plan Maintenance Dialog */}
      <Dialog open={!!maintenancePlate} onOpenChange={(v) => !v && setMaintenancePlate(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manutenção do Plano</DialogTitle>
            <DialogDescription>
              Ajuste as configurações de assinatura para a placa: <span className="font-mono font-bold">{maintenancePlate}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Selecionar Plano</Label>
              <Select value={mPlanId} onValueChange={handlePlanChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {plans.map((p) => {
                    const priceForSelectedFranchise = p.priceOverrides?.[mFranchiseId] ?? p.price;
                    return (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} — {formatBRL(priceForSelectedFranchise)}/mês ({p.lavagesIncluded} lavagens)
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {profile === "franqueado" && mPlanId && (
                <div className="text-[11px] text-muted-foreground flex justify-between items-center mt-1 px-1">
                  <span>Taxa de Franquia (Royalties {currentFranchise.royaltyFeePercent}%)</span>
                  <span className="font-semibold">
                    {(() => {
                      const selectedPlan = plans.find((p) => p.id === mPlanId);
                      if (!selectedPlan) return "—";
                      const priceForSelectedFranchise = selectedPlan.priceOverrides?.[mFranchiseId] ?? selectedPlan.price;
                      return formatBRL(priceForSelectedFranchise * (currentFranchise.royaltyFeePercent / 100));
                    })()}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Vincular Unidade Responsável</Label>
              <Select value={mFranchiseId} onValueChange={setMFranchiseId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {franchises.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="mIncluded">Lavagens Incluídas</Label>
                <Input
                  id="mIncluded"
                  type="number"
                  value={mLavagesIncluded}
                  onChange={(e) => setMLavagesIncluded(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mUsed">Lavagens Usadas</Label>
                <Input
                  id="mUsed"
                  type="number"
                  value={mLavagesUsed}
                  onChange={(e) => setMLavagesUsed(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {subscribers.some((s) => s.plate.toUpperCase() === maintenancePlate?.toUpperCase()) && (
              <Button variant="destructive" className="sm:mr-auto gap-1" onClick={handleCancelPlan}>
                <Trash2 className="h-4 w-4" /> Cancelar Assinatura
              </Button>
            )}
            <Button variant="outline" onClick={() => setMaintenancePlate(null)}>Voltar</Button>
            <Button onClick={handleSavePlan} className="bg-brand text-brand-foreground hover:opacity-90">
              Salvar Configurações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={!!editClientTarget} onOpenChange={(v) => !v && setEditClientTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>Atualize os dados cadastrais do cliente.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="client-name">Nome *</Label>
              <Input
                id="client-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="client-phone">Telefone</Label>
              <Input
                id="client-phone"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditClientTarget(null)}>Cancelar</Button>
            <Button onClick={handleSaveClient} className="bg-brand text-brand-foreground hover:opacity-90">
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}
