import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Search, Tag, Calendar, BadgePercent, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/lib/app-context";
import { formatBRL } from "@/lib/mock-data";
import type { Coupon } from "@/lib/mock-data";

export const Route = createFileRoute("/cadastros/cupons")({
  head: () => ({ meta: [{ title: "Cupons — Lava Thru" }] }),
  component: CuponsPage,
});

type FormState = {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: string;
  validity: string;
  scope: "global" | "restricted";
  selectedFranchiseIds: string[];
};

const EMPTY_FORM: FormState = {
  code: "",
  discountType: "percentage",
  discountValue: "",
  validity: "",
  scope: "global",
  selectedFranchiseIds: [],
};

function renderScopeCell(c: Coupon, franchises: { id: string; name: string }[]) {
  if (c.scope === "global") {
    return (
      <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50/50 font-normal">
        Geral (Toda Rede)
      </Badge>
    );
  }
  const names =
    c.franchiseIds
      ?.map((id) => franchises.find((f) => f.id === id)?.name.replace("Lava Thru ", "") || id)
      .join(", ") ?? "";
  return (
    <Badge
      variant="outline"
      className="border-orange-200 text-orange-700 bg-orange-50/50 font-normal max-w-[160px] truncate"
      title={names}
    >
      Restrito: {names}
    </Badge>
  );
}

