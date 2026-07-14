import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Search, Wrench, Clock, DollarSign, Settings2, RefreshCw, Pencil, Trash2, Percent, LineChart, Flame } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/lib/app-context";
import { formatBRL } from "@/lib/mock-data";
import type { Service } from "@/lib/mock-data";

export const Route = createFileRoute("/cadastros/servicos")({
  head: () => ({ meta: [{ title: "Serviços — Lava Thru" }] }),
  component: ServicosPage,
});

type FormState = {
  name: string;
  price: string;
  duration: string;
  royaltyPercent: string;
  costCenterId: string;
  isHot: boolean;
};

const EMPTY_FORM: FormState = { name: "", price: "", duration: "", royaltyPercent: "10", costCenterId: "cc-001", isHot: false };

function ServicosPage() {
  const { services, setServices, franchises, costCenters } = useApp();
  const [q, setQ] = useState("");
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<string>("global");

  // Add / Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Service | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Override price modal
  const [overrideService, setOverrideService] = useState<{
    name: string;
    basePrice: number;
    currentOverride?: number;
  } | null>(null);
  const [overridePriceInput, setOverridePriceInput] = useState("");

  const filtered = useMemo(() => {
    return services.filter((s) => {
      if (!q) return true;
      const t = q.toLowerCase();
      return s.name.toLowerCase().includes(t) || s.duration.toLowerCase().includes(t);
    });
  }, [q, services]);

  // ─── Open Add / Edit ────────────────────────────────────────────────────────

  function openNew() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(service: Service) {
    setEditTarget(service);
    setForm({
      name: service.name,
      price: service.price.toString(),
      duration: service.duration,
      royaltyPercent: service.royaltyPercent?.toString() ?? "10",
      costCenterId: service.costCenterId || "cc-001",
      isHot: service.isHot || false,
    });
    setDialogOpen(true);
  }

  // ─── Save (Create or Update) ─────────────────────────────────────────────────

  function handleSave() {
    const parsedPrice = parseFloat(form.price);
    const parsedRoyalty = parseFloat(form.royaltyPercent);

    if (!form.name || !form.price || !form.duration) {
      toast.error("Preencha nome, preço e duração.");
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      toast.error("Digite um preço válido.");
      return;
    }
    if (isNaN(parsedRoyalty) || parsedRoyalty < 0 || parsedRoyalty > 100) {
      toast.error("O % de Royalties deve estar entre 0 e 100.");
      return;
    }

    if (editTarget) {
      // Edit existing
      setServices((prev) =>
        prev.map((s) =>
          s.name === editTarget.name
            ? {
                ...s,
                name: form.name,
                price: parsedPrice,
                duration: form.duration,
                royaltyPercent: parsedRoyalty,
                costCenterId: form.costCenterId,
                isHot: form.isHot,
              }
            : s
        )
      );
      toast.success(`Serviço "${form.name}" atualizado!`);
    } else {
      // Create new
      const newService: Service = {
        name: form.name,
        price: parsedPrice,
        duration: form.duration,
        royaltyPercent: parsedRoyalty,
        costCenterId: form.costCenterId,
        isHot: form.isHot,
        priceOverrides: {},
      };
      setServices((prev) => [...prev, newService]);
      toast.success(`Serviço "${form.name}" cadastrado!`);
    }

    setDialogOpen(false);
  }

  // ─── Delete ──────────────────────────────────────────────────────────────────

  function handleDelete(name: string) {
    setServices((prev) => prev.filter((s) => s.name !== name));
    setDeleteTarget(null);
    toast.success("Serviço excluído.");
  }

  // ─── Price Override ──────────────────────────────────────────────────────────

  function handleOpenCustomize(serviceName: string, basePrice: number, currentOverride?: number) {
    setOverrideService({ name: serviceName, basePrice, currentOverride });
    setOverridePriceInput(
      currentOverride !== undefined ? currentOverride.toString() : basePrice.toString()
    );
  }

  function handleSaveOverride() {
    if (!overrideService || selectedFranchiseId === "global") return;
    const cleanPrice = parseFloat(overridePriceInput);
    if (isNaN(cleanPrice) || cleanPrice <= 0) {
      toast.error("Digite um preço válido.");
      return;
    }
    setServices((prev) =>
      prev.map((s) => {
        if (s.name === overrideService.name) {
          const overrides = { ...s.priceOverrides };
          overrides[selectedFranchiseId] = cleanPrice;
          return { ...s, priceOverrides: overrides };
        }
        return s;
      })
    );
    toast.success(`Preço de "${overrideService.name}" customizado!`);
    setOverrideService(null);
  }

  function handleResetOverride() {
    if (!overrideService || selectedFranchiseId === "global") return;
    setServices((prev) =>
      prev.map((s) => {
        if (s.name === overrideService.name) {
          const overrides = { ...s.priceOverrides };
          delete overrides[selectedFranchiseId];
          return { ...s, priceOverrides: overrides };
        }
        return s;
      })
    );
    toast.success(`Preço de "${overrideService.name}" redefinido para o padrão.`);
    setOverrideService(null);
  }

  const selectedFranchiseObj = franchises.find((f) => f.id === selectedFranchiseId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Serviços</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie o cardápio de lavagens, preços e royalties da rede
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium whitespace-nowrap">Configurando para:</Label>
          <Select value={selectedFranchiseId} onValueChange={setSelectedFranchiseId}>
            <SelectTrigger className="w-[280px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="global">Todas as Franquias (Padrão)</SelectItem>
              {franchises.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openNew} className="bg-brand text-brand-foreground hover:opacity-90">
          <Plus className="h-4 w-4 mr-2" /> Novo Serviço
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 pb-3">
          <CardTitle>
            {selectedFranchiseId === "global"
              ? `Tabela de Preços Geral (${filtered.length})`
              : `Preços Customizados: ${selectedFranchiseObj?.name} (${filtered.length})`}
          </CardTitle>
          <div className="relative w-full max-w-xs">
            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Buscar serviço…"
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
                <TableHead>Serviço</TableHead>
                <TableHead>Preço Base</TableHead>
                {selectedFranchiseId !== "global" && <TableHead>Preço na Unidade</TableHead>}
                <TableHead>Duração</TableHead>
                <TableHead>Centro de Custo</TableHead>
                <TableHead>Royalties</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => {
                const hasOverride =
                  selectedFranchiseId !== "global" &&
                  s.priceOverrides?.[selectedFranchiseId] !== undefined;
                const effectivePrice = hasOverride
                  ? s.priceOverrides![selectedFranchiseId]
                  : s.price;

                return (
                  <TableRow key={s.name} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-semibold">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 shrink-0">
                          <Wrench className="h-4 w-4 text-brand" />
                        </div>
                        <div className="flex flex-col">
                          <span>Lavagem {s.name}</span>
                          {s.isHot && <span className="text-[10px] font-bold text-orange-500 uppercase flex items-center gap-1 mt-0.5"><Flame className="h-3 w-3" /> Destaque PDV</span>}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="font-mono text-muted-foreground">
                      {formatBRL(s.price)}
                    </TableCell>

                    {selectedFranchiseId !== "global" && (
                      <TableCell className="font-bold font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className={hasOverride ? "text-amber-600" : ""}>
                            {formatBRL(effectivePrice)}
                          </span>
                          {hasOverride ? (
                            <Badge className="bg-amber-500/10 text-amber-600 border-amber-300 text-[10px] h-4">
                              Customizado
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] h-4">
                              Herdado
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    )}

                    <TableCell className="text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {s.duration}
                      </span>
                    </TableCell>

                    <TableCell>
                      {s.costCenterId ? (
                        <Badge variant="secondary" className="font-normal gap-1 text-[10px]">
                          <LineChart className="h-3 w-3" />
                          {costCenters.find(c => c.id === s.costCenterId)?.name || s.costCenterId}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {s.royaltyPercent !== undefined ? (
                        <Badge variant="outline" className="gap-1 font-mono">
                          <Percent className="h-2.5 w-2.5" />
                          {s.royaltyPercent}%
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge className="bg-success/10 text-success border-success/20">Ativo</Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {selectedFranchiseId === "global" ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEdit(s)}
                              title="Editar serviço"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteTarget(s.name)}
                              title="Excluir serviço"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleOpenCustomize(
                                s.name,
                                s.price,
                                s.priceOverrides?.[selectedFranchiseId]
                              )
                            }
                            className="gap-1 h-8"
                          >
                            <Settings2 className="h-3.5 w-3.5" />
                            Customizar Preço
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={selectedFranchiseId !== "global" ? 7 : 6}
                    className="text-center text-muted-foreground py-8"
                  >
                    Nenhum serviço encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ─── Add / Edit Dialog ─────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? `Editar Serviço: ${editTarget.name}` : "Novo Serviço de Lavagem"}
            </DialogTitle>
            <DialogDescription>
              {editTarget
                ? "Atualize os dados do serviço. As alterações afetam o preço base global."
                : "Adicione um tipo de lavagem e configure o preço padrão e royalties da rede."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="svc-name">Nome do Serviço *</Label>
              <Input
                id="svc-name"
                placeholder="Ex: Super Cera / Premium Plus"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            {/* Price + Royalty side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="svc-price">Preço Base R$ *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="svc-price"
                    type="number"
                    placeholder="0,00"
                    className="pl-8"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="svc-royalty">Royalties Matriz %</Label>
                <div className="relative">
                  <Percent className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="svc-royalty"
                    type="number"
                    placeholder="10"
                    min={0}
                    max={100}
                    className="pl-8"
                    value={form.royaltyPercent}
                    onChange={(e) => setForm((f) => ({ ...f, royaltyPercent: e.target.value }))}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  % repassado à Franqueadora por venda
                </p>
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-1.5">
              <Label htmlFor="svc-duration">Duração Estimada *</Label>
              <div className="relative">
                <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="svc-duration"
                  placeholder="Ex: 45 min"
                  className="pl-8"
                  value={form.duration}
                  onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                />
              </div>
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

            {/* Preview row */}
            {form.price && form.royaltyPercent && (
              <div className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground space-y-0.5">
                <div className="flex justify-between">
                  <span>Valor para o Franqueado</span>
                  <span className="font-semibold text-foreground">
                    {formatBRL(
                      parseFloat(form.price) * (1 - parseFloat(form.royaltyPercent || "0") / 100)
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Royalties para a Matriz</span>
                  <span className="font-semibold text-brand">
                    {formatBRL(
                      parseFloat(form.price) * (parseFloat(form.royaltyPercent || "0") / 100)
                    )}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border rounded-lg p-3 bg-muted/30 mt-2">
              <div className="space-y-0.5">
                <Label>Destaque no PDV (Hot)</Label>
                <p className="text-xs text-muted-foreground">Exibe este serviço em destaque na tela da operação</p>
              </div>
              <Switch checked={form.isHot} onCheckedChange={(c) => setForm((f) => ({ ...f, isHot: c }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-brand text-brand-foreground hover:opacity-90">
              {editTarget ? "Salvar alterações" : "Cadastrar Serviço"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation ───────────────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir serviço</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o serviço{" "}
              <strong>&quot;{deleteTarget}&quot;</strong>? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Price Override Dialog ─────────────────────────────────────────── */}
      <Dialog open={!!overrideService} onOpenChange={(v) => !v && setOverrideService(null)}>
        <DialogContent className="max-w-md">
          {overrideService && (
            <>
              <DialogHeader>
                <DialogTitle>Customizar Preço do Serviço</DialogTitle>
                <DialogDescription>
                  Defina um preço diferenciado para{" "}
                  <strong>Lavagem {overrideService.name}</strong> nesta unidade.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="rounded-lg bg-muted p-3 space-y-1 text-sm">
                  <div className="text-muted-foreground">
                    Franquia: <strong>{selectedFranchiseObj?.name}</strong>
                  </div>
                  <div className="text-muted-foreground">
                    Preço Base Geral: <strong>{formatBRL(overrideService.basePrice)}</strong>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="overridePrice">Preço Customizado nesta Franquia R$</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="overridePrice"
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
                {overrideService.currentOverride !== undefined && (
                  <Button
                    variant="outline"
                    className="sm:mr-auto gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={handleResetOverride}
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Redefinir para Padrão
                  </Button>
                )}
                <Button variant="outline" onClick={() => setOverrideService(null)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveOverride}
                  className="bg-brand text-brand-foreground hover:opacity-90"
                >
                  Salvar Preço
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
