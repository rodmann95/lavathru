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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Search, CheckCircle2, XCircle, QrCode, CreditCard, Banknote, Sparkles, Tag, X } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/lib/app-context";
import { formatBRL, type Coupon } from "@/lib/mock-data";

export const Route = createFileRoute("/vendas/operacao")({
  head: () => ({ meta: [{ title: "Operação — Lava Thru" }] }),
  component: OperacaoPage,
});

type LookupState =
  | { status: "idle" }
  | { status: "subscriber"; subscriber: any }
  | { status: "not-subscriber"; plate: string };

function OperacaoPage() {
  const { currentFranchise, isSubscribed } = useApp();
  const [plateInput, setPlateInput] = useState("");
  const [lookup, setLookup] = useState<LookupState>({ status: "idle" });
  const [saleOpen, setSaleOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);

  function handleLookup() {
    const plate = plateInput.trim().toUpperCase();
    if (!plate) return;
    const sub = isSubscribed(plate);
    if (sub) setLookup({ status: "subscriber", subscriber: sub });
    else setLookup({ status: "not-subscriber", plate });
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Operação</h1>
        <p className="text-sm text-muted-foreground">Consulta de placa e lançamento de vendas — {currentFranchise.name}</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Consultar placa</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Ex: ABC1D23"
              value={plateInput}
              onChange={(e) => setPlateInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleLookup()}
              className="text-lg font-mono tracking-widest uppercase max-w-xs"
            />
            <Button onClick={handleLookup} className="bg-brand text-brand-foreground hover:opacity-90">
              <Search className="h-4 w-4 mr-2" /> Consultar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Placas cadastradas de teste: ABC1D23, XYZ9K88, MER0T55 · Qualquer outra placa retorna como não-associada.</p>

          {lookup.status === "subscriber" && (
            <div className="rounded-xl border-2 border-success bg-success/10 p-6 flex items-center justify-between flex-wrap gap-4 animate-fadeIn">
              <div className="flex items-center gap-4">
                <CheckCircle2 className="h-10 w-10 text-success" />
                <div>
                  <div className="font-mono text-3xl font-bold text-success">{lookup.subscriber.plate}</div>
                  <div className="text-sm mt-1"><strong>{lookup.subscriber.name}</strong> — Assinante ativo</div>
                  <div className="text-xs text-muted-foreground">
                    {lookup.subscriber.planUsed} / {lookup.subscriber.planIncluded} lavagens usadas
                  </div>
                </div>
              </div>
              <Button variant="outline" onClick={() => { toast.success("Lavagem registrada como assinatura"); setLookup({ status: "idle" }); setPlateInput(""); }}>
                Registrar lavagem
              </Button>
            </div>
          )}

          {lookup.status === "not-subscriber" && (
            <div className="rounded-xl border-2 border-destructive bg-destructive/10 p-6 flex items-center justify-between flex-wrap gap-4 animate-fadeIn">
              <div className="flex items-center gap-4">
                <XCircle className="h-10 w-10 text-destructive" />
                <div>
                  <div className="font-mono text-3xl font-bold text-destructive">{lookup.plate}</div>
                  <div className="text-sm mt-1">Não é assinante</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setSaleOpen(true)} className="bg-brand text-brand-foreground hover:opacity-90">
                  Lançar venda
                </Button>
                <Button variant="outline" onClick={() => setPlanOpen(true)}>
                  <Sparkles className="h-4 w-4 mr-2" /> Venda rápida de assinatura
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <SaleDialog open={saleOpen} onOpenChange={setSaleOpen} plate={lookup.status === "not-subscriber" ? lookup.plate : ""} />
      <QuickPlanDialog open={planOpen} onOpenChange={setPlanOpen} plate={lookup.status === "not-subscriber" ? lookup.plate : ""} />
    </div>
  );
}

// Helper: validates a coupon code against the current franchise
function validateCoupon(
  code: string,
  coupons: Coupon[],
  franchiseId: string
): { valid: true; coupon: Coupon } | { valid: false; reason: string } {
  const found = coupons.find((c) => c.code.toUpperCase() === code.toUpperCase().trim());
  if (!found) return { valid: false, reason: "Cupom não encontrado." };
  if (found.status === "inactive") return { valid: false, reason: "Cupom inativo." };
  if (new Date(found.validity) < new Date()) return { valid: false, reason: "Cupom expirado." };
  if (found.scope === "restricted") {
    if (!found.franchiseIds?.includes(franchiseId)) {
      return { valid: false, reason: "Cupom não válido para esta franquia." };
    }
  }
  return { valid: true, coupon: found };
}

function computeDiscount(coupon: Coupon | null, price: number): number {
  if (!coupon) return 0;
  if (coupon.discountType === "percentage") return Math.min(price, price * (coupon.discountValue / 100));
  return Math.min(price, coupon.discountValue);
}

function CouponInput({
  franchiseId,
  coupons,
  onApply,
  appliedCoupon,
  onClear,
}: {
  franchiseId: string;
  coupons: Coupon[];
  onApply: (coupon: Coupon) => void;
  appliedCoupon: Coupon | null;
  onClear: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  function handleApply() {
    const result = validateCoupon(code, coupons, franchiseId);
    if (result.valid) {
      setError("");
      setCode("");
      onApply(result.coupon);
      toast.success(`Cupom ${result.coupon.code} aplicado!`);
    } else {
      setError(result.reason);
    }
  }

  if (appliedCoupon) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-success bg-success/10 px-3 py-2">
        <Tag className="h-4 w-4 text-success shrink-0" />
        <div className="flex-1">
          <span className="font-mono font-bold text-success text-sm">{appliedCoupon.code}</span>
          <span className="text-xs text-muted-foreground ml-2">
            {appliedCoupon.discountType === "percentage"
              ? `${appliedCoupon.discountValue}% de desconto`
              : `${formatBRL(appliedCoupon.discountValue)} de desconto`}
          </span>
        </div>
        <button
          onClick={onClear}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Remover cupom"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8 font-mono uppercase tracking-wider text-sm"
            placeholder="Código do cupom (opcional)"
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleApply()}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={handleApply}
          disabled={!code.trim()}
        >
          Aplicar
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function SaleDialog({ open, onOpenChange, plate }: { open: boolean; onOpenChange: (v: boolean) => void; plate: string }) {
  const { services, currentFranchise, profile, coupons } = useApp();
  const [selectedServiceName, setSelectedServiceName] = useState(services[0]?.name || "Essencial");
  const [payment, setPayment] = useState<"PIX" | "Cartão" | "Dinheiro">("PIX");
  const [step, setStep] = useState<"form" | "pix" | "card" | "done">("form");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  const svc = services.find((s) => s.name === selectedServiceName) || services[0] || { price: 35, duration: "15 min" };
  const resolvedPrice = svc.priceOverrides?.[currentFranchise.id] !== undefined
    ? svc.priceOverrides[currentFranchise.id]
    : svc.price;

  const discount = computeDiscount(appliedCoupon, resolvedPrice);
  const finalPrice = Math.max(0, resolvedPrice - discount);

  function confirm() {
    if (payment === "PIX") setStep("pix");
    else if (payment === "Cartão") setStep("card");
    else { toast.success("Venda registrada"); reset(); }
  }
  function reset() {
    setStep("form");
    setAppliedCoupon(null);
    onOpenChange(false);
    setTimeout(() => { setSelectedServiceName(services[0]?.name || "Essencial"); setPayment("PIX"); }, 200);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); else onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        {step === "form" && (
          <>
            <DialogHeader>
              <DialogTitle>Lançar venda</DialogTitle>
              <DialogDescription>Placa: <span className="font-mono font-bold">{plate}</span></DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Serviço</Label>
                <Select value={selectedServiceName} onValueChange={(v) => { setSelectedServiceName(v as any); setAppliedCoupon(null); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {services.map((s) => {
                      const priceForCurrentFranchise = s.priceOverrides?.[currentFranchise.id] ?? s.price;
                      return (
                        <SelectItem key={s.name} value={s.name}>
                          Lavagem {s.name} — {formatBRL(priceForCurrentFranchise)} · {s.duration}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Pagamento</Label>
                <RadioGroup value={payment} onValueChange={(v) => setPayment(v as typeof payment)} className="grid grid-cols-3 gap-2 mt-1.5">
                  {[
                    { v: "PIX", icon: QrCode },
                    { v: "Cartão", icon: CreditCard },
                    { v: "Dinheiro", icon: Banknote },
                  ].map(({ v, icon: I }) => (
                    <label key={v} className={`flex flex-col items-center gap-1 rounded-lg border-2 p-3 cursor-pointer ${payment === v ? "border-brand bg-brand/5" : "border-border"}`}>
                      <RadioGroupItem value={v} className="sr-only" />
                      <I className="h-5 w-5" />
                      <span className="text-xs font-medium">{v}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              {/* Coupon field */}
              <div>
                <Label className="mb-1.5 block">Cupom de desconto</Label>
                <CouponInput
                  franchiseId={currentFranchise.id}
                  coupons={coupons}
                  appliedCoupon={appliedCoupon}
                  onApply={setAppliedCoupon}
                  onClear={() => setAppliedCoupon(null)}
                />
              </div>

              {/* Price breakdown */}
              <div className="space-y-1">
                {appliedCoupon && (
                  <div className="flex items-center justify-between px-3 text-sm text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatBRL(resolvedPrice)}</span>
                  </div>
                )}
                {appliedCoupon && (
                  <div className="flex items-center justify-between px-3 text-sm text-success font-medium">
                    <span>Desconto ({appliedCoupon.code})</span>
                    <span>− {formatBRL(discount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                  <span className="text-sm">Total</span>
                  <span className="text-xl font-bold">{formatBRL(finalPrice)}</span>
                </div>
                {profile === "franqueado" && (
                  <div className="flex justify-between items-center px-3 text-[11px] text-muted-foreground">
                    <span>Taxa de Franquia (Royalties {currentFranchise.royaltyFeePercent}%)</span>
                    <span className="font-semibold">{formatBRL(finalPrice * (currentFranchise.royaltyFeePercent / 100))}</span>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={reset}>Cancelar</Button>
              <Button onClick={confirm} className="bg-brand text-brand-foreground hover:opacity-90">Confirmar</Button>
            </DialogFooter>
          </>
        )}
        {step === "pix" && (
          <>
            <DialogHeader><DialogTitle>Pague com PIX</DialogTitle></DialogHeader>
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="p-4 bg-white rounded-lg border">
                <QrCodeSvg />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{formatBRL(finalPrice)}</div>
                <div className="text-xs text-muted-foreground">Aguardando confirmação…</div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={reset}>Cancelar</Button>
              <Button onClick={() => { toast.success("Pagamento PIX confirmado"); reset(); }} className="bg-success text-success-foreground hover:opacity-90">
                Simular pagamento
              </Button>
            </DialogFooter>
          </>
        )}
        {step === "card" && (
          <>
            <DialogHeader><DialogTitle>Cartão — Maquininha</DialogTitle></DialogHeader>
            <div className="flex flex-col items-center gap-3 py-8">
              <CreditCard className="h-16 w-16 text-brand animate-pulse" />
              <div className="text-lg font-semibold">Enviando {formatBRL(finalPrice)} para a maquininha…</div>
              <div className="text-sm text-muted-foreground">Aproxime, insira ou passe o cartão.</div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={reset}>Cancelar</Button>
              <Button onClick={() => { toast.success("Pagamento no cartão aprovado"); reset(); }} className="bg-success text-success-foreground hover:opacity-90">
                Simular aprovação
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function QuickPlanDialog({ open, onOpenChange, plate }: { open: boolean; onOpenChange: (v: boolean) => void; plate: string }) {
  const { setSubscribers, setClients, clients, currentFranchise, plans, profile, coupons } = useApp();
  const [docType, setDocType] = useState<"cpf" | "cnpj">("cpf");
  const [payment, setPayment] = useState<"PIX" | "Cartão" | "Boleto">("PIX");
  const availablePayments = docType === "cnpj" ? ["PIX", "Cartão", "Boleto"] as const : ["PIX", "Cartão"] as const;
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [cnpj, setCnpj] = useState("");

  const defaultPlan = plans[0] || { price: 199, lavagesIncluded: 8 };
  const resolvedPlanPrice = defaultPlan.priceOverrides?.[currentFranchise.id] !== undefined
    ? defaultPlan.priceOverrides[currentFranchise.id]
    : defaultPlan.price;

  const discount = computeDiscount(appliedCoupon, resolvedPlanPrice);
  const finalPlanPrice = Math.max(0, resolvedPlanPrice - discount);

  function reset() {
    onOpenChange(false);
    setTimeout(() => {
      setDocType("cpf");
      setPayment("PIX");
      setName("");
      setPhone("");
      setEmail("");
      setCpf("");
      setCnpj("");
      setAppliedCoupon(null);
    }, 200);
  }

  function confirm() {
    if (!name || !phone) {
      toast.error("Por favor, preencha nome e telefone");
      return;
    }
    const cleanPlate = plate.toUpperCase().trim();
    
    // Add subscriber
    const newSub = {
      id: `s-${Math.floor(100 + Math.random() * 900)}`,
      plate: cleanPlate,
      name,
      phone,
      email: email || `${name.toLowerCase().replace(/\s+/g, "")}@email.com`,
      document: docType === "cpf" ? cpf : cnpj,
      planIncluded: defaultPlan.lavagesIncluded,
      planUsed: 0,
      since: new Date().toISOString().split("T")[0],
      franchiseId: currentFranchise.id,
    };
    
    // Check if client exists
    const existingClient = clients.find(c => c.plates?.some(p => p.toUpperCase() === cleanPlate) || c.plate.toUpperCase() === cleanPlate);
    if (existingClient) {
      setClients(prev => prev.map(c => c.id === existingClient.id ? { ...c, isSubscriber: true } : c));
    } else {
      const newClient = {
        id: `c-${Math.floor(100 + Math.random() * 900)}`,
        name,
        plate: cleanPlate,
        plates: [cleanPlate],
        phone,
        visits: 0,
        lastVisit: new Date().toISOString().split("T")[0],
        totalSpent: 0,
        isSubscriber: true,
      };
      setClients(prev => [...prev, newClient]);
    }
    
    setSubscribers(prev => [...prev, newSub]);
    toast.success(`Assinatura criada · pagamento via ${payment}${appliedCoupon ? ` · cupom ${appliedCoupon.code}` : ""}`);
    reset();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); else onOpenChange(v); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Venda rápida de assinatura</DialogTitle>
          <DialogDescription>Plano {defaultPlan.name || "Lava Thru"} — {formatBRL(resolvedPlanPrice)} / mês, {defaultPlan.lavagesIncluded} lavagens inclusas</DialogDescription>
        </DialogHeader>
        <Tabs value={docType} onValueChange={(v) => { setDocType(v as "cpf" | "cnpj"); setPayment("PIX"); }}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="cpf">CPF (Pessoa Física)</TabsTrigger>
            <TabsTrigger value="cnpj">CNPJ (Empresa)</TabsTrigger>
          </TabsList>
          <TabsContent value="cpf" className="space-y-3 pt-3">
            <div><Label>Nome completo</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Nome do titular" /></div>
            <div><Label>CPF</Label><Input value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00" /></div>
            <div><Label>Telefone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(00) 00000-0000" /></div>
            <div><Label>Email</Label><Input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" /></div>
            <div><Label>Placa</Label><Input disabled value={plate} placeholder="ABC1D23" /></div>
          </TabsContent>
          <TabsContent value="cnpj" className="space-y-3 pt-3">
            <div><Label>Razão social</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Empresa LTDA" /></div>
            <div><Label>CNPJ</Label><Input value={cnpj} onChange={e => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" /></div>
            <div><Label>Telefone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(00) 00000-0000" /></div>
            <div><Label>Email</Label><Input value={email} onChange={e => setEmail(e.target.value)} placeholder="contato@empresa.com" /></div>
            <div><Label>Placa (opcional para frota)</Label><Input disabled value={plate} placeholder="ABC1D23" /></div>
          </TabsContent>
        </Tabs>
        <div>
          <Label>Forma de pagamento</Label>
          <RadioGroup value={payment} onValueChange={(v) => setPayment(v as typeof payment)} className={`grid grid-cols-${availablePayments.length} gap-2 mt-1.5`}>
            {availablePayments.map((p) => (
              <label key={p} className={`flex items-center justify-center rounded-lg border-2 p-2 cursor-pointer text-sm font-medium ${payment === p ? "border-brand bg-brand/5" : "border-border"}`}>
                <RadioGroupItem value={p} className="sr-only" />{p}
              </label>
            ))}
          </RadioGroup>
        </div>

        {/* Coupon field */}
        <div>
          <Label className="mb-1.5 block">Cupom de desconto</Label>
          <CouponInput
            franchiseId={currentFranchise.id}
            coupons={coupons}
            appliedCoupon={appliedCoupon}
            onApply={setAppliedCoupon}
            onClear={() => setAppliedCoupon(null)}
          />
        </div>

        {/* Price breakdown */}
        <div className="space-y-1">
          {appliedCoupon && (
            <div className="flex items-center justify-between px-3 text-sm text-muted-foreground">
              <span>Subtotal mensal</span>
              <span>{formatBRL(resolvedPlanPrice)}</span>
            </div>
          )}
          {appliedCoupon && (
            <div className="flex items-center justify-between px-3 text-sm text-success font-medium">
              <span>Desconto ({appliedCoupon.code})</span>
              <span>− {formatBRL(discount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between rounded-lg bg-muted p-3">
            <span className="text-sm">Total mensal</span>
            <span className="text-xl font-bold">{formatBRL(finalPlanPrice)}</span>
          </div>
          {profile === "franqueado" && (
            <div className="flex justify-between items-center px-3 text-[11px] text-muted-foreground">
              <span>Taxa de Franquia (Royalties {currentFranchise.royaltyFeePercent}%)</span>
              <span className="font-semibold">{formatBRL(finalPlanPrice * (currentFranchise.royaltyFeePercent / 100))}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={reset}>Cancelar</Button>
          <Button onClick={confirm} className="bg-brand text-brand-foreground hover:opacity-90">Criar assinatura</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function QrCodeSvg() {
  const cells = 21;
  const seed = "lava-thru-pix-mock";
  const bits = Array.from({ length: cells * cells }, (_, i) => (seed.charCodeAt(i % seed.length) + i) % 3 === 0);
  return (
    <svg width="180" height="180" viewBox={`0 0 ${cells} ${cells}`}>
      {bits.map((on, i) => on ? <rect key={i} x={i % cells} y={Math.floor(i / cells)} width="1" height="1" fill="black" /> : null)}
      {[[0, 0], [cells - 7, 0], [0, cells - 7]].map(([x, y], i) => (
        <g key={i}>
          <rect x={x} y={y} width="7" height="7" fill="black" />
          <rect x={x + 1} y={y + 1} width="5" height="5" fill="white" />
          <rect x={x + 2} y={y + 2} width="3" height="3" fill="black" />
        </g>
      ))}
    </svg>
  );
}
