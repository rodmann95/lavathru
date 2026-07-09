import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { SALES, formatBRL } from "@/lib/mock-data";
import { useApp } from "@/lib/app-context";
import { DollarSign, TrendingUp, CreditCard } from "lucide-react";

export const Route = createFileRoute("/financeiro")({
  head: () => ({ meta: [{ title: "Financeiro — Lava Thru" }] }),
  component: FinanceiroPage,
});

function FinanceiroPage() {
  const { currentFranchise } = useApp();
  const [period, setPeriod] = useState("30");

  const data = useMemo(() => {
    const days = parseInt(period);
    const cutoff = Date.now() - days * 86400000;
    const rows = SALES.filter((s) => s.franchiseId === currentFranchise.id && new Date(s.date).getTime() >= cutoff);
    const total = rows.reduce((a, s) => a + s.amount, 0);
    const paidRows = rows.filter((s) => s.amount > 0);

    const byPayment: Record<string, number> = {};
    paidRows.forEach((s) => { byPayment[s.payment] = (byPayment[s.payment] || 0) + s.amount; });
    const paymentChart = Object.entries(byPayment).map(([name, value]) => ({ name, value }));

    return { rows: [...rows].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20), total, paymentChart, count: paidRows.length };
  }, [period, currentFranchise.id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-sm text-muted-foreground">Vendas e recebimentos — {currentFranchise.name}</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Kpi icon={DollarSign} label="Faturamento" value={formatBRL(data.total)} />
        <Kpi icon={CreditCard} label="Vendas pagas" value={data.count.toString()} />
        <Kpi icon={TrendingUp} label="Ticket médio" value={formatBRL(data.total / Math.max(1, data.count))} />
      </div>

      <Card>
        <CardHeader><CardTitle>Recebimento por forma de pagamento</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.paymentChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(v: number) => formatBRL(v)} />
              <Bar dataKey="value" fill="var(--color-brand)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Últimas vendas</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Placa</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="text-sm">{new Date(s.date).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="font-mono text-sm">{s.plate}</TableCell>
                  <TableCell className="text-sm">{s.clientName}</TableCell>
                  <TableCell><Badge variant="outline">{s.service}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={s.payment === "Assinatura" ? "secondary" : "default"} className={s.payment === "Assinatura" ? "" : "bg-brand text-brand-foreground"}>
                      {s.payment}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">{s.amount === 0 ? "—" : formatBRL(s.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div className="h-11 w-11 rounded-lg bg-brand-gradient flex items-center justify-center text-white">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
          <div className="text-2xl font-bold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
