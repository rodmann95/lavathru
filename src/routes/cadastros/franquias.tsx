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
import { Label } from "@/components/ui/label";
import { Plus, Search, Building2, MapPin, Phone, Pencil, Percent, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/lib/app-context";
import type { Franchise } from "@/lib/mock-data";

export const Route = createFileRoute("/cadastros/franquias")({
  head: () => ({ meta: [{ title: "Franquias — Lava Thru" }] }),
  component: FranquiasPage,
});

function FranquiasPage() {
  const { franchises, setFranchises } = useApp();
  const [q, setQ] = useState("");
  const [openNew, setOpenNew] = useState(false);

  // Form states
  const [editTarget, setEditTarget] = useState<Franchise | null>(null);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [royalty, setRoyalty] = useState("10");

  function openEdit(franchise: Franchise) {
    setEditTarget(franchise);
    setName(franchise.name);
    setCity(franchise.city);
    setRoyalty(franchise.royaltyFeePercent.toString());
    setOpenNew(true);
  }

  function openCreate() {
    setEditTarget(null);
    setName("");
    setCity("");
    setRoyalty("10");
    setOpenNew(true);
  }

  const filtered = useMemo(() => {
    return franchises.filter((f) => {
      if (!q) return true;
      const t = q.toLowerCase();
      return f.name.toLowerCase().includes(t) || f.city.toLowerCase().includes(t);
    });
  }, [q, franchises]);

  const activeCount = franchises.length; // all registered for now

  function handleSave() {
    if (!name || !city || !royalty) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    const parsedRoyalty = parseFloat(royalty);
    if (isNaN(parsedRoyalty) || parsedRoyalty < 0 || parsedRoyalty > 100) {
      toast.error("Taxa de royalties inválida");
      return;
    }

    if (editTarget) {
      setFranchises(prev => prev.map(f => f.id === editTarget.id ? { ...f, name, city, royaltyFeePercent: parsedRoyalty } : f));
      toast.success("Franquia atualizada com sucesso!");
    } else {
      const newFranchise = {
        id: `f-${Math.floor(100 + Math.random() * 900)}`,
        name,
        city,
        royaltyFeePercent: parsedRoyalty,
      };
      setFranchises((prev) => [...prev, newFranchise]);
      toast.success("Franquia cadastrada com sucesso!");
    }
    setOpenNew(false);
  }

  function handleDelete(id: string) {
    if (confirm("Tem certeza que deseja excluir esta franquia?")) {
      setFranchises((prev) => prev.filter((f) => f.id !== id));
      toast.success("Franquia removida com sucesso");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cadastrar Franquias</h1>
          <p className="text-sm text-muted-foreground">Gestão e cadastro de novas unidades Lava Thru</p>
        </div>
        <Button onClick={openCreate} className="bg-brand text-brand-foreground hover:opacity-90">
          <Plus className="h-4 w-4 mr-2" /> Nova Franquia
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-brand/5 to-transparent border border-brand/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unidades Totais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Unidades ativas na rede</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <CardTitle>Unidades ({filtered.length})</CardTitle>
          <div className="relative w-full max-w-xs">
            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Buscar unidade ou cidade…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Cidade / UF</TableHead>
                <TableHead>Royalties</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((f) => (
                <TableRow key={f.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-mono text-xs">{f.id}</TableCell>
                  <TableCell className="font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-brand" />
                    {f.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground flex items-center gap-1.5 pt-4">
                    <MapPin className="h-3.5 w-3.5" />
                    {f.city}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-[10px] gap-1">
                      <Percent className="h-2.5 w-2.5" />
                      {f.royaltyFeePercent}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-success text-success-foreground">Ativa</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(f)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(f.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhuma franquia encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTarget ? `Editar Franquia: ${editTarget.name}` : "Nova Unidade Lava Thru"}</DialogTitle>
            <DialogDescription>{editTarget ? "Atualize as informações da franquia." : "Preencha as informações para registrar uma nova franquia na plataforma."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome da Franquia</Label>
              <Input
                id="name"
                placeholder="Ex: Lava Thru Pinheiros"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="city">Cidade / UF</Label>
                <Input
                  id="city"
                  placeholder="Ex: São Paulo, SP"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="royalty">Taxa de Royalties (%)</Label>
                <Input
                  id="royalty"
                  type="number"
                  placeholder="Ex: 10"
                  value={royalty}
                  onChange={(e) => setRoyalty(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNew(false)}>Cancelar</Button>
            <Button onClick={handleSave} className="bg-brand text-brand-foreground hover:opacity-90">
              {editTarget ? "Salvar Alterações" : "Registrar Unidade"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
