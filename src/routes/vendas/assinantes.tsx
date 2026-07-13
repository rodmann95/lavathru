import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/lib/app-context";
import { formatBRL } from "@/lib/mock-data";
import type { Subscriber } from "@/lib/mock-data";

export const Route = createFileRoute("/vendas/assinantes")({
  head: () => ({ meta: [{ title: "Assinantes — Lava Thru" }] }),
  component: AssinantesPage,
});

function AssinantesPage() {
  const { currentFranchise, subscribers, setSubscribers, clients, setClients } = useApp();
  const [q, setQ] = useState("");
  const [openNew, setOpenNew] = useState(false);
  const [editTarget, setEditTarget] = useState<Subscriber | null>(null);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);

  const rows = useMemo(() => {
    return subscribers
      .filter((s) => s.franchiseId === currentFranchise.id)
      .filter((s) => {
        if (!q) return true;
        const t = q.toLowerCase();
        return (
          s.name.toLowerCase().includes(t) ||
          s.plate.toLowerCase().includes(t) ||
          s.phone.includes(t)
        );
      });
  }, [q, currentFranchise.id, subscribers]);

  function handleCancelConfirm() {
    if (!cancelTarget) return;
    const plate = cancelTarget;
    const nextSubscribers = subscribers.filter(
      (s) => s.plate.toUpperCase() !== plate.toUpperCase()
    );
    setSubscribers(nextSubscribers);
    setClients(
      clients.map((c) => ({
        ...c,
        isSubscriber: c.plates.some((p) =>
          nextSubscribers.some((s) => s.plate.toUpperCase() === p.toUpperCase())
        ),
      }))
    );
    setCancelTarget(null);
    toast.success("Assinatura cancelada com sucesso");
  }

  const subToCancel = subscribers.find((s) => s.plate === cancelTarget);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Assinantes</h1>
          <p className="text-sm text-muted-foreground">
            Plano Lava Thru — Recorrência Mensal · {currentFranchise.name}
          </p>
        </div>
        <Button
          onClick={() => { setEditTarget(null); setOpenNew(true); }}
          className="bg-brand text-brand-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4 mr-2" /> Gerar nova assinatura
        </Button>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 pb-3">
          <CardTitle>Lista de assinantes ({rows.length})</CardTitle>
          <div className="relative w-full max-w-xs">
            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Buscar nome, placa, telefone…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Placa</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Uso do plano</TableHead>
                <TableHead className="text-right">Disponível</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => {
                const available = s.planIncluded - s.planUsed;
                const pct = (s.planUsed / s.planIncluded) * 100;
                return (
                  <TableRow key={s.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="font-mono">{s.plate}</TableCell>
                    <TableCell>{s.phone}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[180px]">
                        <Progress value={pct} className="h-2" />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {s.planUsed}/{s.planIncluded}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        className={
                          available > 0
                            ? "bg-success/10 text-success border-success/20"
                            : "bg-destructive/10 text-destructive border-destructive/20"
                        }
                      >
                        {available} disponíveis
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Editar assinante"
                          onClick={() => { setEditTarget(s); setOpenNew(true); }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Cancelar assinatura"
                          onClick={() => setCancelTarget(s.plate)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum assinante encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* New / Edit subscriber dialog */}
      <SubscriberDialog
        open={openNew}
        onOpenChange={(v) => { setOpenNew(v); if (!v) setEditTarget(null); }}
        editTarget={editTarget}
      />

      {/* Cancel confirmation */}
      <Dialog open={!!cancelTarget} onOpenChange={() => setCancelTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancelar assinatura</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar a assinatura de{" "}
              <strong>{subToCancel?.name}</strong> (placa{" "}
              <span className="font-mono font-bold">{cancelTarget}</span>)?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)}>
              Voltar
            </Button>
            <Button variant="destructive" onClick={handleCancelConfirm}>
              Cancelar assinatura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SubscriberDialog({
  open,
  onOpenChange,
  editTarget,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editTarget: Subscriber | null;
}) {
  const { clients, setClients, subscribers, setSubscribers, plans, currentFranchise } = useApp();
  const [activeTab, setActiveTab] = useState("existing");

  // Edit fields
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPlanUsed, setEditPlanUsed] = useState("");
  const [editPlanIncluded, setEditPlanIncluded] = useState("");

  // New subscriber fields
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedPlate, setSelectedPlate] = useState("");
  const [newPlate, setNewPlate] = useState("");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState(plans[0]?.id || "");

  // When editTarget changes, populate edit fields
  useMemo(() => {
    if (editTarget) {
      setEditName(editTarget.name);
      setEditPhone(editTarget.phone);
      setEditEmail(editTarget.email);
      setEditPlanUsed(editTarget.planUsed.toString());
      setEditPlanIncluded(editTarget.planIncluded.toString());
    }
  }, [editTarget]);

  const selectedClientObj = useMemo(
    () => clients.find((c) => c.id === selectedClientId),
    [selectedClientId, clients]
  );

  function handleClientChange(clientId: string) {
    setSelectedClientId(clientId);
    const client = clients.find((c) => c.id === clientId);
    setSelectedPlate(client?.plates?.[0] ?? client?.plate ?? "");
  }

  function handleSaveEdit() {
    if (!editTarget) return;
    if (!editName || !editPhone) {
      toast.error("Preencha nome e telefone.");
      return;
    }
    setSubscribers((prev) =>
      prev.map((s) =>
        s.id === editTarget.id
          ? {
              ...s,
              name: editName,
              phone: editPhone,
              email: editEmail || s.email,
              planUsed: parseInt(editPlanUsed, 10) || 0,
              planIncluded: parseInt(editPlanIncluded, 10) || s.planIncluded,
            }
          : s
      )
    );
    toast.success("Assinante atualizado!");
    onOpenChange(false);
  }

  function handleCreate() {
    const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];
    if (!selectedPlan) { toast.error("Nenhum plano cadastrado"); return; }

    let targetName = "", targetPhone = "", targetEmail = "", targetPlate = "";
    const clientToUpdate = selectedClientObj;

    if (activeTab === "existing") {
      if (!selectedClientId || !selectedPlate) {
        toast.error("Selecione o cliente e a placa");
        return;
      }
      targetName = selectedClientObj!.name;
      targetPhone = selectedClientObj!.phone;
      targetEmail = `${selectedClientObj!.name.toLowerCase().replace(/\s+/g, "")}@email.com`;
      targetPlate = selectedPlate;
    } else {
      if (!newPlate || !newName || !newPhone) {
        toast.error("Preencha placa, nome e telefone");
        return;
      }
      targetName = newName;
      targetPhone = newPhone;
      targetEmail = newEmail || `${newName.toLowerCase().replace(/\s+/g, "")}@email.com`;
      targetPlate = newPlate.toUpperCase().trim();
      if (subscribers.some((s) => s.plate.toUpperCase() === targetPlate)) {
        toast.error("Esta placa já possui um plano ativo");
        return;
      }
      setClients((prev) => [
        ...prev,
        {
          id: `c-${Math.floor(100 + Math.random() * 900)}`,
          name: targetName, plate: targetPlate, plates: [targetPlate],
          phone: targetPhone, visits: 0,
          lastVisit: new Date().toISOString().split("T")[0],
          totalSpent: 0, isSubscriber: true,
        },
      ]);
    }

    setSubscribers((prev) => [
      ...prev,
      {
        id: `s-${Math.floor(100 + Math.random() * 900)}`,
        plate: targetPlate, name: targetName, phone: targetPhone, email: targetEmail,
        document: "000.000.000-00",
        planIncluded: selectedPlan.lavagesIncluded, planUsed: 0,
        since: new Date().toISOString().split("T")[0],
        franchiseId: currentFranchise.id,
      },
    ]);

    if (activeTab === "existing" && clientToUpdate) {
      setClients((prev) =>
        prev.map((c) => (c.id === clientToUpdate.id ? { ...c, isSubscriber: true } : c))
      );
    }

    toast.success("Assinatura criada com sucesso!");
    onOpenChange(false);
    setSelectedClientId(""); setSelectedPlate(""); setNewPlate(""); setNewName(""); setNewPhone(""); setNewEmail("");
  }

  const isEdit = !!editTarget;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Editar: ${editTarget?.name}` : "Gerar nova assinatura"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Atualize os dados cadastrais e o consumo do plano."
              : "Selecione o plano e vincule a um veículo."}
          </DialogDescription>
        </DialogHeader>

        {isEdit ? (
          /* ── Edit mode ── */
          <div className="space-y-3 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Nome *</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Telefone *</Label>
                <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>E-mail</Label>
              <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} type="email" />
            </div>
            <div className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
              Placa: <span className="font-mono font-bold text-foreground">{editTarget?.plate}</span>
              {" · "}Desde {editTarget?.since}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Lavagens usadas</Label>
                <Input
                  type="number" min={0}
                  value={editPlanUsed}
                  onChange={(e) => setEditPlanUsed(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Lavagens incluídas</Label>
                <Input
                  type="number" min={1}
                  value={editPlanIncluded}
                  onChange={(e) => setEditPlanIncluded(e.target.value)}
                />
              </div>
            </div>
          </div>
        ) : (
          /* ── Create mode ── */
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Plano de Assinatura</Label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {plans.map((p) => {
                    const price = p.priceOverrides?.[currentFranchise.id] ?? p.price;
                    return (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} — {formatBRL(price)}/mês ({p.lavagesIncluded} lavagens)
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="existing">Cliente Existente</TabsTrigger>
                <TabsTrigger value="new">Novo Cliente</TabsTrigger>
              </TabsList>
              <TabsContent value="existing" className="space-y-3 pt-3">
                <div className="space-y-1.5">
                  <Label>Cliente</Label>
                  <Select value={selectedClientId} onValueChange={handleClientChange}>
                    <SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name} ({c.phone})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedClientObj && (
                  <div className="space-y-1.5">
                    <Label>Placa do Veículo</Label>
                    <Select value={selectedPlate} onValueChange={setSelectedPlate}>
                      <SelectTrigger><SelectValue placeholder="Selecione a placa" /></SelectTrigger>
                      <SelectContent>
                        {(selectedClientObj.plates || [selectedClientObj.plate]).map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="new" className="space-y-3 pt-3">
                <div><Label htmlFor="nPlate">Placa *</Label>
                  <Input id="nPlate" placeholder="ABC1D23" value={newPlate} onChange={(e) => setNewPlate(e.target.value.toUpperCase())} className="font-mono uppercase" /></div>
                <div><Label htmlFor="nName">Nome *</Label>
                  <Input id="nName" placeholder="Nome completo" value={newName} onChange={(e) => setNewName(e.target.value)} /></div>
                <div><Label htmlFor="nPhone">Telefone *</Label>
                  <Input id="nPhone" placeholder="(00) 00000-0000" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} /></div>
                <div><Label htmlFor="nEmail">E-mail</Label>
                  <Input id="nEmail" placeholder="email@exemplo.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} /></div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={isEdit ? handleSaveEdit : handleCreate}
            className="bg-brand text-brand-foreground hover:opacity-90"
          >
            {isEdit ? "Salvar alterações" : "Criar assinatura"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
