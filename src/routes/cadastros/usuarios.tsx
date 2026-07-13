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
import { Plus, Search, UserCheck, Mail, Pencil, Trash2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/lib/app-context";
import type { User } from "@/lib/mock-data";

export const Route = createFileRoute("/cadastros/usuarios")({
  head: () => ({ meta: [{ title: "Usuários — Lava Thru" }] }),
  component: UsuariosPage,
});

type FormState = {
  name: string;
  email: string;
  role: "franquia" | "franqueado" | "operador";
  franchiseIds: string[];
};

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  role: "operador",
  franchiseIds: [],
};

function getRoleBadge(role: string) {
  switch (role) {
    case "franquia":
      return <Badge className="bg-brand text-brand-foreground">Franqueadora (Matriz)</Badge>;
    case "franqueado":
      return <Badge variant="secondary">Franqueado</Badge>;
    case "operador":
      return <Badge variant="outline">Operador</Badge>;
    default:
      return <Badge variant="outline">{role}</Badge>;
  }
}

function UsuariosPage() {
  const { users, setUsers, franchises, profile, currentFranchise } = useApp();
  const [q, setQ] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return users
      .filter((u) => {
        if (profile === "franqueado") {
          // Show users linked to current franchise (check both franchiseIds and legacy franchiseId)
          const ids = u.franchiseIds ?? (u.franchiseId ? [u.franchiseId] : []);
          return ids.includes(currentFranchise.id);
        }
        return true;
      })
      .filter((u) => {
        if (!q) return true;
        const t = q.toLowerCase();
        return u.name.toLowerCase().includes(t) || u.email.toLowerCase().includes(t);
      });
  }, [q, users, profile, currentFranchise.id]);

  function openNew() {
    setEditTarget(null);
    const defaultIds = profile === "franqueado" ? [currentFranchise.id] : [];
    setForm({ ...EMPTY_FORM, franchiseIds: defaultIds });
    setDialogOpen(true);
  }

  function openEdit(user: User) {
    setEditTarget(user);
    const ids = user.franchiseIds ?? (user.franchiseId ? [user.franchiseId] : []);
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      franchiseIds: ids,
    });
    setDialogOpen(true);
  }

  function toggleFranchise(id: string) {
    setForm((prev) => {
      const already = prev.franchiseIds.includes(id);
      return {
        ...prev,
        franchiseIds: already
          ? prev.franchiseIds.filter((f) => f !== id)
          : [...prev.franchiseIds, id],
      };
    });
  }

  function handleSave() {
    if (!form.name || !form.email) {
      toast.error("Preencha nome e e-mail.");
      return;
    }
    if (form.role !== "franquia" && form.franchiseIds.length === 0) {
      toast.error("Selecione ao menos uma franquia para este usuário.");
      return;
    }

    // For franqueado profile, always lock franchise to current
    const finalIds =
      profile === "franqueado" ? [currentFranchise.id] : form.franchiseIds;
    const finalRole =
      profile === "franqueado"
        ? form.role === "franquia"
          ? "operador"
          : form.role
        : form.role;

    if (editTarget) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editTarget.id
            ? {
                ...u,
                name: form.name,
                email: form.email,
                role: finalRole,
                franchiseIds: finalIds,
                franchiseId: finalIds[0] ?? undefined,
              }
            : u
        )
      );
      toast.success("Usuário atualizado com sucesso!");
    } else {
      const newUser: User = {
        id: `u-${Math.floor(100 + Math.random() * 900)}`,
        name: form.name,
        email: form.email,
        role: finalRole,
        franchiseIds: finalIds,
        franchiseId: finalIds[0] ?? undefined,
      };
      setUsers((prev) => [...prev, newUser]);
      toast.success("Usuário cadastrado com sucesso!");
    }
    setDialogOpen(false);
  }

  function handleDelete(id: string) {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setDeleteId(null);
    toast.success("Usuário removido.");
  }

  const userToDelete = users.find((u) => u.id === deleteId);

  // Determine which franchises to show in the selector
  const selectableFranchises =
    profile === "franqueado" ? [currentFranchise] : franchises;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usuários</h1>
          <p className="text-sm text-muted-foreground">
            {profile === "franqueado"
              ? `Gestão de colaboradores para ${currentFranchise.name}`
              : "Cadastre acessos e vincule usuários a uma ou mais franquias"}
          </p>
        </div>
        <Button onClick={openNew} className="bg-brand text-brand-foreground hover:opacity-90">
          <Plus className="h-4 w-4 mr-2" /> Novo Usuário
        </Button>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 pb-3">
          <CardTitle>Colaboradores ({filtered.length})</CardTitle>
          <div className="relative w-full max-w-xs">
            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Buscar nome ou e-mail…"
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
                <TableHead>E-mail</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Franquias Vinculadas</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => {
                const ids = u.franchiseIds ?? (u.franchiseId ? [u.franchiseId] : []);
                const linkedFranchises = franchises.filter((f) => ids.includes(f.id));
                return (
                  <TableRow key={u.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 shrink-0">
                          <UserCheck className="h-4 w-4 text-brand" />
                        </div>
                        {u.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-muted-foreground text-sm">
                        <Mail className="h-3.5 w-3.5" />
                        {u.email}
                      </span>
                    </TableCell>
                    <TableCell>{getRoleBadge(u.role)}</TableCell>
                    <TableCell>
                      {u.role === "franquia" ? (
                        <span className="text-xs text-muted-foreground">Todas as franquias</span>
                      ) : linkedFranchises.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {linkedFranchises.map((f) => (
                            <Badge key={f.id} variant="outline" className="text-xs gap-1 py-0">
                              <Building2 className="h-2.5 w-2.5" />
                              {f.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-destructive text-xs font-semibold">Não vinculado</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(u)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteId(u.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
            <DialogDescription>
              {editTarget
                ? "Atualize os dados e permissões de acesso."
                : "Crie uma credencial de acesso e defina as permissões."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-1">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="u-name">Nome Completo *</Label>
              <Input
                id="u-name"
                placeholder="Ex: João da Silva"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="u-email">E-mail *</Label>
              <Input
                id="u-email"
                type="email"
                placeholder="Ex: joao@email.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <Label htmlFor="u-role">Perfil / Cargo</Label>
              <Select
                value={form.role}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    role: v as FormState["role"],
                    franchiseIds: v === "franquia" ? [] : f.franchiseIds,
                  }))
                }
              >
                <SelectTrigger id="u-role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {profile === "franquia" && (
                    <SelectItem value="franquia">Franqueadora (Matriz)</SelectItem>
                  )}
                  <SelectItem value="franqueado">Franqueado (Gerente)</SelectItem>
                  <SelectItem value="operador">Operador (Pátio)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Franchise selector — hidden if role is "franquia" (matrix) */}
            {form.role !== "franquia" && (
              <div className="space-y-2">
                <Label>
                  Franquias Vinculadas *
                  {profile === "franqueado" && (
                    <span className="ml-1 text-xs text-muted-foreground">(fixo)</span>
                  )}
                </Label>
                {profile === "franqueado" ? (
                  <Input value={currentFranchise.name} disabled className="bg-muted" />
                ) : (
                  <div className="rounded-md border p-3 space-y-2 max-h-44 overflow-y-auto">
                    {selectableFranchises.map((f) => (
                      <label
                        key={f.id}
                        className="flex items-center gap-2.5 cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5"
                      >
                        <Checkbox
                          checked={form.franchiseIds.includes(f.id)}
                          onCheckedChange={() => toggleFranchise(f.id)}
                          id={`chk-${f.id}`}
                        />
                        <span className="text-sm">{f.name}</span>
                        <span className="text-xs text-muted-foreground ml-auto">{f.city}</span>
                      </label>
                    ))}
                  </div>
                )}
                {form.role !== "franquia" && profile === "franquia" && form.franchiseIds.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {form.franchiseIds.length} franquia(s) selecionada(s)
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} className="bg-brand text-brand-foreground hover:opacity-90">
              {editTarget ? "Salvar alterações" : "Registrar Usuário"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remover usuário</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover <strong>{userToDelete?.name}</strong>? Esta ação não pode
              ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)}>
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
