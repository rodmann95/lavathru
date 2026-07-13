import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";
import { Car, DollarSign, Users, TrendingUp, Trophy, Crown, Medal } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { SALES, SERVICES, FRANCHISES, formatBRL } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "Dashboard — Lava Thru" }],
  }),
  component: Dashboard,
});

const PERIODS = { "7": "Últimos 7 dias", "30": "Últimos 30 dias", "90": "Últimos 90 dias" };

function Dashboard() {
  const { currentFranchise, profile, franchises } = useApp();
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

  // ── Franchise ranking (only for Matriz/Franqueadora profile) ──────────────
  const franchiseRanking = useMemo(() => {
    if (profile !== "franquia") return [];
    const days = parseInt(period);
    const cutoff = Date.now() - days * 86400000;
    const filtered = SALES.filter((s) => new Date(s.date).getTime() >= cutoff);

    return franchises
      .map((f) => {
        const sales = filtered.filter((s) => s.franchiseId === f.id);
        const totalRevenue = sales.reduce((a, s) => a + s.amount, 0);
        const royaltyPct = f.royaltyFeePercent ?? 10;
        const royaltyValue = totalRevenue * (royaltyPct / 100);
        const franchiseeValue = totalRevenue - royaltyValue;
        const totalCars = sales.length;
        return {
          id: f.id,
          name: f.name.replace("Lava Thru ", ""),
          fullName: f.name,
          city: f.city,
          totalRevenue,
          royaltyValue,
          franchiseeValue,
          royaltyPct,
          totalCars,
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [period, profile, franchises]);

  const totalNetworkRevenue = franchiseRanking.reduce((a, f) => a + f.totalRevenue, 0);
  const totalRoyalties = franchiseRanking.reduce((a, f) => a + f.royaltyValue, 0);

  const colors = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)"];

  const rankIcons = [
    <Crown className="h-4 w-4 text-yellow-500" />,
    <Trophy className="h-4 w-4 text-slate-400" />,
    <Medal className="h-4 w-4 text-amber-600" />,
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {profile === "franquia" ? "Visão geral da rede" : currentFranchise.name}
          </p>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as keyof typeof PERIODS)}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(PERIODS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Car} label="Carros lavados" value={data.totalCars.toString()} accent="brand" />
        <KpiCard icon={DollarSign} label="Faturamento" value={formatBRL(data.revenue)} accent="primary" />
        <KpiCard icon={Users} label="Lavagens de assinantes" value={data.subscribers.toString()} accent="chart-3" />
        <KpiCard icon={TrendingUp} label="Ticket médio" value={formatBRL(data.ticket || 0)} accent="chart-4" />
      </div>

      {/* Franchise Ranking — only for Matriz */}
      {profile === "franquia" && franchiseRanking.length > 0 && (
        <div className="space-y-4">
          {/* Network summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="sm:col-span-1 bg-gradient-to-br from-brand/10 to-brand/5 border-brand/20">
              <CardContent className="pt-4 pb-3">
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Faturamento Total da Rede</div>
                <div className="text-2xl font-black font-mono text-brand">{formatBRL(totalNetworkRevenue)}</div>
              </CardContent>
            </Card>
            <Card className="sm:col-span-1 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-300/30">
              <CardContent className="pt-4 pb-3">
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Royalties para Matriz</div>
                <div className="text-2xl font-black font-mono text-emerald-600">{formatBRL(totalRoyalties)}</div>
              </CardContent>
            </Card>
            <Card className="sm:col-span-1 bg-gradient-to-br from-slate-500/10 to-slate-500/5 border-slate-300/30">
              <CardContent className="pt-4 pb-3">
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Franquias Ativas</div>
                <div className="text-2xl font-black">{franchiseRanking.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Ranking card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-brand" />
                Ranking de Faturamento por Franquia
                <Badge variant="outline" className="ml-auto text-xs font-normal">
                  {PERIODS[period]}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {franchiseRanking.map((f, idx) => {
                const share = totalNetworkRevenue > 0 ? (f.totalRevenue / totalNetworkRevenue) * 100 : 0;
                return (
                  <div key={f.id} className="space-y-1.5">
                    {/* Row header */}
                    <div className="flex items-center gap-3">
                      <div className="w-6 flex items-center justify-center shrink-0">
                        {idx < 3 ? rankIcons[idx] : (
                          <span className="text-sm font-bold text-muted-foreground">{idx + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div>
                            <span className="font-semibold text-sm">{f.name}</span>
                            <span className="text-xs text-muted-foreground ml-1.5">{f.city}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-bold font-mono text-sm">{formatBRL(f.totalRevenue)}</div>
                            <div className="text-xs text-muted-foreground">{f.totalCars} lavagens</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="ml-9">
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand to-brand/70 transition-all"
                          style={{ width: `${share}%` }}
                        />
                      </div>
                    </div>

                    {/* Breakdown pills */}
                    <div className="ml-9 flex items-center gap-2 flex-wrap text-xs">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 font-medium border border-emerald-200/60">
                        Royalties ({f.royaltyPct}%): {formatBRL(f.royaltyValue)}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-600 font-medium border border-slate-200/60">
                        Franqueado: {formatBRL(f.franchiseeValue)}
                      </span>
                      <span className="ml-auto text-muted-foreground">{share.toFixed(1)}% da rede</span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Ranking bar chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Faturamento vs. Royalties por Franquia</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={franchiseRanking.map((f) => ({
                    name: f.name,
                    franqueado: parseFloat(f.franchiseeValue.toFixed(2)),
                    royalties: parseFloat(f.royaltyValue.toFixed(2)),
                  }))}
                  margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis fontSize={11} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatBRL(v)} />
                  <Bar dataKey="franqueado" name="Franqueado" stackId="a" fill="var(--color-chart-1)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="royalties" name="Royalties (Matriz)" stackId="a" fill="var(--color-brand)" radius={[6, 6, 0, 0]} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Per-franchise charts */}
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
                <Tooltip formatter={(v: number, name) => (name === "faturamento" ? formatBRL(v) : v)} />
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

function KpiCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div
          className="h-11 w-11 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `var(--color-${accent})`, color: "var(--color-primary-foreground)" }}
        >
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
