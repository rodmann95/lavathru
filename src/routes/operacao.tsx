import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Search, CheckCircle2, XCircle, QrCode, CreditCard, Banknote, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { SERVICES, SUBSCRIBERS, isSubscribed, PLAN_PRICE, formatBRL, type ServiceType } from "@/lib/mock-data";
import { useApp } from "@/lib/app-context";

export const Route = createFileRoute("/operacao")({
  head: () => ({ meta: [{ title: "Operação — Lava Thru" }] }),
  component: OperacaoPage,
});

type LookupState =
  | { status: "idle" }
  | { status: "subscriber"; subscriber: (typeof SUBSCRIBERS)[number] }
  | { status: "not-subscriber"; plate: string };

function OperacaoPage() {
  const { currentFranchise } = useApp();
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
            <div className="rounded-xl border-2 border-success bg-success/10 p-6 flex items-center justify-between flex-wrap gap-4">
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
            <div className="rounded-xl border-2 border-destructive bg-destructive/10 p-6 flex items-center justify-between flex-wrap gap-4">
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

function SaleDialog({ open, onOpenChange, plate }: { open: boolean; onOpenChange: (v: boolean) => void; plate: string }) {
  const [service, setService] = useState<ServiceType>("Essencial");
  const [payment, setPayment] = useState<"PIX" | "Cartão" | "Dinheiro">("PIX");
  const [step, setStep] = useState<"form" | "pix" | "card" | "done">("form");
  const svc = SERVICES.find((s) => s.name === service)!;

  function confirm() {
    if (payment === "PIX") setStep("pix");
    else if (payment === "Cartão") setStep("card");
    else { toast.success("Venda registrada"); reset(); }
  }
  function reset() { setStep("form"); onOpenChange(false); setTimeout(() => { setService("Essencial"); setPayment("PIX"); }, 200); }

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
                <Select value={service} onValueChange={(v) => setService(v as ServiceType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SERVICES.map((s) => (
                      <SelectItem key={s.name} value={s.name}>
                        Lavagem {s.name} — {formatBRL(s.price)} · {s.duration}
                      </SelectItem>
                    ))}
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
              <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                <span className="text-sm">Total</span>
                <span className="text-xl font-bold">{formatBRL(svc.price)}</span>
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
                <div className="text-2xl font-bold">{formatBRL(svc.price)}</div>
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
              <div className="text-lg font-semibold">Enviando {formatBRL(svc.price)} para a maquininha…</div>
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
  const [docType, setDocType] = useState<"cpf" | "cnpj">("cpf");
  const [payment, setPayment] = useState<"PIX" | "Cartão" | "Boleto">("PIX");
  const availablePayments = docType === "cnpj" ? ["PIX", "Cartão", "Boleto"] as const : ["PIX", "Cartão"] as const;

  function reset() { onOpenChange(false); setTimeout(() => { setDocType("cpf"); setPayment("PIX"); }, 200); }
  function confirm() {
    toast.success(`Assinatura criada · pagamento via ${payment}`);
    reset();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); else onOpenChange(v); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Venda rápida de assinatura</DialogTitle>
          <DialogDescription>Plano Lava Thru — {formatBRL(PLAN_PRICE)} / mês, 8 lavagens inclusas</DialogDescription>
        </DialogHeader>
        <Tabs value={docType} onValueChange={(v) => { setDocType(v as "cpf" | "cnpj"); setPayment("PIX"); }}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="cpf">CPF (Pessoa Física)</TabsTrigger>
            <TabsTrigger value="cnpj">CNPJ (Empresa)</TabsTrigger>
          </TabsList>
          <TabsContent value="cpf" className="space-y-3 pt-3">
            <Field label="Nome completo" placeholder="Nome do titular" />
            <Field label="CPF" placeholder="000.000.000-00" />
            <Field label="Telefone" placeholder="(00) 00000-0000" />
            <Field label="Email" placeholder="email@exemplo.com" />
            <Field label="Placa" defaultValue={plate} placeholder="ABC1D23" />
          </TabsContent>
          <TabsContent value="cnpj" className="space-y-3 pt-3">
            <Field label="Razão social" placeholder="Empresa LTDA" />
            <Field label="CNPJ" placeholder="00.000.000/0000-00" />
            <Field label="Telefone" placeholder="(00) 00000-0000" />
            <Field label="Email" placeholder="contato@empresa.com" />
            <Field label="Placa (opcional para frota)" defaultValue={plate} placeholder="ABC1D23" />
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
        <div className="flex items-center justify-between rounded-lg bg-muted p-3">
          <span className="text-sm">Total mensal</span>
          <span className="text-xl font-bold">{formatBRL(PLAN_PRICE)}</span>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={reset}>Cancelar</Button>
          <Button onClick={confirm} className="bg-brand text-brand-foreground hover:opacity-90">Criar assinatura</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, ...props }: { label: string } & React.ComponentProps<typeof Input>) {
  return (
    <div>
      <Label>{label}</Label>
      <Input {...props} />
    </div>
  );
}

function QrCodeSvg() {
  // Purely decorative "QR code" pattern
  const cells = 21;
  const seed = "lava-thru-pix-mock";
  const bits = Array.from({ length: cells * cells }, (_, i) => (seed.charCodeAt(i % seed.length) + i) % 3 === 0);
  return (
    <svg width="180" height="180" viewBox={`0 0 ${cells} ${cells}`}>
      {bits.map((on, i) => on ? <rect key={i} x={i % cells} y={Math.floor(i / cells)} width="1" height="1" fill="black" /> : null)}
      {/* corner squares */}
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
