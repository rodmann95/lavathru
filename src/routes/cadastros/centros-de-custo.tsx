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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Pencil, Trash2, LineChart, TrendingUp, TrendingDown, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/lib/app-context";
import type { CostCenter } from "@/lib/mock-data";

export const Route = createFileRoute("/cadastros/centros-de-custo")({
  head: () => ({ meta: [{ title: "Centros de Custo — Lava Thru" }] }),
  component: CostCentersPage,
});

type FormState = {
  name: string;
  type: "receita" | "despesa" | "ambos";
  group: string;
  description: string;
  franchiseIds: string[];
};

const EMPTY_FORM: FormState = {
  name: "",
  type: "despesa",
  group: "Operacional",
  description: "",
  franchiseIds: [],
};

function CostCentersPage() {
  const { costCenters, setCostCenters, profile, franchises } = useApp();
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "receita" | "despesa" | "ambos">("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CostCenter | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Somente a matriz deve gerenciar centros de custo neste sistema simplificado
  if (profile !== "franquia") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <LineChart className="h-16 w-16 text-muted-foreground/30" />
        <h2 className="text-xl font-bold">Acesso Restrito</h2>
        <p className="text-muted-foreground">O cadastro de Centros de Custo é gerido pela Franqueadora.</p>
      </div>
    );
  }

  const filtered = useMemo(() => {
    return costCenters
      .filter((cc) => {
        if (typeFilter !== "all" && cc.type !== typeFilter) return false;
        if (!q) return true;
        const t = q.toLowerCase();
        return cc.name.toLowerCase().includes(t) || cc.group.toLowerCase().includes(t);
      });
  }, [costCenters, q, typeFilter]);

  function openNew() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(cc: CostCenter) {
    setEditTarget(cc);
    setForm({
      name: cc.name,
      type: cc.type,
      group: cc.group,
      description: cc.description || "",
      franchiseIds: cc.franchiseIds || [],
    });
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.name || !form.group) {
      toast.error("Preencha o nome e o grupo.");
      return;
    }

    if (editTarget) {
      setCostCenters((prev) =>
        prev.map((cc) =>
          cc.id === editTarget.id
            ? { ...cc, name: form.name, type: form.type, group: form.group, description: form.description, franchiseIds: form.franchiseIds.length > 0 ? form.franchiseIds : undefined }
            : cc
        )
      );
      toast.success("Centro de custo atualizado!");
    } else {
      const newCC: CostCenter = {
        id: `cc-${Math.floor(100 + Math.random() * 900)}`,
        name: form.name,
        type: form.type,
        group: form.group,
        description: form.description,
        franchiseIds: form.franchiseIds.length > 0 ? form.franchiseIds : undefined,
      };
      setCostCenters((prev) => [...prev, newCC]);
      toast.success("Centro de custo criado!");
    }
    setDialogOpen(false);
  }

  function handleDelete(id: string) {
    setCostCenters((prev) => prev.filter((cc) => cc.id !== id));
    setDeleteId(null);
    toast.success("Centro de custo removido.");
  }

  const ccToDelete = costCenters.find((c) => c.id === deleteId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Centros de Custo</h1>
          <p className="text-sm text-muted-foreground">Gerencie a estrutura contábil (receitas e despesas) da rede</p>
        </div>
        <Button onClick={openNew} className="bg-brand text-brand-foreground hover:opacity-90">
          <Plus className="h-4 w-4 mr-2" /> Novo Centro de Custo
        </Button>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 pb-3">
          <CardTitle>Plano de Contas ({filtered.length})</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="receita">Receitas</SelectItem>
                <SelectItem value="despesa">Despesas</SelectItem>
                <SelectItem value="ambos">Ambos</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative w-full max-w-[200px]">
              <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Buscar…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Escopo</TableHead>
                <TableHead>Descricão</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((cc) => (
                <TableRow key={cc.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">{cc.name}</TableCell>
                  <TableCell>{cc.group}</TableCell>
                  <TableCell>
                    {cc.type === "receita" && (
                      <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-200">
                        <TrendingUp className="h-3 w-3 mr-1" /> Receita
                      </Badge>
                    )}
                    {cc.type === "despesa" && (
                      <Badge className="bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 border-rose-200">
                        <TrendingDown className="h-3 w-3 mr-1" /> Despesa
                      </Badge>
                    )}
                    {cc.type === "ambos" && (
                      <Badge className="bg-slate-500/10 text-slate-700 hover:bg-slate-500/20 border-slate-200">
                        <ArrowRightLeft className="h-3 w-3 mr-1" /> Ambos
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {cc.franchiseIds && cc.franchiseIds.length > 0 ? (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {cc.franchiseIds.length} Franquia(s)
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-slate-100">Global (Todas)</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[250px] truncate">
                    {cc.description || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(cc)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(cc.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum centro de custo encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog: Create/Edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Editar Centro de Custo" : "Novo Centro de Custo"}</DialogTitle>
            <DialogDescription>
              {editTarget ? "Atualize os dados desta conta." : "Crie uma nova classificação contábil para o DRE."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="cc-name">Nome *</Label>
              <Input
                id="cc-name"
                placeholder="Ex: Material de Escritório"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo *</Label>
                <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receita">Receita</SelectItem>
                    <SelectItem value="despesa">Despesa</SelectItem>
                    <SelectItem value="ambos">Ambos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cc-group">Grupo (DRE) *</Label>
                <Input
                  id="cc-group"
                  placeholder="Ex: Operacional"
                  value={form.group}
                  onChange={(e) => setForm({ ...form, group: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cc-desc">Descrição Opcional</Label>
              <Textarea
                id="cc-desc"
                placeholder="Detalhes adicionais sobre o que entra neste centro de custo..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            
            <div className="space-y-2 border-t pt-4">
              <Label>Acesso do Centro de Custo</Label>
              <p className="text-xs text-muted-foreground">Selecione as franquias que podem utilizar este centro de custo. Deixe tudo desmarcado para torná-lo Global (disponível para todas).</p>
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-[120px] overflow-y-auto p-2 border rounded-md">
                {franchises.map(f => {
                  const isChecked = form.franchiseIds.includes(f.id);
                  return (
                    <label key={f.id} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-muted/50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const newIds = e.target.checked 
                            ? [...form.franchiseIds, f.id] 
                            : form.franchiseIds.filter(id => id !== f.id);
                          setForm({ ...form, franchiseIds: newIds });
                        }}
                        className="rounded border-gray-300 text-brand focus:ring-brand"
                      />
                      <span className="truncate">{f.name.replace("Lava Thru ", "")}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} className="bg-brand text-brand-foreground hover:opacity-90">
              {editTarget ? "Salvar alterações" : "Criar Centro de Custo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir Centro de Custo</DialogTitle>
            <DialogDescription>
              Deseja remover <strong>{ccToDelete?.name}</strong>? Lançamentos vinculados perderão a referência.
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
