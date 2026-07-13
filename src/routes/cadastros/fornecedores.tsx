import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Truck, Plus, Search, Pencil, Trash2, Phone, Mail, Building2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/cadastros/fornecedores")({
  head: () => ({ meta: [{ title: "Fornecedores — Lava Thru" }] }),
  component: FornecedoresPage,
});

interface Supplier {
  id: string;
  name: string;
  category: string;
  contact: string;
  phone: string;
  email: string;
  cnpj: string;
  status: "active" | "inactive";
}

const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: "sup-001",
    name: "Química Total Ltda",
    category: "Produtos de Limpeza",
    contact: "Carlos Mendes",
    phone: "(11) 3456-7890",
    email: "comercial@quimica-total.com.br",
    cnpj: "12.345.678/0001-90",
    status: "active",
  },
  {
    id: "sup-002",
    name: "MáquinasWash Brasil",
    category: "Equipamentos",
    contact: "Ana Paula Rocha",
    phone: "(21) 2345-6789",
    email: "vendas@maquinaswash.com.br",
    cnpj: "23.456.789/0001-01",
    status: "active",
  },
  {
    id: "sup-003",
    name: "EmbalaFast Distribuidora",
    category: "Embalagens",
    contact: "Roberto Lima",
    phone: "(31) 4567-8901",
    email: "roberto@embalaffast.com",
    cnpj: "34.567.890/0001-12",
    status: "inactive",
  },
  {
    id: "sup-004",
    name: "AutoPeças & Acessórios SP",
    category: "Acessórios",
    contact: "Fernanda Souza",
    phone: "(11) 9876-5432",
    email: "fernanda@autopecas-sp.com.br",
    cnpj: "45.678.901/0001-23",
    status: "active",
  },
];

const CATEGORIES = [
  "Produtos de Limpeza",
  "Equipamentos",
  "Embalagens",
  "Acessórios",
  "Manutenção",
  "Uniformes",
  "TI / Software",
  "Outros",
];

const EMPTY_FORM: Omit<Supplier, "id"> = {
  name: "",
  category: CATEGORIES[0],
  contact: "",
  phone: "",
  email: "",
  cnpj: "",
  status: "active",
};

function FornecedoresPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Supplier | null>(null);
  const [form, setForm] = useState<Omit<Supplier, "id">>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase()) ||
      s.contact.toLowerCase().includes(search.toLowerCase()) ||
      s.cnpj.includes(search)
  );

  function openNew() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(supplier: Supplier) {
    setEditTarget(supplier);
    setForm({
      name: supplier.name,
      category: supplier.category,
      contact: supplier.contact,
      phone: supplier.phone,
      email: supplier.email,
      cnpj: supplier.cnpj,
      status: supplier.status,
    });
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.name || !form.contact || !form.phone) {
      toast.error("Preencha os campos obrigatórios: Nome, Contato e Telefone.");
      return;
    }
    if (editTarget) {
      setSuppliers((prev) =>
        prev.map((s) => (s.id === editTarget.id ? { ...s, ...form } : s))
      );
      toast.success("Fornecedor atualizado com sucesso!");
    } else {
      const newSupplier: Supplier = {
        id: `sup-${Date.now()}`,
        ...form,
      };
      setSuppliers((prev) => [...prev, newSupplier]);
      toast.success("Fornecedor cadastrado com sucesso!");
    }
    setDialogOpen(false);
  }

  function handleDelete(id: string) {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    setDeleteId(null);
    toast.success("Fornecedor removido.");
  }

  const supplierToDelete = suppliers.find((s) => s.id === deleteId);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fornecedores</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie os fornecedores de produtos, equipamentos e serviços da rede.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: suppliers.length, color: "text-foreground" },
          { label: "Ativos", value: suppliers.filter((s) => s.status === "active").length, color: "text-success" },
          { label: "Inativos", value: suppliers.filter((s) => s.status === "inactive").length, color: "text-muted-foreground" },
          { label: "Categorias", value: new Set(suppliers.map((s) => s.category)).size, color: "text-brand" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-4 pb-3">
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" /> Lista de Fornecedores
            </CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar fornecedor…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button
                onClick={openNew}
                className="bg-brand text-brand-foreground hover:opacity-90 shrink-0"
              >
                <Plus className="h-4 w-4 mr-1.5" /> Novo Fornecedor
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum fornecedor encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 shrink-0">
                          <Building2 className="h-4 w-4 text-brand" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{supplier.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {supplier.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{supplier.contact}</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Phone className="h-3 w-3" /> {supplier.phone}
                      </div>
                      {supplier.email && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" /> {supplier.email}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{supplier.cnpj}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          supplier.status === "active"
                            ? "bg-success/10 text-success border-success/20"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {supplier.status === "active" ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(supplier)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(supplier.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle>
            <DialogDescription>
              {editTarget
                ? "Atualize os dados do fornecedor."
                : "Preencha as informações para cadastrar um novo fornecedor."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Nome da empresa *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nome do fornecedor"
              />
            </div>
            <div className="col-span-2">
              <Label>Categoria *</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nome do contato *</Label>
              <Input
                value={form.contact}
                onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
                placeholder="Nome do responsável"
              />
            </div>
            <div>
              <Label>Telefone *</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="email@fornecedor.com"
                type="email"
              />
            </div>
            <div>
              <Label>CNPJ</Label>
              <Input
                value={form.cnpj}
                onChange={(e) => setForm((f) => ({ ...f, cnpj: e.target.value }))}
                placeholder="00.000.000/0001-00"
              />
            </div>
            <div className="col-span-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v as "active" | "inactive" }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-brand text-brand-foreground hover:opacity-90">
              {editTarget ? "Salvar alterações" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remover fornecedor</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover <strong>{supplierToDelete?.name}</strong>? Esta ação não pode
              ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
