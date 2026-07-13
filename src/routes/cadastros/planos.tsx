import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Search, CreditCard, Sparkles, Settings2, RefreshCw, DollarSign, Percent, Pencil, Trash2, LineChart,
} from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/lib/app-context";
import { formatBRL } from "@/lib/mock-data";
import type { Plan } from "@/lib/mock-data";

export const Route = createFileRoute("/cadastros/planos")({
  head: () => ({ meta: [{ title: "Planos — Lava Thru" }] }),
  component: PlanosPage,
});

type FormState = {
  name: string;
  price: string;
  lavagesIncluded: string;
  description: string;
  royaltyPercent: string;
  costCenterId: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  price: "",
  lavagesIncluded: "",
  description: "",
  royaltyPercent: "10",
  costCenterId: "cc-002",
};

function PlanosPage() {
  const { plans, setPlans, franchises, costCenters } = useApp();
  const [q, setQ] = useState("");
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<string>("global");

  // Add / Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Plan | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Override price modal
  const [overridePlan, setOverridePlan] = useState<{
    id: string;
    name: string;
    basePrice: number;
    currentOverride?: number;
  } | null>(null);
  const [overridePriceInput, setOverridePriceInput] = useState("");

  const filtered = useMemo(() => {
    return plans.filter((p) => {
      if (!q) return true;
      const t = q.toLowerCase();
      return p.name.toLowerCase().includes(t) || p.description.toLowerCase().includes(t);
    });
  }, [q, plans]);

  // ─── Open Add / Edit ────────────────────────────────────────────────────────

  function openNew() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(plan: Plan) {
    setEditTarget(plan);
    setForm({
      name: plan.name,
      price: plan.price.toString(),
      lavagesIncluded: plan.lavagesIncluded.toString(),
      description: plan.description,
      royaltyPercent: plan.royaltyPercent?.toString() ?? "10",
      costCenterId: plan.costCenterId || "cc-002",
    });
    setDialogOpen(true);
  }

  // ─── Save ────────────────────────────────────────────────────────────────────

  function handleSave() {
    const parsedPrice = parseFloat(form.price);
    const parsedLavages = parseInt(form.lavagesIncluded, 10);
    const parsedRoyalty = parseFloat(form.royaltyPercent);

    if (!form.name || !form.price || !form.lavagesIncluded) {
      toast.error("Preencha nome, mensalidade e lavagens incluídas.");
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      toast.error("Digite uma mensalidade válida.");
      return;
    }
    if (isNaN(parsedRoyalty) || parsedRoyalty < 0 || parsedRoyalty > 100) {
      toast.error("O % de Royalties deve ser entre 0 e 100.");
      return;
    }

    if (editTarget) {
      setPlans((prev) =>
        prev.map((p) =>
          p.id === editTarget.id
            ? {
                ...p,
                name: form.name,
                price: parsedPrice,
                lavagesIncluded: parsedLavages,
                description: form.description,
                royaltyPercent: parsedRoyalty,
                costCenterId: form.costCenterId,
              }
            : p
        )
      );
      toast.success(`Plano "${form.name}" atualizado!`);
    } else {
      const newPlan: Plan = {
        id: `pl-${Math.floor(100 + Math.random() * 900)}`,
        name: form.name,
        price: parsedPrice,
        lavagesIncluded: parsedLavages,
        description: form.description,
        royaltyPercent: parsedRoyalty,
        costCenterId: form.costCenterId,
        priceOverrides: {},
      };
      setPlans((prev) => [...prev, newPlan]);
      toast.success(`Plano "${form.name}" cadastrado!`);
    }
    setDialogOpen(false);
  }

  // ─── Delete ──────────────────────────────────────────────────────────────────

  function handleDelete(id: string) {
    setPlans((prev) => prev.filter((p) => p.id !== id));
    setDeleteId(null);
    toast.success("Plano excluído.");
  }

  // ─── Price Override ──────────────────────────────────────────────────────────

  function handleOpenCustomize(planId: string, planName: string, basePrice: number, currentOverride?: number) {
    setOverridePlan({ id: planId, name: planName, basePrice, currentOverride });
    setOverridePriceInput(currentOverride !== undefined ? currentOverride.toString() : basePrice.toString());
  }

  function handleSaveOverride() {
    if (!overridePlan || selectedFranchiseId === "global") return;
    const cleanPrice = parseFloat(overridePriceInput);
    if (isNaN(cleanPrice) || cleanPrice <= 0) {
      toast.error("Digite uma mensalidade válida.");
      return;
    }
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id === overridePlan.id) {
          const overrides = { ...p.priceOverrides };
          overrides[selectedFranchiseId] = cleanPrice;
          return { ...p, priceOverrides: overrides };
        }
        return p;
      })
    );
    toast.success(`Mensalidade de "${overridePlan.name}" customizada!`);
    setOverridePlan(null);
  }

  function handleResetOverride() {
    if (!overridePlan || selectedFranchiseId === "global") return;
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id === overridePlan.id) {
          const overrides = { ...p.priceOverrides };
          delete overrides[selectedFranchiseId];
          return { ...p, priceOverrides: overrides };
        }
        return p;
      })
    );
    toast.success(`Mensalidade de "${overridePlan.name}" redefinida para o padrão.`);
    setOverridePlan(null);
  }

  const selectedFranchiseObj = franchises.find((f) => f.id === selectedFranchiseId);
  const planToDelete = plans.find((p) => p.id === deleteId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Planos</h1>
          <p className="text-sm text-muted-foreground">
            Crie e configure os planos de assinatura mensal e seus royalties
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium whitespace-nowrap">Configurando para:</Label>
          <Select value={selectedFranchiseId} onValueChange={setSelectedFranchiseId}>
            <SelectTrigger className="w-[280px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="global">Todas as Franquias (Padrão)</SelectItem>
              {franchises.map((f) => (
                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Buscar plano…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-8 w-52"
            />
          </div>
          <Button onClick={openNew} className="bg-brand text-brand-foreground hover:opacity-90">
            <Plus className="h-4 w-4 mr-2" /> Novo Plano
          </Button>
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filtered.map((p) => {
          const hasOverride =
            selectedFranchiseId !== "global" &&
            p.priceOverrides?.[selectedFranchiseId] !== undefined;
          const effectivePrice = hasOverride ? p.priceOverrides![selectedFranchiseId] : p.price;

          return (
            <div
              key={p.id}
              className="rounded-xl border border-border bg-card hover:shadow-lg hover:border-brand/40 transition-all flex flex-col justify-between overflow-hidden"
            >
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{p.name}</h3>
                    <div className="flex gap-2 items-center mt-1">
                      <Badge variant="outline" className="gap-1">
                        <Sparkles className="h-3 w-3 text-brand" />
                        {p.lavagesIncluded} lavagens/mês
                      </Badge>
                      {p.costCenterId && (
                        <Badge variant="secondary" className="font-normal gap-1 text-[10px]">
                          <LineChart className="h-3 w-3" />
                          {costCenters.find(c => c.id === p.costCenterId)?.name || p.costCenterId}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                </div>

                <p className="text-sm text-muted-foreground line-clamp-3 min-h-[4.5rem]">
                  {p.description || "Sem descrição disponível."}
                </p>

                {/* Price */}
                <div className="pt-1 flex items-end justify-between gap-2">
                  <div>
                    <span className="text-2xl font-black font-mono">{formatBRL(effectivePrice)}</span>
                    <span className="text-xs text-muted-foreground"> /mês</span>
                    {selectedFranchiseId !== "global" && (
                      <div className="mt-0.5">
                        {hasOverride ? (
                          <Badge className="bg-amber-500/10 text-amber-600 border-amber-300 text-[10px]">Customizado</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">Padrão</Badge>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Royalty badge */}
                  {p.royaltyPercent !== undefined && (
                    <Badge variant="outline" className="gap-1 font-mono text-xs shrink-0">
                      <Percent className="h-2.5 w-2.5" />
                      {p.royaltyPercent}% royalty
                    </Badge>
                  )}
                </div>

                {/* Split preview (global view) */}
                {selectedFranchiseId === "global" && p.royaltyPercent !== undefined && (
                  <div className="rounded-lg bg-muted px-3 py-1.5 text-[11px] text-muted-foreground space-y-0.5">
                    <div className="flex justify-between">
                      <span>Franqueado recebe</span>
                      <span className="font-semibold text-foreground">
                        {formatBRL(p.price * (1 - p.royaltyPercent / 100))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Matriz (royalties)</span>
                      <span className="font-semibold text-brand">
                        {formatBRL(p.price * (p.royaltyPercent / 100))}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Card footer actions */}
              <div className="px-6 py-3 border-t bg-muted/20 flex justify-end gap-2">
                {selectedFranchiseId === "global" ? (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(p)}
                      title="Editar plano"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteId(p.id)}
                      title="Excluir plano"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenCustomize(p.id, p.name, p.price, p.priceOverrides?.[selectedFranchiseId])}
                    className="gap-1 w-full h-8"
                  >
                    <Settings2 className="h-3.5 w-3.5" /> Customizar Mensalidade
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-12">
            Nenhum plano cadastrado.
          </div>
        )}
      </div>

      {/* ─── Add / Edit Dialog ──────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? `Editar: ${editTarget.name}` : "Novo Plano de Assinatura"}</DialogTitle>
            <DialogDescription>
              {editTarget
                ? "Atualize as configurações do plano."
                : "Crie uma oferta mensal para fidelização de clientes recorrentes."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-1">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="pl-name">Nome do Plano *</Label>
              <Input
                id="pl-name"
                placeholder="Ex: Plano Trimestral Prata"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            {/* Price + Royalty */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pl-price">Mensalidade Base R$ *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="pl-price"
                    type="number"
                    placeholder="0,00"
                    className="pl-8"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pl-royalty">Royalties Matriz %</Label>
                <div className="relative">
                  <Percent className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="pl-royalty"
                    type="number"
                    placeholder="10"
                    min={0}
                    max={100}
                    className="pl-8"
                    value={form.royaltyPercent}
                    onChange={(e) => setForm((f) => ({ ...f, royaltyPercent: e.target.value }))}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">% repassado à Franqueadora</p>
              </div>
            </div>

            {/* Lavages */}
            <div className="space-y-1.5">
              <Label htmlFor="pl-lavages">Lavagens Incluídas *</Label>
              <Input
                id="pl-lavages"
                type="number"
                placeholder="Ex: 10"
                value={form.lavagesIncluded}
                onChange={(e) => setForm((f) => ({ ...f, lavagesIncluded: e.target.value }))}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="pl-desc">Descrição / Benefícios</Label>
              <Textarea
                id="pl-desc"
                placeholder="Detalhes e benefícios do plano…"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            {/* Cost Center */}
            <div className="space-y-1.5">
              <Label>Centro de Custo de Receita *</Label>
              <Select value={form.costCenterId} onValueChange={(v) => setForm(f => ({ ...f, costCenterId: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {costCenters
                    .filter(c => c.type === "receita" || c.type === "ambos")
                    .map(cc => (
                      <SelectItem key={cc.id} value={cc.id}>{cc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Split preview */}
            {form.price && form.royaltyPercent && (
              <div className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground space-y-0.5">
                <div className="flex justify-between">
                  <span>Franqueado recebe por assinatura</span>
                  <span className="font-semibold text-foreground">
                    {formatBRL(parseFloat(form.price) * (1 - parseFloat(form.royaltyPercent || "0") / 100))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Royalties para a Matriz</span>
                  <span className="font-semibold text-brand">
                    {formatBRL(parseFloat(form.price) * (parseFloat(form.royaltyPercent || "0") / 100))}
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} className="bg-brand text-brand-foreground hover:opacity-90">
              {editTarget ? "Salvar alterações" : "Registrar Plano"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation ────────────────────────────────────────────── */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir plano</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o plano <strong>{planToDelete?.name}</strong>? Esta
              ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Price Override Dialog ──────────────────────────────────────────── */}
      <Dialog open={!!overridePlan} onOpenChange={(v) => !v && setOverridePlan(null)}>
        <DialogContent className="max-w-md">
          {overridePlan && (
            <>
              <DialogHeader>
                <DialogTitle>Customizar Mensalidade</DialogTitle>
                <DialogDescription>
                  Defina um valor diferenciado para <strong>{overridePlan.name}</strong> nesta
                  franquia.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="rounded-lg bg-muted p-3 space-y-1 text-sm">
                  <div className="text-muted-foreground">
                    Franquia: <strong>{selectedFranchiseObj?.name}</strong>
                  </div>
                  <div className="text-muted-foreground">
                    Mensalidade Padrão: <strong>{formatBRL(overridePlan.basePrice)}</strong>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="overridePlanPrice">Mensalidade Customizada R$</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="overridePlanPrice"
                      type="number"
                      placeholder="0,00"
                      className="pl-8 text-lg font-bold"
                      value={overridePriceInput}
                      onChange={(e) => setOverridePriceInput(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                {overridePlan.currentOverride !== undefined && (
                  <Button
                    variant="outline"
                    className="sm:mr-auto gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={handleResetOverride}
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Redefinir para Padrão
                  </Button>
                )}
                <Button variant="outline" onClick={() => setOverridePlan(null)}>Cancelar</Button>
                <Button onClick={handleSaveOverride} className="bg-brand text-brand-foreground hover:opacity-90">
                  Salvar Mensalidade
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
