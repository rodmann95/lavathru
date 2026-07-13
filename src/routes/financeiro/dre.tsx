import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, Fragment } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useApp } from "@/lib/app-context";
import { SALES, formatBRL } from "@/lib/mock-data";

export const Route = createFileRoute("/financeiro/dre")({
  head: () => ({ meta: [{ title: "DRE — Lava Thru" }] }),
  component: DrePage,
});

function DrePage() {
  const { profile, currentFranchise, franchises, financialEntries, costCenters, services } = useApp();
  const [period, setPeriod] = useState("30");
  const [selectedView, setSelectedView] = useState<string>("consolidado");

  // Calculate dates and cutoff
  const days = parseInt(period, 10);
  const cutoff = Date.now() - days * 86400000;

  // Derive which franchise we are looking at
  // If profile === "franqueado", they always see their own
  // If profile === "franquia", they can see "consolidado", "matriz" (their own), or a specific franchise
  const activeView = profile === "franqueado" ? currentFranchise.id : selectedView;

  // 1. Process all relevant entries
  const dreData = useMemo(() => {
    let totalReceitas = 0;
    let totalDespesas = 0;
    
    // Group totals by Cost Center Group
    const groups: Record<string, { total: number, items: Record<string, number>, type: "receita" | "despesa" }> = {};

    // Helper to add value to group
    const addValue = (ccId: string, amount: number, type: "receita" | "despesa") => {
      const cc = costCenters.find((c) => c.id === ccId);
      if (!cc) return;

      if (!groups[cc.group]) {
        groups[cc.group] = { total: 0, items: {}, type: cc.type === "ambos" ? type : cc.type };
      }
      
      groups[cc.group].total += amount;
      groups[cc.group].items[cc.name] = (groups[cc.group].items[cc.name] || 0) + amount;

      if (type === "receita") totalReceitas += amount;
      else totalDespesas += amount;
    };

    // Filter sales based on activeView
    SALES.forEach((s) => {
      const saleDate = new Date(s.date).getTime();
      if (saleDate < cutoff) return;

      const franchise = franchises.find((f) => f.id === s.franchiseId);
      const royaltyPercent = franchise?.royaltyFeePercent ?? 10;
      const svc = services.find(srv => srv.name === s.service);
      const svcCostCenter = svc?.costCenterId || "cc-001"; // "Receita de Lavagens"

      if (profile === "franqueado") {
        if (s.franchiseId !== currentFranchise.id) return;
        addValue(svcCostCenter, s.amount, "receita");
        addValue("cc-003", s.amount * (royaltyPercent / 100), "despesa"); // Franchise pays royalty (expense)
      } else {
        // Franqueadora (Matriz) view
        if (activeView === "consolidado") {
          addValue(svcCostCenter, s.amount, "receita");
        } else if (activeView === "matriz") {
          // Matriz only receives royalties from sales
          addValue("cc-003", s.amount * (royaltyPercent / 100), "receita");
        } else {
          // Specific franchise view
          if (s.franchiseId !== activeView) return;
          addValue(svcCostCenter, s.amount, "receita");
          addValue("cc-003", s.amount * (royaltyPercent / 100), "despesa"); // Expense from franchise POV
        }
      }
    });

    // Process manual financial entries
    financialEntries.forEach((e) => {
      if (e.status !== "paid") return; // Only count paid entries for DRE usually (cash basis here)
      const entryDate = new Date(e.dueDate).getTime();
      if (entryDate < cutoff) return;

      if (profile === "franqueado") {
        if (e.franchiseId !== currentFranchise.id) return;
        addValue(e.costCenterId, e.amount, e.type === "receber" ? "receita" : "despesa");
      } else {
        // Franqueadora (Matriz) view
        if (activeView === "consolidado") {
          addValue(e.costCenterId, e.amount, e.type === "receber" ? "receita" : "despesa");
        } else if (activeView === "matriz") {
          if (e.franchiseId === undefined) {
            addValue(e.costCenterId, e.amount, e.type === "receber" ? "receita" : "despesa");
          }
        } else {
          // Specific franchise view
          if (e.franchiseId !== activeView) return;
          addValue(e.costCenterId, e.amount, e.type === "receber" ? "receita" : "despesa");
        }
      }
    });

    return { totalReceitas, totalDespesas, groups };
  }, [SALES, financialEntries, costCenters, activeView, cutoff, profile, currentFranchise.id, franchises, services]);

  const lucroLiquido = dreData.totalReceitas - dreData.totalDespesas;
  const margem = dreData.totalReceitas > 0 ? (lucroLiquido / dreData.totalReceitas) * 100 : 0;

  // Separate groups for display
  const receitasGroups = Object.entries(dreData.groups).filter(([, g]) => g.type === "receita");
  const despesasGroups = Object.entries(dreData.groups).filter(([, g]) => g.type === "despesa");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Demonstrativo de Resultados (DRE)</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe o desempenho financeiro estruturado por centros de custo.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {profile === "franquia" && (
            <Select value={selectedView} onValueChange={setSelectedView}>
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="consolidado">Rede (Consolidado)</SelectItem>
                <SelectItem value="matriz">Matriz (Receitas/Despesas Próprias)</SelectItem>
                {franchises.map(f => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Últimos 12 meses</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>DRE Gerencial</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[70%]">Descrição</TableHead>
                <TableHead className="text-right">Valor Bruto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* RECEITAS */}
              <TableRow className="bg-emerald-500/5 hover:bg-emerald-500/10">
                <TableCell className="font-bold text-emerald-700 uppercase">(=) Receita Bruta Total</TableCell>
                <TableCell className="text-right font-bold text-emerald-700">{formatBRL(dreData.totalReceitas)}</TableCell>
              </TableRow>
              
              {receitasGroups.map(([groupName, group]) => (
                <Fragment key={`rec-group-${groupName}`}>
                  <TableRow className="bg-muted/20">
                    <TableCell className="font-semibold pl-6">{groupName}</TableCell>
                    <TableCell className="text-right font-semibold">{formatBRL(group.total)}</TableCell>
                  </TableRow>
                  {Object.entries(group.items).map(([itemName, amount]) => (
                    <TableRow key={`rec-item-${itemName}`}>
                      <TableCell className="pl-12 text-muted-foreground">{itemName}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatBRL(amount)}</TableCell>
                    </TableRow>
                  ))}
                </Fragment>
              ))}

              <TableRow>
                <TableCell colSpan={2} className="h-6 p-0"></TableCell>
              </TableRow>

              {/* DESPESAS */}
              <TableRow className="bg-rose-500/5 hover:bg-rose-500/10">
                <TableCell className="font-bold text-rose-700 uppercase">(-) Despesas Totais</TableCell>
                <TableCell className="text-right font-bold text-rose-700">{formatBRL(dreData.totalDespesas)}</TableCell>
              </TableRow>

              {despesasGroups.map(([groupName, group]) => (
                <Fragment key={`desp-group-${groupName}`}>
                  <TableRow className="bg-muted/20">
                    <TableCell className="font-semibold pl-6">{groupName}</TableCell>
                    <TableCell className="text-right font-semibold">{formatBRL(group.total)}</TableCell>
                  </TableRow>
                  {Object.entries(group.items).map(([itemName, amount]) => (
                    <TableRow key={`desp-item-${itemName}`}>
                      <TableCell className="pl-12 text-muted-foreground">{itemName}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatBRL(amount)}</TableCell>
                    </TableRow>
                  ))}
                </Fragment>
              ))}

              <TableRow>
                <TableCell colSpan={2} className="h-6 p-0 border-b-0"></TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {/* RESULTADO LIQUIDO */}
          <div className={`p-6 border-t ${lucroLiquido >= 0 ? "bg-emerald-600" : "bg-rose-600"} text-white rounded-b-xl flex justify-between items-center`}>
            <div>
              <div className="text-sm font-medium opacity-80 uppercase tracking-wider">(=) Resultado Líquido</div>
              <div className="text-3xl font-black mt-1">{formatBRL(lucroLiquido)}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium opacity-80 uppercase tracking-wider">Margem Líquida</div>
              <div className="text-xl font-bold mt-1">{margem.toFixed(1)}%</div>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
