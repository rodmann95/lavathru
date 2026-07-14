import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Search, Trash2, Pencil, CreditCard, QrCode, Banknote, CheckCircle2, Package, ShoppingCart, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/lib/app-context";
import { formatBRL } from "@/lib/mock-data";
import type { Subscriber, Coupon } from "@/lib/mock-data";

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

import { CouponInput, computeDiscount } from "./operacao";

function SubscriberDialog({
  open,
  onOpenChange,
  editTarget,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editTarget: Subscriber | null;
}) {
  const { clients, setClients, subscribers, setSubscribers, plans, currentFranchise, coupons, profile } = useApp();
  const [activeTab, setActiveTab] = useState("existing");
  const [docType, setDocType] = useState<"cpf" | "cnpj">("cpf");
  const [payment, setPayment] = useState<"PIX" | "Cartão" | "Boleto">("Cartão");
  const [step, setStep] = useState<"form" | "card" | "pix" | "boleto">("form");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

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
  const [cpf, setCpf] = useState("");
  const [cnpj, setCnpj] = useState("");
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

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];
  const resolvedPlanPrice = selectedPlan
    ? (selectedPlan.priceOverrides?.[currentFranchise.id] ?? selectedPlan.price)
    : 0;

  const discount = computeDiscount(appliedCoupon, resolvedPlanPrice);
  const finalPlanPrice = Math.max(0, resolvedPlanPrice - discount);

  const availablePayments = docType === "cnpj" ? (["PIX", "Cartão", "Boleto"] as const) : (["Cartão"] as const);

  // Adjust payment if switching doc type
  useEffect(() => {
    if (docType === "cpf") {
      setPayment("Cartão");
    } else {
      setPayment("PIX");
    }
  }, [docType]);

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

  function handleConfirmCheckout() {
    if (!isEdit) {
      // Validate first
      let targetName = "", targetPhone = "", targetPlate = "";
      if (activeTab === "existing") {
        if (!selectedClientId || !selectedPlate) {
          toast.error("Selecione o cliente e a placa");
          return;
        }
        targetName = selectedClientObj!.name;
        targetPhone = selectedClientObj!.phone;
        targetPlate = selectedPlate;
      } else {
        if (!newPlate || !newName || !newPhone) {
          toast.error("Preencha placa, nome e telefone");
          return;
        }
        targetName = newName;
        targetPhone = newPhone;
        targetPlate = newPlate.toUpperCase().trim();
      }

      if (docType === "cpf" && !cpf) {
        toast.error("Informe o CPF");
        return;
      }
      if (docType === "cnpj" && !cnpj) {
        toast.error("Informe o CNPJ");
        return;
      }

      // Check if already subscriber
      if (subscribers.some((s) => s.plate.toUpperCase() === targetPlate.toUpperCase())) {
        toast.error("Esta placa já possui um plano ativo");
        return;
      }

      if (payment === "Cartão") {
        setStep("card");
      } else if (payment === "PIX") {
        setStep("pix");
      } else if (payment === "Boleto") {
        setStep("boleto");
      }
    }
  }

  function finalizeSubscription() {
    const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];
    if (!selectedPlan) { toast.error("Nenhum plano cadastrado"); return; }

    let targetName = "", targetPhone = "", targetEmail = "", targetPlate = "";
    const clientToUpdate = selectedClientObj;

    if (activeTab === "existing") {
      targetName = selectedClientObj!.name;
      targetPhone = selectedClientObj!.phone;
      targetEmail = `${selectedClientObj!.name.toLowerCase().replace(/\s+/g, "")}@email.com`;
      targetPlate = selectedPlate;
    } else {
      targetName = newName;
      targetPhone = newPhone;
      targetEmail = newEmail || `${newName.toLowerCase().replace(/\s+/g, "")}@email.com`;
      targetPlate = newPlate.toUpperCase().trim();

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
        document: docType === "cpf" ? cpf : cnpj,
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
    reset();
  }

  function reset() {
    onOpenChange(false);
    setTimeout(() => {
      setStep("form");
      setDocType("cpf");
      setPayment("Cartão");
      setSelectedClientId("");
      setSelectedPlate("");
      setNewPlate("");
      setNewName("");
      setNewPhone("");
      setNewEmail("");
      setCpf("");
      setCnpj("");
      setAppliedCoupon(null);
    }, 200);
  }

  const isEdit = !!editTarget;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); else onOpenChange(v); }}>
      <DialogContent className={isEdit ? "max-w-md" : "max-w-5xl"}>
        {isEdit ? (
          /* ── Edit mode ── */
          <>
            <DialogHeader>
              <DialogTitle>Editar: {editTarget?.name}</DialogTitle>
              <DialogDescription>Atualize os dados cadastrais e o consumo do plano.</DialogDescription>
            </DialogHeader>
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
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={handleSaveEdit} className="bg-brand text-brand-foreground hover:opacity-90">Salvar alterações</Button>
            </DialogFooter>
          </>
        ) : (
          /* ── Create Mode (PDV Style) ── */
          <>
            {step === "form" && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl">Nova Assinatura Recorrente</DialogTitle>
                  <DialogDescription>Gere planos mensais corporativos ou de pessoa física vigentes até o cancelamento.</DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mt-2">
                  {/* Left: Configuration & Client Details */}
                  <div className="lg:col-span-3 space-y-6">
                    {/* Plan Selection Cards */}
                    <div>
                      <Label className="text-base font-semibold mb-3 block">1. Selecione o Plano</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {plans.map((p) => {
                          const price = p.priceOverrides?.[currentFranchise.id] ?? p.price;
                          const isSelected = selectedPlanId === p.id;
                          return (
                            <div 
                              key={p.id}
                              onClick={() => setSelectedPlanId(p.id)}
                              className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col gap-2 overflow-hidden ${isSelected ? "border-brand bg-brand/5 shadow-md scale-[1.02]" : "border-muted bg-background hover:border-brand/40 hover:shadow-sm"}`}
                            >
                              {isSelected && (
                                <div className="absolute top-3 left-3 text-brand bg-brand/20 rounded-full p-0.5">
                                  <CheckCircle2 className="h-4 w-4" />
                                </div>
                              )}
                              <div className={`flex flex-col ${isSelected ? 'mt-6' : 'mt-2'}`}>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Plano</span>
                                <span className={`font-black text-xl leading-none mt-1 ${isSelected ? "text-brand" : "text-foreground"}`}>{p.name}</span>
                              </div>
                              <div className="flex items-center justify-between mt-auto pt-4 border-t border-muted/50">
                                <span className={`text-lg font-extrabold tracking-tight ${isSelected ? "text-brand" : "text-foreground"}`}>{formatBRL(price)}<span className="text-xs font-normal text-muted-foreground">/mês</span></span>
                                <span className="text-[11px] text-muted-foreground bg-muted/40 px-2 py-1 rounded-md font-medium">{p.lavagesIncluded} lavagens</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* CPF/CNPJ profile selection */}
                    <div>
                      <Label className="text-base font-semibold mb-3 block">2. Tipo de Cliente</Label>
                      <Tabs value={docType} onValueChange={(v) => setDocType(v as "cpf" | "cnpj")}>
                        <TabsList className="grid grid-cols-2 w-full">
                          <TabsTrigger value="cpf">CPF (Pessoa Física)</TabsTrigger>
                          <TabsTrigger value="cnpj">CNPJ (Pessoa Jurídica)</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>

                    {/* Client form type selection */}
                    <div className="space-y-4">
                      <Label className="text-base font-semibold block">3. Dados do Assinante</Label>
                      <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid grid-cols-2 w-full">
                          <TabsTrigger value="existing">Cliente Existente</TabsTrigger>
                          <TabsTrigger value="new">Novo Cliente</TabsTrigger>
                        </TabsList>

                        <TabsContent value="existing" className="space-y-4 pt-3">
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
                          <div>
                            <Label>{docType === "cpf" ? "CPF *" : "CNPJ *"}</Label>
                            {docType === "cpf" ? (
                              <Input placeholder="000.000.000-00" value={cpf} onChange={e => setCpf(e.target.value)} />
                            ) : (
                              <Input placeholder="00.000.000/0000-00" value={cnpj} onChange={e => setCnpj(e.target.value)} />
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="new" className="space-y-4 pt-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label>Placa do Veículo *</Label>
                              <Input placeholder="ABC1D23" value={newPlate} onChange={e => setNewPlate(e.target.value.toUpperCase())} className="font-mono uppercase" />
                            </div>
                            <div>
                              <Label>{docType === "cpf" ? "Nome *" : "Razão Social *"}</Label>
                              <Input placeholder="Nome completo" value={newName} onChange={e => setNewName(e.target.value)} />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label>Telefone *</Label>
                              <Input placeholder="(00) 00000-0000" value={newPhone} onChange={e => setNewPhone(e.target.value)} />
                            </div>
                            <div>
                              <Label>E-mail</Label>
                              <Input placeholder="contato@exemplo.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                            </div>
                          </div>
                          <div>
                            <Label>{docType === "cpf" ? "CPF *" : "CNPJ *"}</Label>
                            {docType === "cpf" ? (
                              <Input placeholder="000.000.000-00" value={cpf} onChange={e => setCpf(e.target.value)} />
                            ) : (
                              <Input placeholder="00.000.000/0000-00" value={cnpj} onChange={e => setCnpj(e.target.value)} />
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </div>

                  {/* Right: Cart Summary & Payment Selection */}
                  <div className="lg:col-span-2 flex flex-col bg-muted/10 border rounded-xl overflow-hidden h-full">
                    <div className="p-4 bg-muted/30 border-b">
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" /> Carrinho do Assinante
                      </h3>
                    </div>

                    <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                      <div className="border rounded-lg bg-background p-4 space-y-3 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-base text-foreground">{selectedPlan?.name}</h4>
                            <p className="text-xs text-muted-foreground">{selectedPlan?.lavagesIncluded} lavagens mensais</p>
                          </div>
                          <span className="font-bold text-lg text-brand">{formatBRL(resolvedPlanPrice)}<span className="text-xs font-normal text-muted-foreground">/mês</span></span>
                        </div>
                        <div className="flex items-center gap-2 text-xs bg-brand/5 border border-brand/20 text-brand px-3 py-2 rounded-md">
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                          <span>Vigência: Recorrente (Ativo até cancelamento)</span>
                        </div>
                      </div>

                      {/* Payment method selection based on PF/PJ */}
                      <div>
                        <Label className="text-xs text-muted-foreground mb-2 block">
                          Forma de Pagamento ({docType === "cpf" ? "Apenas Cartão Recorrente para PF" : "PIX, Cartão ou Boleto para PJ"})
                        </Label>
                        <RadioGroup value={payment} onValueChange={(v) => setPayment(v as typeof payment)} className="flex gap-2">
                          {availablePayments.map((p) => {
                            let icon = CreditCard;
                            if (p === "PIX") icon = QrCode;
                            if (p === "Boleto") icon = Banknote;
                            const I = icon;
                            return (
                              <label key={p} className={`flex-1 flex flex-col items-center gap-1 rounded-lg border-2 p-3 cursor-pointer transition-all ${payment === p ? "border-brand bg-brand/5 text-brand" : "border-muted hover:bg-muted/50 text-muted-foreground"}`}>
                                <RadioGroupItem value={p} className="sr-only" />
                                <I className="h-5 w-5" />
                                <span className="text-xs font-bold uppercase">{p}</span>
                              </label>
                            );
                          })}
                        </RadioGroup>
                      </div>

                      {/* Coupon */}
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Cupom de Desconto</Label>
                        <CouponInput
                          franchiseId={currentFranchise.id}
                          coupons={coupons}
                          appliedCoupon={appliedCoupon}
                          onApply={setAppliedCoupon}
                          onClear={() => setAppliedCoupon(null)}
                          allowedTargets={["Plano", "Todos"]}
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-muted/30 border-t space-y-4 mt-auto">
                      <div className="space-y-1.5">
                        {appliedCoupon && (
                          <div className="flex justify-between items-center text-sm text-muted-foreground">
                            <span>Subtotal</span>
                            <span>{formatBRL(resolvedPlanPrice)}</span>
                          </div>
                        )}
                        {appliedCoupon && (
                          <div className="flex justify-between items-center text-sm text-success font-medium">
                            <span>Desconto ({appliedCoupon.code})</span>
                            <span>− {formatBRL(discount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-xl font-black">
                          <span>Total Mensal</span>
                          <span>{formatBRL(finalPlanPrice)}</span>
                        </div>
                        {profile === "franqueado" && (
                          <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                            <span>Taxa de Franquia (Royalties {currentFranchise.royaltyFeePercent}%)</span>
                            <span className="font-semibold">{formatBRL(finalPlanPrice * (currentFranchise.royaltyFeePercent / 100))}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" onClick={reset} className="flex-1">Cancelar</Button>
                        <Button onClick={handleConfirmCheckout} className="flex-[2] bg-brand text-brand-foreground hover:opacity-90 font-bold h-11">
                          {payment === "Cartão" ? "Cadastrar Cartão" : "Confirmar Assinatura"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {step === "card" && (
              <>
                <DialogHeader>
                  <DialogTitle>Aprovação de Pagamento por Cartão (Recorrência)</DialogTitle>
                  <DialogDescription>Por se tratar de Pessoa Física, o pagamento é feito apenas via cartão de crédito com cobrança mensal automática.</DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4 py-8">
                  <CreditCard className="h-16 w-16 text-brand animate-pulse" />
                  <div className="text-center space-y-1">
                    <div className="text-xl font-bold">{formatBRL(finalPlanPrice)} / mês</div>
                    <div className="text-xs text-muted-foreground max-w-sm">Insira o cartão na maquininha ou use o link de pagamento enviado por SMS para salvar os dados de cobrança recorrente.</div>
                  </div>
                  <div className="w-full max-w-sm space-y-3 bg-muted/20 p-4 rounded-lg border">
                    <div>
                      <Label className="text-xs">Número do Cartão</Label>
                      <Input placeholder="•••• •••• •••• ••••" disabled />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Validade</Label>
                        <Input placeholder="MM/AA" disabled />
                      </div>
                      <div>
                        <Label className="text-xs">CVC</Label>
                        <Input placeholder="•••" disabled />
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setStep("form")}>Voltar</Button>
                  <Button onClick={finalizeSubscription} className="bg-success text-success-foreground hover:bg-success/90">
                    Simular aprovação recorrente
                  </Button>
                </DialogFooter>
              </>
            )}

            {step === "pix" && (
              <>
                <DialogHeader>
                  <DialogTitle>Assinatura por PIX (PJ)</DialogTitle>
                  <DialogDescription>Gere o código copia e cola para faturamento recorrente da empresa.</DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4 py-6">
                  <div className="p-4 bg-white border rounded-lg">
                    <QrCode className="h-40 w-40 text-foreground" />
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold">{formatBRL(finalPlanPrice)} / mês</div>
                    <div className="text-xs text-muted-foreground mt-1">Aguardando o primeiro pagamento para liberar o plano corporativo.</div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setStep("form")}>Voltar</Button>
                  <Button onClick={finalizeSubscription} className="bg-success text-success-foreground hover:bg-success/90">
                    Simular pagamento do PIX
                  </Button>
                </DialogFooter>
              </>
            )}

            {step === "boleto" && (
              <>
                <DialogHeader>
                  <DialogTitle>Assinatura por Boleto Faturado (PJ)</DialogTitle>
                  <DialogDescription>Gerado boleto para faturamento corporativo mensal.</DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4 py-8">
                  <Banknote className="h-16 w-16 text-brand" />
                  <div className="text-center space-y-1">
                    <div className="text-xl font-bold">{formatBRL(finalPlanPrice)} / mês</div>
                    <div className="text-xs text-muted-foreground max-w-sm">O boleto recorrente foi gerado e enviado para o email cadastrado do faturamento.</div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setStep("form")}>Voltar</Button>
                  <Button onClick={finalizeSubscription} className="bg-success text-success-foreground hover:bg-success/90">
                    Confirmar Assinatura Faturada
                  </Button>
                </DialogFooter>
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
