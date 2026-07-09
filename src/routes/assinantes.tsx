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
import { Label } from "@/components/ui/label";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { SUBSCRIBERS, PLAN_PRICE, formatBRL } from "@/lib/mock-data";
import { useApp } from "@/lib/app-context";

export const Route = createFileRoute("/assinantes")({
  head: () => ({ meta: [{ title: "Assinantes — Lava Thru" }] }),
  component: AssinantesPage,
});

function AssinantesPage() {
  const { currentFranchise } = useApp();
  const [q, setQ] = useState("");
  const [openNew, setOpenNew] = useState(false);

  const rows = useMemo(() => {
    return SUBSCRIBERS.filter((s) => s.franchiseId === currentFranchise.id).filter((s) => {
      if (!q) return true;
      const t = q.toLowerCase();
      return s.name.toLowerCase().includes(t) || s.plate.toLowerCase().includes(t) || s.phone.includes(t);
    });
  }, [q, currentFranchise.id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Assinantes</h1>
          <p className="text-sm text-muted-foreground">Plano Lava Thru — {formatBRL(PLAN_PRICE)}/mês · {currentFranchise.name}</p>
        </div>
        <Button onClick={() => setOpenNew(true)} className="bg-brand text-brand-foreground hover:opacity-90">
          <Plus className="h-4 w-4 mr-2" /> Gerar nova assinatura
        </Button>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <CardTitle>Lista de assinantes ({rows.length})</CardTitle>
          <div className="relative w-full max-w-xs">
            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input placeholder="Buscar nome, placa, telefone…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-8" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Placa</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Uso do plano</TableHead>
                <TableHead className="text-right">Disponível</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => {
                const available = s.planIncluded - s.planUsed;
                const pct = (s.planUsed / s.planIncluded) * 100;
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="font-mono">{s.plate}</TableCell>
                    <TableCell>{s.phone}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[180px]">
                        <Progress value={pct} className="h-2" />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{s.planUsed}/{s.planIncluded}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={available > 0 ? "default" : "destructive"} className={available > 0 ? "bg-success text-success-foreground" : ""}>
                        {available} disponíveis
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              {rows.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum assinante encontrado.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <NewSubscriberDialog open={openNew} onOpenChange={setOpenNew} />
    </div>
  );
}

function NewSubscriberDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerar nova assinatura</DialogTitle>
          <DialogDescription>Plano Lava Thru — {formatBRL(PLAN_PRICE)}/mês, 8 lavagens inclusas</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <F label="Placa" placeholder="ABC1D23" />
          <F label="Nome" placeholder="Nome completo" />
          <F label="Telefone" placeholder="(00) 00000-0000" />
          <F label="Email" placeholder="email@exemplo.com" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => { toast.success("Assinatura criada com sucesso"); onOpenChange(false); }} className="bg-brand text-brand-foreground hover:opacity-90">
            Criar assinatura
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function F({ label, ...p }: { label: string } & React.ComponentProps<typeof Input>) {
  return <div><Label>{label}</Label><Input {...p} /></div>;
}
