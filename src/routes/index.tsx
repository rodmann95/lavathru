import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";
import { Car, DollarSign, Users, TrendingUp } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { SALES, SERVICES, formatBRL } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "Dashboard — Lava Thru" }],
  }),
  component: Dashboard,
});

const PERIODS = { "7": "Últimos 7 dias", "30": "Últimos 30 dias", "90": "Últimos 90 dias" };

function Dashboard() {
  const { currentFranchise } = useApp();
  const [period, setPeriod] = useState<keyof typeof PERIODS>("30");

  const data = useMemo(() => {
    const days = parseInt(period);
    const cutoff = Date.now() - days * 86400000;
    const filtered = SALES.filter(
      (s) => new Date(s.date).getTime() >= cutoff && s.franchiseId === currentFranchise.id,
    );
    const totalCars = filtered.length;
    const revenue = filtered.reduce((a, s) => a + s.amount, 0);
    const subscribers = filtered.filter((s) => s.payment === "Assinatura").length;
    const ticket = totalCars > 0 ? revenue / Math.max(1, filtered.filter((s) => s.amount > 0).length) : 0;

    const byService = SERVICES.map((svc) => {
      const rows = filtered.filter((s) => s.service === svc.name);
      return { name: svc.name, count: rows.length, revenue: rows.reduce((a, s) => a + s.amount, 0) };
    });

    // series by day
    const byDay: Record<string, { date: string; carros: number; faturamento: number }> = {};
    filtered.forEach((s) => {
      const d = new Date(s.date).toISOString().slice(0, 10);
      if (!byDay[d]) byDay[d] = { date: d, carros: 0, faturamento: 0 };
      byDay[d].carros += 1;
      byDay[d].faturamento += s.amount;
    });
    const series = Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date));

    return { totalCars, revenue, subscribers, ticket, byService, series };
  }, [period, currentFranchise.id]);

  const colors = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">{currentFranchise.name}</p>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as keyof typeof PERIODS)}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(PERIODS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Car} label="Carros lavados" value={data.totalCars.toString()} accent="brand" />
        <KpiCard icon={DollarSign} label="Faturamento" value={formatBRL(data.revenue)} accent="primary" />
        <KpiCard icon={Users} label="Lavagens de assinantes" value={data.subscribers.toString()} accent="chart-3" />
        <KpiCard icon={TrendingUp} label="Ticket médio" value={formatBRL(data.ticket || 0)} accent="chart-4" />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Volume & faturamento por dia</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data.series}>
                <defs>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-brand)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-brand)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" fontSize={11} tickFormatter={(d) => d.slice(5)} />
                <YAxis fontSize={11} />
                <Tooltip formatter={(v: number, name) => name === "faturamento" ? formatBRL(v) : v} />
                <Area type="monotone" dataKey="faturamento" stroke="var(--color-brand)" fill="url(#gRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Distribuição por serviço</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={data.byService} dataKey="count" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {data.byService.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Faturamento por tipo de serviço</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.byService}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(v: number) => formatBRL(v)} />
              <Bar dataKey="revenue" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, accent }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; accent: string }) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div className="h-11 w-11 rounded-lg flex items-center justify-center" style={{ background: `var(--color-${accent})`, color: "var(--color-primary-foreground)" }}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
          <div className="text-2xl font-bold truncate">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
