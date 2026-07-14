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
import { Plus, Search, Settings2, Pencil, Trash2, Percent, Package, Ban, Flame } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/lib/app-context";
import { formatBRL } from "@/lib/mock-data";
import type { Product } from "@/lib/mock-data";

export const Route = createFileRoute("/cadastros/produtos")({
  head: () => ({ meta: [{ title: "Produtos — Lava Thru" }] }),
  component: ProdutosPage,
});

type FormState = {
  name: string;
  code: string;
  price: string;
  royaltyPercent: string;
  isHot: boolean;
};

const EMPTY_FORM: FormState = { name: "", code: "", price: "", royaltyPercent: "10", isHot: false };

function ProdutosPage() {
  const { products, setProducts, franchises, profile } = useApp();
  const [q, setQ] = useState("");
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<string>("global");

  // Add / Edit dialog (Only for Franqueadora)
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Override config modal (For Franqueadora specific franchise view, or Franqueado)
  const [overrideProduct, setOverrideProduct] = useState<{
    id: string;
    name: string;
    basePrice: number;
    currentPrice?: number;
    currentStock?: number;
    isDisabled?: boolean;
  } | null>(null);
  const [overridePriceInput, setOverridePriceInput] = useState("");
  const [stockInput, setStockInput] = useState("");
  const [isDisabledInput, setIsDisabledInput] = useState(false);

  const isGlobalView = selectedFranchiseId === "global";
  const activeFranchiseId = profile === "franqueado" ? franchises[0]?.id : selectedFranchiseId;

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (!q) return true;
      const t = q.toLowerCase();
      return p.name.toLowerCase().includes(t) || p.code?.toLowerCase().includes(t);
    });
  }, [q, products]);

  function openNew() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(product: Product) {
    setEditTarget(product);
    setForm({
      name: product.name,
      code: product.code || "",
      price: product.basePrice.toString(),
      royaltyPercent: product.royaltyFee?.toString() ?? "10",
      isHot: product.isHot || false,
    });
    setDialogOpen(true);
  }

  function handleSave() {
    const parsedPrice = parseFloat(form.price);
    const parsedRoyalty = parseFloat(form.royaltyPercent);

    if (!form.name || !form.price) {
      toast.error("Preencha nome e preço.");
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      toast.error("Digite um preço válido.");
      return;
    }
    if (isNaN(parsedRoyalty) || parsedRoyalty < 0 || parsedRoyalty > 100) {
      toast.error("O % de Royalties deve estar entre 0 e 100.");
      return;
    }

    if (editTarget) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editTarget.id
            ? {
                ...p,
                name: form.name,
                code: form.code || undefined,
                basePrice: parsedPrice,
                royaltyFee: parsedRoyalty,
                isHot: form.isHot,
              }
            : p
        )
      );
      toast.success(`Produto "${form.name}" atualizado!`);
    } else {
      // Create new
      const newProduct: Product = {
        id: `prod-${Math.floor(Math.random() * 10000)}`,
        name: form.name,
        code: form.code || undefined,
        basePrice: parsedPrice,
        royaltyFee: parsedRoyalty,
        isHot: form.isHot,
        priceOverrides: {},
        stock: {},
        disabledIn: [],
      };
      setProducts((prev) => [...prev, newProduct]);
      toast.success(`Produto "${form.name}" cadastrado!`);
    }
    setDialogOpen(false);
  }

  function handleDelete(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setDeleteTarget(null);
    toast.success("Produto excluído.");
  }

  function handleOpenConfig(product: Product) {
    const override = product.priceOverrides?.[activeFranchiseId];
    const stock = product.stock?.[activeFranchiseId];
    const isDisabled = product.disabledIn?.includes(activeFranchiseId);
    
    setOverrideProduct({
      id: product.id,
      name: product.name,
      basePrice: product.basePrice,
      currentPrice: override,
      currentStock: stock,
      isDisabled: !!isDisabled,
    });
    setOverridePriceInput(override !== undefined ? override.toString() : product.basePrice.toString());
    setStockInput(stock !== undefined ? stock.toString() : "0");
    setIsDisabledInput(!!isDisabled);
  }

  function handleSaveConfig() {
    if (!overrideProduct || (isGlobalView && profile === "franquia")) return;
    const cleanPrice = parseFloat(overridePriceInput);
    const cleanStock = parseInt(stockInput, 10) || 0;

    if (!isDisabledInput && (isNaN(cleanPrice) || cleanPrice < 0)) {
      toast.error("Digite um preço válido.");
      return;
    }
    
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === overrideProduct.id) {
          const overrides = { ...p.priceOverrides };
          if (cleanPrice !== p.basePrice) {
            overrides[activeFranchiseId] = cleanPrice;
          } else {
            delete overrides[activeFranchiseId];
          }

          const stocks = { ...p.stock };
          stocks[activeFranchiseId] = cleanStock;

          const disabled = p.disabledIn ? [...p.disabledIn] : [];
          if (isDisabledInput && !disabled.includes(activeFranchiseId)) {
            disabled.push(activeFranchiseId);
          } else if (!isDisabledInput) {
            const idx = disabled.indexOf(activeFranchiseId);
            if (idx > -1) disabled.splice(idx, 1);
          }

          return { ...p, priceOverrides: overrides, stock: stocks, disabledIn: disabled };
        }
        return p;
      })
    );
    toast.success(`Configuração de "${overrideProduct.name}" salva!`);
    setOverrideProduct(null);
  }

  const selectedFranchiseObj = franchises.find((f) => f.id === activeFranchiseId);
  const canEditGlobal = profile === "franquia";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Produtos</h1>
          <p className="text-sm text-muted-foreground">
            {canEditGlobal 
              ? "Gerencie os produtos globais, preços sugeridos e royalties."
              : "Gerencie o estoque e preço de venda dos produtos na sua franquia."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canEditGlobal && (
            <>
              <Label className="text-sm font-medium whitespace-nowrap">Visualizar como:</Label>
              <Select value={selectedFranchiseId} onValueChange={setSelectedFranchiseId}>
                <SelectTrigger className="w-[280px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Visão Global (Matriz)</SelectItem>
                  {franchises.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
        </div>
        {canEditGlobal && (
          <Button onClick={openNew} className="bg-brand text-brand-foreground hover:opacity-90">
            <Plus className="h-4 w-4 mr-2" /> Novo Produto
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 pb-3">
          <CardTitle>
            {isGlobalView && canEditGlobal
              ? `Todos os Produtos (${filtered.length})`
              : `Produtos de ${selectedFranchiseObj?.name} (${filtered.length})`}
          </CardTitle>
          <div className="relative w-full max-w-xs">
            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Buscar produto…"
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
                <TableHead>Produto</TableHead>
                <TableHead>Código (SKU)</TableHead>
                <TableHead>Preço Sugerido</TableHead>
                {(!isGlobalView || !canEditGlobal) && <TableHead>Preço Venda</TableHead>}
                {(!isGlobalView || !canEditGlobal) && <TableHead>Estoque</TableHead>}
                {canEditGlobal && <TableHead>Royalties</TableHead>}
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => {
                const hasOverride = !isGlobalView && p.priceOverrides?.[activeFranchiseId] !== undefined;
                const effectivePrice = hasOverride ? p.priceOverrides![activeFranchiseId] : p.basePrice;
                const stock = (!isGlobalView || !canEditGlobal) ? (p.stock?.[activeFranchiseId] || 0) : null;
                const isDisabledLocally = (!isGlobalView || !canEditGlobal) && p.disabledIn?.includes(activeFranchiseId);

                return (
                  <TableRow key={p.id} className={`hover:bg-muted/50 transition-colors ${isDisabledLocally ? 'opacity-50' : ''}`}>
                    <TableCell className="font-semibold">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 shrink-0">
                          <Package className="h-4 w-4 text-brand" />
                        </div>
                        <div className="flex flex-col">
                          <span>{p.name}</span>
                          {p.isHot && <span className="text-[10px] font-bold text-orange-500 uppercase flex items-center gap-1 mt-0.5"><Flame className="h-3 w-3" /> Destaque PDV</span>}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="font-mono text-muted-foreground text-xs">
                      {p.code || "—"}
                    </TableCell>

                    <TableCell className="font-mono text-muted-foreground">
                      {formatBRL(p.basePrice)}
                    </TableCell>

                    {(!isGlobalView || !canEditGlobal) && (
                      <TableCell className="font-bold font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className={hasOverride ? "text-amber-600" : ""}>
                            {formatBRL(effectivePrice)}
                          </span>
                          {hasOverride && (
                            <Badge className="bg-amber-500/10 text-amber-600 border-amber-300 text-[10px] h-4">
                              Customizado
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    )}

                    {(!isGlobalView || !canEditGlobal) && (
                      <TableCell className="font-mono">
                        {stock} un
                      </TableCell>
                    )}

                    {canEditGlobal && (
                      <TableCell>
                        <Badge variant="outline" className="gap-1 font-mono">
                          <Percent className="h-2.5 w-2.5" />
                          {p.royaltyFee}%
                        </Badge>
                      </TableCell>
                    )}

                    <TableCell>
                      {isDisabledLocally ? (
                        <Badge variant="secondary" className="text-muted-foreground">Desabilitado</Badge>
                      ) : (
                        <Badge className="bg-success/10 text-success border-success/20">Ativo</Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {isGlobalView && canEditGlobal ? (
                          <>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)} title="Editar produto">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteTarget(p.id)} title="Excluir produto">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => handleOpenConfig(p)} className="gap-1 h-8">
                            <Settings2 className="h-3.5 w-3.5" />
                            Configurar Produto
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum produto encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? `Editar Produto: ${editTarget.name}` : "Novo Produto"}</DialogTitle>
            <DialogDescription>
              {editTarget
                ? "Atualize os dados do produto. O valor base afeta as franquias que não o customizaram."
                : "Adicione um produto global, defina seu preço sugerido e royalties."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5 md:col-span-2">
                <Label>Nome do Produto *</Label>
                <Input placeholder="Ex: Cera Automotiva, Limpa Vidros" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Código (SKU)</Label>
                <Input placeholder="Opcional" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Preço Sugerido R$ *</Label>
                <Input type="number" placeholder="0,00" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Royalties Matriz %</Label>
                <Input type="number" placeholder="5" min={0} max={100} value={form.royaltyPercent} onChange={(e) => setForm((f) => ({ ...f, royaltyPercent: e.target.value }))} />
                <p className="text-[11px] text-muted-foreground">% repassado à Franqueadora por venda</p>
              </div>
            </div>

            <div className="flex items-center justify-between border rounded-lg p-3 bg-muted/30">
              <div className="space-y-0.5">
                <Label>Destaque no PDV (Hot)</Label>
                <p className="text-xs text-muted-foreground">Exibe este produto na tela inicial da operação</p>
              </div>
              <Switch checked={form.isHot} onCheckedChange={(c) => setForm((f) => ({ ...f, isHot: c }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} className="bg-brand text-brand-foreground hover:opacity-90">
              {editTarget ? "Salvar alterações" : "Cadastrar Produto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir produto</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteTarget && handleDelete(deleteTarget)}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!overrideProduct} onOpenChange={(v) => !v && setOverrideProduct(null)}>
        <DialogContent className="max-w-md">
          {overrideProduct && (
            <>
              <DialogHeader>
                <DialogTitle>Configurar Produto na Franquia</DialogTitle>
                <DialogDescription>
                  Ajuste o estoque, preço de venda ou desative a venda do produto <strong>{overrideProduct.name}</strong> em sua franquia.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="rounded-lg bg-muted p-3 space-y-1 text-sm">
                  <div className="text-muted-foreground">Franquia: <strong>{selectedFranchiseObj?.name}</strong></div>
                  <div className="text-muted-foreground">Preço Sugerido: <strong>{formatBRL(overrideProduct.basePrice)}</strong></div>
                </div>
                
                <div className="space-y-1.5 flex items-center justify-between border rounded-lg p-3">
                  <div>
                    <Label className="font-semibold">Vender este produto?</Label>
                    <p className="text-xs text-muted-foreground">Desmarque se sua franquia não possui este item</p>
                  </div>
                  <Button variant={isDisabledInput ? "outline" : "default"} onClick={() => setIsDisabledInput(!isDisabledInput)} className={isDisabledInput ? "border-destructive text-destructive" : "bg-success hover:bg-success/90 text-success-foreground"}>
                    {isDisabledInput ? <Ban className="h-4 w-4 mr-2" /> : <Package className="h-4 w-4 mr-2" />}
                    {isDisabledInput ? "Não Vendemos" : "Vendemos"}
                  </Button>
                </div>

                {!isDisabledInput && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Preço de Venda R$</Label>
                      <Input type="number" placeholder="0,00" value={overridePriceInput} onChange={(e) => setOverridePriceInput(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Estoque Atual (Un)</Label>
                      <Input type="number" placeholder="0" value={stockInput} onChange={(e) => setStockInput(e.target.value)} />
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setOverrideProduct(null)}>Cancelar</Button>
                <Button onClick={handleSaveConfig} className="bg-brand text-brand-foreground hover:opacity-90">Salvar Configurações</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
