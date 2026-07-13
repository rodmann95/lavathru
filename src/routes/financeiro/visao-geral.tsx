import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell,
} from "recharts";
import { SALES, formatBRL, type FinancialEntry } from "@/lib/mock-data";
import { useApp } from "@/lib/app-context";
import {
  DollarSign, TrendingUp, CreditCard, ArrowUpRight, ArrowDownRight, Plus, Trash2, Calendar,
  Building, Percent, FileText, CheckCircle
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/financeiro/visao-geral")({
  head: () => ({ meta: [{ title: "Financeiro (Visão Geral) — Lava Thru" }] }),
  component: FinanceiroPage,
});

function FinanceiroPage() {
  const { profile, currentFranchise, franchises, financialEntries, setFinancialEntries, costCenters, services } = useApp();
  const [period, setPeriod] = useState("30");
  const [activeTab, setActiveTab] = useState("overview");

  // New entry form states
  const [openNew, setOpenNew] = useState(false);
  const [formType, setFormType] = useState<"receber" | "pagar">("receber");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [costCenterId, setCostCenterId] = useState("");
  const [formFranchiseId, setFormFranchiseId] = useState("global");
  const [installments, setInstallments] = useState("1");
  const [plate, setPlate] = useState("");
  const [entityId, setEntityId] = useState(""); // Client or Supplier

  // Consolidation (Baixa) states
  const [consolidationTarget, setConsolidationTarget] = useState<string | null>(null);
  const [consolidationDate, setConsolidationDate] = useState(new Date().toISOString().split("T")[0]);

  // Advanced filters
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Calculate dates and cutoff
  const days = parseInt(period, 10);
  const cutoff = Date.now() - days * 86400000;

  // Filter Sales list based on profile
  const filteredSales = useMemo(() => {
    return SALES.filter((s) => {
      const inPeriod = new Date(s.date).getTime() >= cutoff;
      if (profile === "franqueado") {
        return s.franchiseId === currentFranchise.id && inPeriod;
      }
      return inPeriod; // Matriz views all sales
    });
  }, [profile, currentFranchise.id, cutoff]);

  // Combine Sales with manual Receivables and Payables
  const financialData = useMemo(() => {
    // 1. Convert relevant Sales to dynamic Accounts Receivable entries
    const salesReceivables = filteredSales.map((s) => {
      const franchise = franchises.find((f) => f.id === s.franchiseId);
      const royaltyPercent = franchise?.royaltyFeePercent ?? 10;
      
      let amount = s.amount;
      let description = `Venda - Lavagem ${s.service} (Placa ${s.plate})`;
      const svc = services.find(srv => srv.name === s.service);
      let linkedCc = svc?.costCenterId || "cc-001"; // Fallback para "Receita de Lavagens"
      
      if (profile === "franquia") {
        // Matriz receivable is just the royalty percentage of the sale
        amount = s.amount * (royaltyPercent / 100);
        description = `Royalties - Unidade ${franchise?.name.replace("Lava Thru ", "") || s.franchiseId} (Lavagem ${s.service})`;
        linkedCc = "cc-003"; // "Royalties Matriz"
      }

      return {
        id: `sale-receivable-${s.id}`,
        description,
        amount,
        dueDate: s.date.split("T")[0],
        status: "paid" as const, // Sales are paid instantly in our prototype
        type: "receber" as const,
        costCenterId: linkedCc,
        franchiseId: s.franchiseId,
        originalSaleAmount: s.amount,
        royaltyPercent,
      } as FinancialEntry;
    });

    // 2. Fetch manual financial entries from state
    const manualEntries = financialEntries.filter((e) => {
      const inPeriod = new Date(e.dueDate).getTime() >= cutoff;
      if (!inPeriod) return false;

      if (profile === "franqueado") {
        return e.franchiseId === currentFranchise.id;
      }
      // Matriz views all entries (global and franchise specific)
      return true;
    });

    const allEntries = [...salesReceivables, ...manualEntries];

    // Compute metrics
    const receivables = allEntries.filter((e) => e.type === "receber");
    const payables = allEntries.filter((e) => e.type === "pagar");

    const totalReceivablesPaid = receivables.filter((e) => e.status === "paid").reduce((sum, e) => sum + e.amount, 0);
    const totalReceivablesPending = receivables.filter((e) => e.status === "pending").reduce((sum, e) => sum + e.amount, 0);
    const totalPayablesPaid = payables.filter((e) => e.status === "paid").reduce((sum, e) => sum + e.amount, 0);
    const totalPayablesPending = payables.filter((e) => e.status === "pending").reduce((sum, e) => sum + e.amount, 0);

    const faturamentoTotal = profile === "franqueado"
      ? filteredSales.reduce((a, s) => a + s.amount, 0)
      : salesReceivables.reduce((a, r) => a + r.amount, 0) + manualEntries.filter(e => e.type === "receber").reduce((a, e) => a + e.amount, 0);

    // Chart Data: Group entries by cost center
    const categoryGrouping: Record<string, number> = {};
    receivables.forEach((e) => {
      const ccName = costCenters.find(c => c.id === e.costCenterId)?.name || e.costCenterId;
      categoryGrouping[ccName] = (categoryGrouping[ccName] || 0) + e.amount;
    });
    const receiptChart = Object.entries(categoryGrouping).map(([name, value]) => ({ name, value }));

    // Chart Data: Royalties per Franchise (only for Matriz)
    const royaltiesPerFranchise: Record<string, number> = {};
    if (profile === "franquia") {
      salesReceivables.forEach((r) => {
        const fName = franchises.find((f) => f.id === r.franchiseId)?.name.replace("Lava Thru ", "") || r.franchiseId || "Desconhecida";
        royaltiesPerFranchise[fName] = (royaltiesPerFranchise[fName] || 0) + r.amount;
      });
    }
    const franchiseRoyaltyChart = Object.entries(royaltiesPerFranchise).map(([name, value]) => ({ name, value }));

    const filteredReceivables = receivables.filter((e) => {
      if (startDate && e.dueDate < startDate) return false;
      if (endDate && e.dueDate > endDate) return false;
      if (!searchTerm) return true;
      const ccName = costCenters.find((c) => c.id === e.costCenterId)?.name || "";
      const searchStr = `${e.description} ${ccName} ${e.amount} ${e.plate || ""} ${e.clientId || ""} ${e.dueDate} ${e.paymentDate || ""}`.toLowerCase();
      return searchStr.includes(searchTerm.toLowerCase());
    });

    const filteredPayables = payables.filter((e) => {
      if (startDate && e.dueDate < startDate) return false;
      if (endDate && e.dueDate > endDate) return false;
      if (!searchTerm) return true;
      const ccName = costCenters.find((c) => c.id === e.costCenterId)?.name || "";
      const searchStr = `${e.description} ${ccName} ${e.amount} ${e.plate || ""} ${e.supplierId || ""} ${e.dueDate} ${e.paymentDate || ""}`.toLowerCase();
      return searchStr.includes(searchTerm.toLowerCase());
    });

    return {
      allEntries: allEntries.sort((a, b) => b.dueDate.localeCompare(a.dueDate)),
      receivables: filteredReceivables.sort((a, b) => b.dueDate.localeCompare(a.dueDate)),
      payables: filteredPayables.sort((a, b) => b.dueDate.localeCompare(a.dueDate)),
      faturamentoTotal,
      totalReceivablesPaid,
      totalReceivablesPending,
      totalPayablesPaid,
      totalPayablesPending,
      receiptChart,
      franchiseRoyaltyChart,
    };
  }, [filteredSales, financialEntries, profile, currentFranchise.id, franchises]);

  // Create new manual entries (handles installments)
  function handleCreateEntry() {
    if (!description || !amount || !dueDate) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    const totalAmount = parseFloat(amount);
    const count = parseInt(installments) || 1;
    const installmentAmount = totalAmount / count;

    const baseDate = new Date(dueDate);
    const newEntries: FinancialEntry[] = [];

    for (let i = 0; i < count; i++) {
      const iterDate = new Date(baseDate);
      iterDate.setDate(iterDate.getDate() + (i * 30));

      newEntries.push({
        id: `fe-${Math.floor(1000 + Math.random() * 9000)}-${i}`,
        description,
        amount: count > 1 ? installmentAmount : totalAmount,
        dueDate: iterDate.toISOString().split("T")[0],
        status: "pending" as const,
        type: formType,
        costCenterId,
        franchiseId: profile === "franqueado" ? currentFranchise.id : (formFranchiseId === "global" ? undefined : formFranchiseId),
        installment: count > 1 ? `${i + 1}/${count}` : undefined,
        plate: plate || undefined,
        clientId: formType === "receber" && entityId ? entityId : undefined,
        supplierId: formType === "pagar" && entityId ? entityId : undefined,
      });
    }

    setFinancialEntries((prev) => [...prev, ...newEntries]);
    toast.success(`${count > 1 ? count + " Parcelas geradas" : "Lançamento criado"} com sucesso!`);
    setOpenNew(false);
    setDescription("");
    setAmount("");
    setCostCenterId("");
    setFormFranchiseId("global");
    setInstallments("1");
    setPlate("");
    setEntityId("");
  }

  // Handle pay/receive toggles
  function handleToggleStatus(id: string) {
    if (id.startsWith("sale-receivable-")) return; // Sales are automatically paid/completed
    
    const entry = financialEntries.find(e => e.id === id);
    if (!entry) return;

    if (entry.status === "paid") {
      // Revert to pending
      setFinancialEntries((prev) => prev.map((e) => (e.id === id ? { ...e, status: "pending", paymentDate: undefined } : e)));
      toast.success("Lançamento revertido para pendente");
    } else {
      // Open consolidation modal
      setConsolidationTarget(id);
      setConsolidationDate(new Date().toISOString().split("T")[0]);
    }
  }

  function handleConsolidate() {
    if (!consolidationTarget || !consolidationDate) {
      toast.error("Informe a data de pagamento/recebimento");
      return;
    }

    setFinancialEntries((prev) =>
      prev.map((e) => (e.id === consolidationTarget ? { ...e, status: "paid", paymentDate: consolidationDate } : e))
    );
    toast.success("Baixa realizada com sucesso!");
    setConsolidationTarget(null);
  }

  // Handle deleting manual entries
  function handleDeleteEntry(id: string) {
    if (id.startsWith("sale-receivable-")) {
      toast.error("Vendas reais da operação não podem ser deletadas do financeiro");
      return;
    }
    if (confirm("Deseja realmente remover este lançamento financeiro?")) {
      setFinancialEntries((prev) => prev.filter((e) => e.id !== id));
      toast.success("Lançamento financeiro removido");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-sm text-muted-foreground">
            {profile === "franquia"
              ? "Relatórios de royalties, contas a pagar e contas a receber da rede"
              : `Controle financeiro da unidade ${currentFranchise.name}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={() => { setFormType("receber"); setOpenNew(true); }} className="bg-brand text-brand-foreground hover:opacity-90">
            <Plus className="h-4 w-4 mr-1" /> Novo Lançamento
          </Button>
        </div>
      </div>

      {profile === "franqueado" && (
        <div className="bg-muted/50 p-4 rounded-xl border flex items-center justify-between flex-wrap gap-2 text-sm">
          <div className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-brand" />
            <span>Sua unidade possui uma **Taxa de Franquia (Royalties) contratual de {currentFranchise.royaltyFeePercent}%** sobre todo o faturamento de vendas de pátio e planos.</span>
          </div>
          <Badge variant="secondary" className="font-mono">Faturamento Vila Olímpia</Badge>
        </div>
      )}

      {/* Financial KPIs */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
        <Kpi
          icon={DollarSign}
          label={profile === "franquia" ? "Ganho Royalties + Receitas" : "Faturamento Bruto"}
          value={formatBRL(financialData.faturamentoTotal)}
          color="bg-brand-gradient"
        />
        <Kpi
          icon={ArrowUpRight}
          label="Contas a Receber (Aberto)"
          value={formatBRL(financialData.totalReceivablesPending)}
          color="bg-emerald-500"
        />
        <Kpi
          icon={ArrowDownRight}
          label="Contas a Pagar (Aberto)"
          value={formatBRL(financialData.totalPayablesPending)}
          color="bg-red-500"
        />
        <Kpi
          icon={TrendingUp}
          label="Saldo Previsto"
          value={formatBRL(
            financialData.totalReceivablesPaid +
            financialData.totalReceivablesPending -
            (financialData.totalPayablesPaid + financialData.totalPayablesPending)
          )}
          color="bg-blue-600"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 max-w-md">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="receber">Contas a Receber</TabsTrigger>
          <TabsTrigger value="pagar">Contas a Pagar</TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview Chart */}
        <TabsContent value="overview" className="space-y-6 pt-3">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>
                  {profile === "franquia" ? "Distribuição de Ganhos de Royalties por Franquia" : "Faturamento por Tipo de Lançamento"}
                </CardTitle>
                <CardDescription>
                  {profile === "franquia" ? "Volume de royalties gerado por cada unidade da rede" : "Entradas financeiras categorizadas no período"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  {profile === "franquia" ? (
                    <BarChart data={financialData.franchiseRoyaltyChart}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={11} />
                      <YAxis fontSize={11} />
                      <Tooltip formatter={(v: any) => formatBRL(v)} />
                      <Bar dataKey="value" fill="#E11D48" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  ) : (
                    <BarChart data={financialData.receiptChart}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={11} />
                      <YAxis fontSize={11} />
                      <Tooltip formatter={(v: any) => formatBRL(v)} />
                      <Bar dataKey="value" fill="#E11D48" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Franchise fees information cards */}
            <Card>
              <CardHeader>
                <CardTitle>{profile === "franquia" ? "Performance e Regras das Franquias" : "Resumo da Operação Local"}</CardTitle>
                <CardDescription>Resumo comercial de taxas e volume</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile === "franquia" ? (
                  <div className="space-y-3">
                    {franchises.map((f) => {
                      const totalSalesForFranchise = SALES.filter((s) => s.franchiseId === f.id && new Date(s.date).getTime() >= cutoff).reduce((a, s) => a + s.amount, 0);
                      const royaltiesEarned = totalSalesForFranchise * (f.royaltyFeePercent / 100);
                      return (
                        <div key={f.id} className="flex justify-between items-center p-3 border rounded-lg text-sm bg-card hover:bg-muted/10 transition-colors">
                          <div>
                            <span className="font-semibold block">{f.name.replace("Lava Thru ", "")}</span>
                            <span className="text-xs text-muted-foreground">Regra: **{f.royaltyFeePercent}% royalties**</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-emerald-600 font-mono block">{formatBRL(royaltiesEarned)}</span>
                            <span className="text-xs text-muted-foreground">Faturamento: {formatBRL(totalSalesForFranchise)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-3 border rounded-lg bg-card text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Faturado no Pátio:</span>
                        <span className="font-bold font-mono">{formatBRL(financialData.faturamentoTotal)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2 text-orange-700">
                        <span>Royalty Devido à Matriz ({currentFranchise.royaltyFeePercent}%):</span>
                        <span className="font-bold font-mono">-{formatBRL(financialData.faturamentoTotal * (currentFranchise.royaltyFeePercent / 100))}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2 font-bold text-emerald-700">
                        <span>Seu Retorno Líquido ({100 - currentFranchise.royaltyFeePercent}%):</span>
                        <span className="font-bold font-mono">{formatBRL(financialData.faturamentoTotal * (1 - currentFranchise.royaltyFeePercent / 100))}</span>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-3 text-xs space-y-1">
                      <div className="font-bold flex items-center gap-1"><Building className="h-3.5 w-3.5" /> Atenção Financeira:</div>
                      <p>Os recebimentos das vendas operacionais caem automaticamente no Contas a Receber como líquido operacional após descontar os royalties devidos à Matriz.</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Filter Bar for Tables */}
        {(activeTab === "receber" || activeTab === "pagar") && (
          <Card className="mb-4">
            <CardContent className="p-3 flex flex-wrap gap-3 items-center bg-muted/20">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Buscar por descrição, centro de custo, valor, placa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-auto bg-background"
                />
                <span className="text-muted-foreground">até</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-auto bg-background"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab 2: Receivables */}
        <TabsContent value="receber" className="space-y-4 pt-1 animate-fadeIn">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Contas a Receber (Entradas)</CardTitle>
                <CardDescription>Controle de recebimentos de vendas, royalties e outras receitas</CardDescription>
              </div>
              <Button size="sm" onClick={() => { setFormType("receber"); setOpenNew(true); }} className="h-8 bg-brand">
                <Plus className="h-3.5 w-3.5 mr-1" /> Nova Receita
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Centro de Custo</TableHead>
                    {profile === "franquia" ? (
                      <>
                        <TableHead>Valor Total Venda</TableHead>
                        <TableHead className="text-right">Seu Ganho (Royalties %)</TableHead>
                      </>
                    ) : (
                      <>
                        <TableHead>Valor Total</TableHead>
                        <TableHead>Sua Parte ({100 - currentFranchise.royaltyFeePercent}%)</TableHead>
                        <TableHead className="text-right">Matriz (Royalties %)</TableHead>
                      </>
                    )}
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {financialData.receivables.map((r) => {
                    const isSale = r.id.startsWith("sale-receivable-");
                    
                    return (
                      <TableRow key={r.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="text-sm font-mono">
                          <div>{new Date(r.dueDate).toLocaleDateString("pt-BR")}</div>
                          {r.paymentDate && <div className="text-[10px] text-muted-foreground">Pago: {new Date(r.paymentDate).toLocaleDateString("pt-BR")}</div>}
                        </TableCell>
                        <TableCell className="font-medium text-sm flex flex-col gap-1 pt-4">
                          <div className="flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                            {r.description}
                          </div>
                          {(r.plate || r.installment || r.clientId) && (
                            <div className="text-[10px] text-muted-foreground flex gap-2">
                              {r.plate && <span>Placa: {r.plate}</span>}
                              {r.installment && <span>Parc: {r.installment}</span>}
                              {r.clientId && <span>Cli: {r.clientId}</span>}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
                            {costCenters.find(c => c.id === r.costCenterId)?.name || r.costCenterId}
                          </Badge>
                        </TableCell>
                        
                        {profile === "franquia" ? (
                          <>
                            <TableCell className="text-muted-foreground text-sm font-mono">
                              {r.originalSaleAmount !== undefined ? formatBRL(r.originalSaleAmount) : "—"}
                            </TableCell>
                            <TableCell className="font-bold text-emerald-600 font-mono text-right">
                              {formatBRL(r.amount)}
                              {isSale && <span className="text-[10px] text-muted-foreground font-normal ml-1">({r.royaltyPercent}%)</span>}
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className="text-muted-foreground text-sm font-mono">
                              {formatBRL(isSale ? (r.originalSaleAmount || r.amount) : r.amount)}
                            </TableCell>
                            <TableCell className="font-bold text-emerald-600 font-mono">
                              {formatBRL(isSale ? (r.originalSaleAmount ? r.originalSaleAmount * (1 - r.royaltyPercent! / 100) : r.amount) : r.amount)}
                            </TableCell>
                            <TableCell className="text-orange-600 font-mono text-right">
                              {isSale ? formatBRL(r.originalSaleAmount! * (r.royaltyPercent! / 100)) : "—"}
                              {isSale && <span className="text-[10px] text-muted-foreground font-normal ml-1">({r.royaltyPercent}%)</span>}
                            </TableCell>
                          </>
                        )}
                        
                        <TableCell>
                          {r.status === "paid" ? (
                            <Badge className="bg-success text-success-foreground hover:opacity-90 cursor-pointer" onClick={() => handleToggleStatus(r.id)}>
                              Recebido
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100 cursor-pointer" onClick={() => handleToggleStatus(r.id)}>
                              Pendente
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive h-8 w-8"
                            disabled={isSale}
                            onClick={() => handleDeleteEntry(r.id)}
                            title={isSale ? "Lançamentos de vendas não podem ser excluídos diretamente" : "Excluir receita"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {financialData.receivables.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        Nenhum contas a receber encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Payables */}
        <TabsContent value="pagar" className="space-y-4 pt-1 animate-fadeIn">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Contas a Pagar (Saídas)</CardTitle>
                <CardDescription>Gerencie as despesas corporativas e operacionais</CardDescription>
              </div>
              <Button size="sm" onClick={() => { setFormType("pagar"); setOpenNew(true); }} className="h-8 bg-brand">
                <Plus className="h-3.5 w-3.5 mr-1" /> Nova Despesa
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Centro de Custo</TableHead>
                    <TableHead>Franquia</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {financialData.payables.map((p) => {
                    const franchise = franchises.find((f) => f.id === p.franchiseId);
                    return (
                      <TableRow key={p.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="text-sm font-mono">
                          <div>{new Date(p.dueDate).toLocaleDateString("pt-BR")}</div>
                          {p.paymentDate && <div className="text-[10px] text-muted-foreground">Pago: {new Date(p.paymentDate).toLocaleDateString("pt-BR")}</div>}
                        </TableCell>
                        <TableCell className="font-medium text-sm flex flex-col gap-1 pt-4">
                          <div className="flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                            {p.description}
                          </div>
                          {(p.plate || p.installment || p.supplierId) && (
                            <div className="text-[10px] text-muted-foreground flex gap-2">
                              {p.plate && <span>Placa: {p.plate}</span>}
                              {p.installment && <span>Parc: {p.installment}</span>}
                              {p.supplierId && <span>Forn: {p.supplierId}</span>}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
                            {costCenters.find(c => c.id === p.costCenterId)?.name || p.costCenterId}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {p.franchiseId ? (
                            franchise?.name.replace("Lava Thru ", "")
                          ) : (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 font-normal">Matriz Geral</Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-bold text-red-600 font-mono text-right">
                          -{formatBRL(p.amount)}
                        </TableCell>
                        <TableCell>
                          {p.status === "paid" ? (
                            <Badge className="bg-success text-success-foreground cursor-pointer" onClick={() => handleToggleStatus(p.id)}>
                              Pago
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50 hover:bg-red-100 cursor-pointer" onClick={() => handleToggleStatus(p.id)}>
                              Pendente
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleDeleteEntry(p.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {financialData.payables.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        Nenhum contas a pagar encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog for adding new financial entries */}
      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Lançamento Financeiro</DialogTitle>
            <DialogDescription>Cadastre uma movimentação manual de caixa.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Tipo de Transação</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={formType === "receber" ? "default" : "outline"}
                  className={`flex-1 ${formType === "receber" ? "bg-emerald-600 text-white" : ""}`}
                  onClick={() => setFormType("receber")}
                >
                  Receita (A Receber)
                </Button>
                <Button
                  type="button"
                  variant={formType === "pagar" ? "default" : "outline"}
                  className={`flex-1 ${formType === "pagar" ? "bg-red-600 text-white" : ""}`}
                  onClick={() => setFormType("pagar")}
                >
                  Despesa (A Pagar)
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="desc">Descrição / Nome do Lançamento</Label>
              <Input
                id="desc"
                placeholder="Ex: Conta de Água, Consultoria local, Cafezinho"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="val">Valor R$</Label>
                <Input
                  id="val"
                  type="number"
                  placeholder="Ex: 150.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date">Vencimento</Label>
                <Input
                  id="date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cat">Centro de Custo</Label>
                <Select value={costCenterId} onValueChange={setCostCenterId}>
                  <SelectTrigger id="cat"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                  {costCenters
                    .filter(c => c.type === (formType === "receber" ? "receita" : "despesa") || c.type === "ambos")
                    .filter(c => profile === "franquia" || !c.franchiseIds || c.franchiseIds.length === 0 || c.franchiseIds.includes(currentFranchise.id))
                    .map(cc => (
                      <SelectItem key={cc.id} value={cc.id}>{cc.name}</SelectItem>
                  ))}
                </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="installments">Qtd. Parcelas</Label>
                <Input
                  id="installments"
                  type="number"
                  min="1"
                  max="48"
                  value={installments}
                  onChange={(e) => setInstallments(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="entity">Vinculação (Opcional)</Label>
                <Input
                  id="entity"
                  placeholder={formType === "receber" ? "Nome do Cliente" : "Nome do Fornecedor"}
                  value={entityId}
                  onChange={(e) => setEntityId(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="plate">Placa (Opcional)</Label>
                <Input
                  id="plate"
                  placeholder="ABC1234"
                  className="uppercase font-mono"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.toUpperCase())}
                />
              </div>
            </div>

            {profile === "franquia" && (
              <div className="space-y-1.5">
                <Label htmlFor="f-link">Vincular à Franquia</Label>
                <Select value={formFranchiseId} onValueChange={setFormFranchiseId}>
                  <SelectTrigger id="f-link"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Matriz (Global)</SelectItem>
                    {franchises.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNew(false)}>Cancelar</Button>
            <Button onClick={handleCreateEntry} className="bg-brand text-brand-foreground hover:opacity-90">
              Salvar Lançamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for Consolidation (Baixa) */}
      <Dialog open={!!consolidationTarget} onOpenChange={(v) => !v && setConsolidationTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar Baixa</DialogTitle>
            <DialogDescription>Informe a data de liquidação (recebimento ou pagamento).</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="payDate">Data Efetiva</Label>
              <Input
                id="payDate"
                type="date"
                value={consolidationDate}
                onChange={(e) => setConsolidationDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConsolidationTarget(null)}>Cancelar</Button>
            <Button onClick={handleConsolidate} className="bg-success text-success-foreground hover:opacity-90">
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface KpiProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: string;
}

function Kpi({ icon: Icon, label, value, color }: KpiProps) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`h-11 w-11 rounded-lg flex items-center justify-center text-white ${color}`}>
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