function CuponsPage() {
  const { coupons, setCoupons, profile, currentFranchise, franchises } = useApp();
  const [q, setQ] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Coupon | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return coupons
      .filter((c) => {
        if (profile === "franqueado") {
          return (
            c.scope === "global" ||
            (c.scope === "restricted" && c.franchiseIds?.includes(currentFranchise.id))
          );
        }
        return true;
      })
      .filter((c) => {
        if (!q) return true;
        return c.code.toLowerCase().includes(q.toLowerCase());
      });
  }, [q, coupons, profile, currentFranchise.id]);

  // ─── Open dialogs ─────────────────────────────────────────────────────────

  function openNew() {
    setEditTarget(null);
    if (profile === "franqueado") {
      setForm({ ...EMPTY_FORM, scope: "restricted", selectedFranchiseIds: [currentFranchise.id] });
    } else {
      setForm(EMPTY_FORM);
    }
    setDialogOpen(true);
  }

  function openEdit(coupon: Coupon) {
    setEditTarget(coupon);
    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue.toString(),
      validity: coupon.validity,
      scope: coupon.scope,
      selectedFranchiseIds: coupon.franchiseIds ?? [],
    });
    setDialogOpen(true);
  }

  function toggleFranchise(id: string) {
    setForm((prev) => ({
      ...prev,
      selectedFranchiseIds: prev.selectedFranchiseIds.includes(id)
        ? prev.selectedFranchiseIds.filter((f) => f !== id)
        : [...prev.selectedFranchiseIds, id],
    }));
  }

  // ─── Save ─────────────────────────────────────────────────────────────────

  function handleSave() {
    if (!form.code || !form.discountValue || !form.validity) {
      toast.error("Preencha código, valor e validade.");
      return;
    }
    if (profile === "franquia" && form.scope === "restricted" && form.selectedFranchiseIds.length === 0) {
      toast.error("Selecione pelo menos uma franquia para o escopo restrito.");
      return;
    }

    const cleanCode = form.code.toUpperCase().replace(/\s+/g, "");
    const finalScope: "global" | "restricted" = profile === "franqueado" ? "restricted" : form.scope;
    const finalIds =
      profile === "franqueado"
        ? [currentFranchise.id]
        : finalScope === "restricted"
        ? form.selectedFranchiseIds
        : undefined;

    if (editTarget) {
      setCoupons((prev) =>
        prev.map((c) =>
          c.id === editTarget.id
            ? {
                ...c,
                code: cleanCode,
                discountType: form.discountType,
                discountValue: parseFloat(form.discountValue),
                validity: form.validity,
                scope: finalScope,
                franchiseIds: finalIds,
              }
            : c
        )
      );
      toast.success("Cupom atualizado!");
    } else {
      const newCoupon: Coupon = {
        id: `cp-${Math.floor(100 + Math.random() * 900)}`,
        code: cleanCode,
        discountType: form.discountType,
        discountValue: parseFloat(form.discountValue),
        validity: form.validity,
        status: "active",
        scope: finalScope,
        franchiseIds: finalIds,
      };
      setCoupons((prev) => [...prev, newCoupon]);
      toast.success("Cupom cadastrado!");
    }
    setDialogOpen(false);
  }

  // ─── Status toggle & delete ───────────────────────────────────────────────

  function handleToggleStatus(id: string) {
    setCoupons((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: c.status === "active" ? "inactive" : "active" } : c
      )
    );
    toast.success("Status alterado!");
  }

  function handleDelete(id: string) {
    setCoupons((prev) => prev.filter((c) => c.id !== id));
    setDeleteId(null);
    toast.success("Cupom excluído.");
  }

  const couponToDelete = coupons.find((c) => c.id === deleteId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cupons</h1>
          <p className="text-sm text-muted-foreground">
            {profile === "franqueado"
              ? `Crie cupons locais para a unidade ${currentFranchise.name}`
              : "Crie e gerencie campanhas de desconto de escopo global ou local"}
          </p>
        </div>
        <Button onClick={openNew} className="bg-brand text-brand-foreground hover:opacity-90">
          <Plus className="h-4 w-4 mr-2" /> Novo Cupom
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 pb-3">
          <CardTitle>Campanhas ({filtered.length})</CardTitle>
          <div className="relative w-full max-w-xs">
            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Buscar por código…"
              value={q}
              onChange={(e) => setQ(e.target.value.toUpperCase())}
              className="pl-8 font-mono uppercase"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Desconto</TableHead>
                <TableHead>Escopo</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 shrink-0">
                        <Tag className="h-4 w-4 text-brand" />
                      </div>
                      <span className="font-mono font-bold">{c.code}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {c.discountType === "percentage" ? (
                      <span className="flex items-center gap-1 text-blue-600">
                        <BadgePercent className="h-4 w-4" />
                        {c.discountValue}% Off
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-mono">
                        -{formatBRL(c.discountValue)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{renderScopeCell(c, franchises)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(c.validity).toLocaleDateString("pt-BR")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        c.status === "active"
                          ? "bg-success/10 text-success border-success/20 cursor-pointer"
                          : "bg-muted text-muted-foreground cursor-pointer"
                      }
                      onClick={() => handleToggleStatus(c.id)}
                    >
                      {c.status === "active" ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(c)}
                        title="Editar cupom"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteId(c.id)}
                        title="Excluir cupom"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum cupom encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ─── Add / Edit Dialog ──────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? `Editar: ${editTarget.code}` : "Novo Cupom de Desconto"}</DialogTitle>
            <DialogDescription>
              {editTarget
                ? "Atualize as configurações deste cupom."
                : "Defina as regras e validade do cupom de desconto."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-1">
            {/* Code */}
            <div className="space-y-1.5">
              <Label htmlFor="cp-code">Código do Cupom *</Label>
              <Input
                id="cp-code"
                placeholder="Ex: QUERO50"
                className="uppercase font-mono tracking-wider"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              />
            </div>

            {/* Discount type + value */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo de Desconto</Label>
                <Select
                  value={form.discountType}
                  onValueChange={(v) => setForm((f) => ({ ...f, discountType: v as any }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentual (%)</SelectItem>
                    <SelectItem value="fixed">Fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cp-value">Valor *</Label>
                <Input
                  id="cp-value"
                  type="number"
                  placeholder={form.discountType === "percentage" ? "Ex: 15" : "Ex: 20.00"}
                  value={form.discountValue}
                  onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
                />
              </div>
            </div>

            {/* Validity */}
            <div className="space-y-1.5">
              <Label htmlFor="cp-validity">Data de Validade *</Label>
              <Input
                id="cp-validity"
                type="date"
                value={form.validity}
                onChange={(e) => setForm((f) => ({ ...f, validity: e.target.value }))}
              />
            </div>

            {/* Scope */}
            {profile === "franquia" ? (
              <div className="space-y-3 pt-2 border-t">
                <div className="space-y-1.5">
                  <Label>Escopo do Cupom</Label>
                  <Select
                    value={form.scope}
                    onValueChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        scope: v as "global" | "restricted",
                        selectedFranchiseIds: v === "global" ? [] : f.selectedFranchiseIds,
                      }))
                    }
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">Geral (Válido para toda a rede)</SelectItem>
                      <SelectItem value="restricted">Franquias Específicas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.scope === "restricted" && (
                  <div className="rounded-lg border p-3 space-y-2 max-h-44 overflow-y-auto">
                    <Label className="text-xs text-muted-foreground block">Unidades habilitadas</Label>
                    {franchises.map((f) => (
                      <label
                        key={f.id}
                        className="flex items-center gap-2.5 cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5"
                      >
                        <Checkbox
                          checked={form.selectedFranchiseIds.includes(f.id)}
                          onCheckedChange={() => toggleFranchise(f.id)}
                          id={`fc-${f.id}`}
                        />
                        <span className="text-sm">{f.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1.5 pt-2 border-t">
                <Label>Escopo Local</Label>
                <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg border">
                  Este cupom será válido exclusivamente para:{" "}
                  <strong>{currentFranchise.name}</strong>.
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} className="bg-brand text-brand-foreground hover:opacity-90">
              {editTarget ? "Salvar alterações" : "Registrar Cupom"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation ────────────────────────────────────────────── */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir cupom</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o cupom{" "}
              <strong className="font-mono">{couponToDelete?.code}</strong>? Esta ação não pode ser
              desfeita.
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
    </div>
  );
}
