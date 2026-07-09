import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CLIENTS, formatBRL } from "@/lib/mock-data";
import { Trophy } from "lucide-react";

export const Route = createFileRoute("/clientes")({
  head: () => ({ meta: [{ title: "Clientes — Lava Thru" }] }),
  component: ClientesPage,
});

function ClientesPage() {
  const [period, setPeriod] = useState("90");
  const [selected, setSelected] = useState<(typeof CLIENTS)[number] | null>(null);

  const ranked = useMemo(() => [...CLIENTS].sort((a, b) => b.visits - a.visits), []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">Ranking por uso e faturamento</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
            <SelectItem value="all">Todo o período</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader><CardTitle>Ranking de clientes</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Placa</TableHead>
                <TableHead className="text-right">Visitas</TableHead>
                <TableHead className="text-right">Total gasto</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranked.map((c, i) => (
                <TableRow key={c.id}>
                  <TableCell>
                    {i < 3 ? <Trophy className={`h-4 w-4 ${["text-yellow-500", "text-slate-400", "text-orange-600"][i]}`} /> : i + 1}
                  </TableCell>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="font-mono">{c.plate}</TableCell>
                  <TableCell className="text-right font-semibold">{c.visits}</TableCell>
                  <TableCell className="text-right">{formatBRL(c.totalSpent)}</TableCell>
                  <TableCell>
                    {c.isSubscriber ? <Badge className="bg-brand text-brand-foreground">Assinante</Badge> : <Badge variant="outline">Avulso</Badge>}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => setSelected(c)}>Detalhes</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name}</DialogTitle>
                <DialogDescription>Placa <span className="font-mono">{selected.plate}</span> · {selected.phone}</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-3 gap-3 py-2">
                <Stat label="Visitas" value={selected.visits.toString()} />
                <Stat label="Total gasto" value={formatBRL(selected.totalSpent)} />
                <Stat label="Última visita" value={new Date(selected.lastVisit).toLocaleDateString("pt-BR")} />
              </div>
              <div className="text-sm">
                <div className="font-semibold mb-1">Status:</div>
                {selected.isSubscriber
                  ? <Badge className="bg-brand text-brand-foreground">Assinante Lava Thru</Badge>
                  : <Badge variant="outline">Cliente avulso</Badge>}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}
