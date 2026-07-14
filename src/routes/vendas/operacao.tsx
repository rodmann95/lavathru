import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Search, CheckCircle2, XCircle, QrCode, CreditCard, Banknote, Sparkles, Tag, X, Plus, Minus, Package, ShoppingCart, Flame } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/lib/app-context";
import { formatBRL, type Coupon, type Product } from "@/lib/mock-data";

export const Route = createFileRoute("/vendas/operacao")({
  head: () => ({ meta: [{ title: "Operação — Lava Thru" }] }),
  component: OperacaoPage,
});

type LookupState =
  | { status: "idle" }
  | { status: "subscriber"; subscriber: any }
  | { status: "not-subscriber"; plate: string };

function OperacaoPage() {
  const { currentFranchise, isSubscribed, setSubscribers } = useApp();
  const [plateInput, setPlateInput] = useState("");
  const [lookup, setLookup] = useState<LookupState>({ status: "idle" });
  const [saleOpen, setSaleOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [subscriberWashOpen, setSubscriberWashOpen] = useState(false);

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
              <div className="flex gap-2 w-full md:w-auto">
                <Button 
                  onClick={() => { 
                    setSubscribers((prev) => prev.map((s) => (s.id === lookup.subscriber.id ? { ...s, planUsed: s.planUsed + 1 } : s)));
                    toast.success("Lavagem de assinante registrada!"); 
                    setLookup({ status: "idle" }); 
                    setPlateInput(""); 
                  }}
                  className="bg-success text-success-foreground hover:bg-success/90"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Apenas Lavagem
                </Button>
                <Button variant="outline" onClick={() => setSubscriberWashOpen(true)}>
                  <Package className="h-4 w-4 mr-2" /> Lavagem + Conveniência
                </Button>
              </div>
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
      <QuickPlanDialog 
        open={planOpen} 
        onOpenChange={setPlanOpen} 
        plate={lookup.status === "not-subscriber" ? lookup.plate : ""} 
        onSuccess={(sub) => {
          setLookup({ status: "subscriber", subscriber: sub });
          setPlanOpen(false);
        }}
      />
      <SubscriberWashDialog
        open={subscriberWashOpen}
        onOpenChange={setSubscriberWashOpen}
        plate={lookup.status === "subscriber" ? lookup.subscriber.plate : ""}
        subscriber={lookup.status === "subscriber" ? lookup.subscriber : null}
        onSuccess={() => {
          setSubscriberWashOpen(false);
          setLookup({ status: "idle" });
          setPlateInput("");
        }}
      />
    </div>
  );
}

// Helper: validates a coupon code against the current franchise
export function validateCoupon(
  code: string,
  coupons: Coupon[],
  franchiseId: string,
  allowedTargets: string[]
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
  if (!allowedTargets.includes(found.target || "Todos")) {
    return { valid: false, reason: `Cupom inválido para este tipo de venda.` };
  }
  return { valid: true, coupon: found };
}

export function computeDiscount(coupon: Coupon | null, price: number): number {
  if (!coupon) return 0;
  if (coupon.discountType === "percentage") return Math.min(price, price * (coupon.discountValue / 100));
  return Math.min(price, coupon.discountValue);
}

export function CouponInput({
  franchiseId,
  coupons,
  onApply,
  appliedCoupon,
  onClear,
  allowedTargets,
}: {
  franchiseId: string;
  coupons: Coupon[];
  onApply: (coupon: Coupon) => void;
  appliedCoupon: Coupon | null;
  onClear: () => void;
  allowedTargets: string[];
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  function handleApply() {
    const result = validateCoupon(code, coupons, franchiseId, allowedTargets);
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
  const { services, currentFranchise, profile, coupons, products, setProducts } = useApp();
  const [selectedServiceName, setSelectedServiceName] = useState(services[0]?.name || "Essencial");
  const [payment, setPayment] = useState<"PIX" | "Cartão" | "Dinheiro">("PIX");
  const [step, setStep] = useState<"form" | "pix" | "card" | "done">("form");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<{ product: Product; quantity: number }[]>([]);
  const [productSearch, setProductSearch] = useState("");

  // Calculate Service Price
  const svc = services.find((s) => s.name === selectedServiceName) || services[0] || { price: 35, duration: "15 min", royaltyPercent: 10 };
  const resolvedServicePrice = svc.priceOverrides?.[currentFranchise.id] !== undefined
    ? svc.priceOverrides[currentFranchise.id]
    : svc.price;

  // Products available to sell
  const availableProducts = products.filter(
    (p) => !p.disabledIn?.includes(currentFranchise.id) && (p.stock?.[currentFranchise.id] || 0) > 0
  );

  const searchedProducts = productSearch.trim() === "" ? [] : availableProducts.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
    (p.code && p.code.toLowerCase().includes(productSearch.toLowerCase()))
  ).slice(0, 5); // max 5 results in dropdown

  // Calculate Products Price
  const productsTotalPrice = selectedProducts.reduce((acc, item) => {
    const price = item.product.priceOverrides?.[currentFranchise.id] ?? item.product.basePrice;
    return acc + price * item.quantity;
  }, 0);

  const subtotal = resolvedServicePrice + productsTotalPrice;
  
  const discount = useMemo(() => {
    if (!appliedCoupon) return 0;
    let targetPrice = 0;
    if (appliedCoupon.target === "Serviço") targetPrice = resolvedServicePrice;
    else if (appliedCoupon.target === "Produto") targetPrice = productsTotalPrice;
    else targetPrice = subtotal; // "Todos"
    
    return computeDiscount(appliedCoupon, targetPrice);
  }, [appliedCoupon, resolvedServicePrice, productsTotalPrice, subtotal]);

  const finalPrice = Math.max(0, subtotal - discount);

  // Calculate Royalties
  const serviceRoyalty = resolvedServicePrice * ((svc.royaltyPercent ?? currentFranchise.royaltyFeePercent) / 100);
  const productsRoyalty = selectedProducts.reduce((acc, item) => {
    const price = item.product.priceOverrides?.[currentFranchise.id] ?? item.product.basePrice;
    return acc + (price * item.quantity * (item.product.royaltyFee / 100));
  }, 0);
  const totalRoyalty = serviceRoyalty + productsRoyalty;

  function confirm() {
    if (payment === "PIX") setStep("pix");
    else if (payment === "Cartão") setStep("card");
    else finalizeSale();
  }

  function finalizeSale() {
    // Reduce stock
    if (selectedProducts.length > 0) {
      setProducts((prev) =>
        prev.map((p) => {
          const soldItem = selectedProducts.find((sp) => sp.product.id === p.id);
          if (soldItem) {
            const currentStock = p.stock?.[currentFranchise.id] || 0;
            return {
              ...p,
              stock: {
                ...p.stock,
                [currentFranchise.id]: Math.max(0, currentStock - soldItem.quantity),
              },
            };
          }
          return p;
        })
      );
    }
    toast.success("Venda registrada com sucesso");
    reset();
  }

  function reset() {
    setStep("form");
    setAppliedCoupon(null);
    setSelectedProducts([]);
    setProductSearch("");
    onOpenChange(false);
    setTimeout(() => { setSelectedServiceName(services[0]?.name || "Essencial"); setPayment("PIX"); }, 200);
  }

  function addProduct(product: Product) {
    setSelectedProducts((prev) => {
      const existing = prev.find((p) => p.product.id === product.id);
      if (existing) {
        const maxStock = product.stock?.[currentFranchise.id] || 0;
        if (existing.quantity >= maxStock) {
          toast.error("Estoque insuficiente");
          return prev;
        }
        return prev.map((p) => (p.product.id === product.id ? { ...p, quantity: p.quantity + 1 } : p));
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function removeProduct(productId: string) {
    setSelectedProducts((prev) => {
      const existing = prev.find((p) => p.product.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map((p) => (p.product.id === productId ? { ...p, quantity: p.quantity - 1 } : p));
      }
      return prev.filter((p) => p.product.id !== productId);
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); else onOpenChange(v); }}>
      <DialogContent className="max-w-5xl">
        {step === "form" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Lançar venda</DialogTitle>
              <DialogDescription>Placa do veículo: <span className="font-mono font-bold text-foreground text-base bg-muted px-2 py-1 rounded">{plate}</span></DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mt-2">
              {/* Left Column: Services & Products */}
              <div className="lg:col-span-3 space-y-6">
                {/* Service Cards */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">1. Selecione o Serviço</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {services.map((s) => {
                      const priceForCurrentFranchise = s.priceOverrides?.[currentFranchise.id] ?? s.price;
                      const isSelected = selectedServiceName === s.name;
                      return (
                        <div 
                          key={s.name} 
                          onClick={() => { setSelectedServiceName(s.name); setAppliedCoupon(null); }}
                          className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col gap-2 overflow-hidden ${isSelected ? "border-brand bg-brand/5 shadow-md scale-[1.02]" : "border-muted bg-background hover:border-brand/40 hover:shadow-sm"}`}
                        >
                          {isSelected && (
                            <div className="absolute top-3 left-3 text-brand bg-brand/20 rounded-full p-0.5">
                              <CheckCircle2 className="h-4 w-4" />
                            </div>
                          )}
                          {s.isHot && (
                            <div className="absolute top-2 right-2 flex items-center gap-1 bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border border-orange-200 shadow-sm">
                              <Flame className="h-3 w-3 fill-orange-500" /> Hot
                            </div>
                          )}
                          <div className={`flex flex-col ${isSelected ? 'mt-6' : 'mt-2'} transition-all`}>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Lavagem</span>
                            <span className={`font-black text-2xl leading-none mt-1 ${isSelected ? "text-brand" : "text-foreground"}`}>{s.name}</span>
                          </div>
                          <div className="flex items-center justify-between mt-auto pt-4 border-t border-muted/50">
                            <span className={`text-xl font-extrabold tracking-tight ${isSelected ? "text-brand" : "text-foreground"}`}>{formatBRL(priceForCurrentFranchise)}</span>
                            <span className="text-xs text-muted-foreground bg-muted/40 px-2 py-1 rounded-md font-medium">{s.duration}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Products */}
                {availableProducts.length > 0 && (
                  <div>
                    <Label className="text-base font-semibold mb-3 block">2. Conveniência (Opcional)</Label>
                    <div className="space-y-4">
                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        <Input 
                          placeholder="Buscar produto por nome ou código..." 
                          className="pl-10 h-12 text-base" 
                          value={productSearch} 
                          onChange={(e) => setProductSearch(e.target.value)} 
                        />
                        {productSearch && (
                          <div className="absolute z-10 w-full mt-2 bg-background border rounded-lg shadow-xl max-h-60 overflow-y-auto">
                            {searchedProducts.map(p => (
                              <div key={p.id} onClick={() => { addProduct(p); setProductSearch(""); }} className="p-3 hover:bg-muted cursor-pointer flex justify-between items-center text-sm border-b last:border-0">
                                <div>
                                  <p className="font-medium text-base">{p.name}</p>
                                  {p.code && <p className="text-xs text-muted-foreground mt-0.5">Cód: {p.code}</p>}
                                </div>
                                <span className="font-bold text-base">{formatBRL(p.priceOverrides?.[currentFranchise.id] ?? p.basePrice)}</span>
                              </div>
                            ))}
                            {searchedProducts.length === 0 && <div className="p-6 text-sm text-muted-foreground text-center">Nenhum produto encontrado.</div>}
                          </div>
                        )}
                      </div>

                      {/* Top 4 Quick Add */}
                      {!productSearch && (
                        <div className="grid grid-cols-4 gap-2">
                          {availableProducts.slice(0, 4).map(p => {
                            const stock = p.stock?.[currentFranchise.id] || 0;
                            return (
                              <div key={p.id} onClick={() => addProduct(p)} className="relative bg-background border-2 rounded-xl p-3 hover:border-brand hover:shadow-md cursor-pointer transition-all flex flex-col h-full text-center group">
                                {p.isHot && (
                                  <div className="absolute -top-2 -right-2 bg-gradient-to-br from-orange-400 to-orange-600 text-white p-1.5 rounded-full shadow-md z-10">
                                    <Flame className="h-3 w-3 fill-white" />
                                  </div>
                                )}
                                <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40 group-hover:text-brand transition-colors" />
                                <p className="font-semibold text-xs leading-tight line-clamp-2 flex-1 text-foreground/80">{p.name}</p>
                                <span className="font-black text-sm mt-2 block text-brand">{formatBRL(p.priceOverrides?.[currentFranchise.id] ?? p.basePrice)}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Cart & Payment */}
              <div className="lg:col-span-2 flex flex-col bg-muted/10 border rounded-xl overflow-hidden">
                <div className="p-4 bg-muted/30 border-b">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" /> Resumo do Pedido
                  </h3>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Cart Items */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b">
                      <div>
                        <div className="font-semibold text-sm">Lavagem {selectedServiceName}</div>
                        <div className="text-xs text-muted-foreground">Veículo: {plate}</div>
                      </div>
                      <div className="font-bold">{formatBRL(resolvedServicePrice)}</div>
                    </div>

                    {selectedProducts.map((sp) => {
                      const productPrice = sp.product.priceOverrides?.[currentFranchise.id] ?? sp.product.basePrice;
                      const stock = sp.product.stock?.[currentFranchise.id] || 0;
                      return (
                        <div key={sp.product.id} className="flex justify-between items-center pb-2 border-b">
                          <div className="flex-1 min-w-0 pr-2">
                            <div className="font-medium text-sm truncate">{sp.product.name}</div>
                            <div className="text-xs text-muted-foreground">{formatBRL(productPrice)} un.</div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className="font-bold text-sm">{formatBRL(productPrice * sp.quantity)}</div>
                            <div className="flex items-center gap-1 bg-background rounded-md border p-0.5">
                              <Button type="button" variant="ghost" size="icon" className="h-5 w-5 rounded-sm" onClick={() => removeProduct(sp.product.id)}>
                                <Minus className="h-2 w-2" />
                              </Button>
                              <span className="font-mono text-xs w-4 text-center">{sp.quantity}</span>
                              <Button type="button" variant="ghost" size="icon" className="h-5 w-5 rounded-sm" onClick={() => addProduct(sp.product)} disabled={sp.quantity >= stock}>
                                <Plus className="h-2 w-2" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Payment Info */}
                <div className="p-4 bg-muted/30 border-t space-y-4 mt-auto">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Cupom de Desconto</Label>
                    <CouponInput
                      franchiseId={currentFranchise.id}
                      coupons={coupons}
                      appliedCoupon={appliedCoupon}
                      onApply={setAppliedCoupon}
                      onClear={() => setAppliedCoupon(null)}
                      allowedTargets={["Serviço", "Produto", "Todos"]}
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Forma de Pagamento</Label>
                    <RadioGroup value={payment} onValueChange={(v) => setPayment(v as typeof payment)} className="flex gap-2">
                      {[
                        { v: "PIX", icon: QrCode },
                        { v: "Cartão", icon: CreditCard },
                        { v: "Dinheiro", icon: Banknote },
                      ].map(({ v, icon: I }) => (
                        <label key={v} className={`flex-1 flex flex-col items-center gap-1 rounded-lg border-2 p-2 cursor-pointer transition-colors ${payment === v ? "border-brand bg-brand/5 text-brand" : "border-muted hover:bg-muted/50 text-muted-foreground"}`}>
                          <RadioGroupItem value={v} className="sr-only" />
                          <I className="h-4 w-4" />
                          <span className="text-[10px] font-bold uppercase">{v}</span>
                        </label>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="space-y-1 pt-2 border-t">
                    {appliedCoupon && (
                      <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <span>Subtotal</span>
                        <span>{formatBRL(subtotal)}</span>
                      </div>
                    )}
                    {appliedCoupon && (
                      <div className="flex justify-between items-center text-sm text-success font-medium">
                        <span>Desconto</span>
                        <span>− {formatBRL(discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-xl font-black">
                      <span>Total</span>
                      <span>{formatBRL(finalPrice)}</span>
                    </div>
                    {profile === "franqueado" && (
                      <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1">
                        <span>Royalties (Matriz)</span>
                        <span className="font-semibold">{formatBRL(totalRoyalty)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" onClick={reset} className="flex-1">Cancelar</Button>
                    <Button onClick={confirm} className="flex-[2] bg-brand text-brand-foreground hover:opacity-90 font-bold text-base h-11">
                      Cobrar {formatBRL(finalPrice)}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
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
              <Button onClick={finalizeSale} className="bg-success text-success-foreground hover:opacity-90">
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
              <Button onClick={finalizeSale} className="bg-success text-success-foreground hover:opacity-90">
                Simular aprovação
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SubscriberWashDialog({
  open,
  onOpenChange,
  plate,
  subscriber,
  onSuccess
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  plate: string;
  subscriber: any;
  onSuccess: () => void;
}) {
  const { currentFranchise, profile, coupons, products, setProducts, setSubscribers } = useApp();
  const [payment, setPayment] = useState<"PIX" | "Cartão" | "Dinheiro">("Cartão");
  const [step, setStep] = useState<"form" | "pix" | "card">("form");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<{ product: Product; quantity: number }[]>([]);
  const [productSearch, setProductSearch] = useState("");

  const availableProducts = products.filter(
    (p) => !p.disabledIn?.includes(currentFranchise.id) && (p.stock?.[currentFranchise.id] || 0) > 0
  );

  const searchedProducts = productSearch.trim() === "" ? [] : availableProducts.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
    (p.code && p.code.toLowerCase().includes(productSearch.toLowerCase()))
  ).slice(0, 5);

  const productsTotalPrice = selectedProducts.reduce((acc, item) => {
    const price = item.product.priceOverrides?.[currentFranchise.id] ?? item.product.basePrice;
    return acc + price * item.quantity;
  }, 0);

  const discount = computeDiscount(appliedCoupon, productsTotalPrice);
  const finalPrice = Math.max(0, productsTotalPrice - discount);

  const productsRoyalty = selectedProducts.reduce((acc, item) => {
    const price = item.product.priceOverrides?.[currentFranchise.id] ?? item.product.basePrice;
    return acc + (price * item.quantity * (item.product.royaltyFee / 100));
  }, 0);

  function confirm() {
    if (finalPrice === 0) {
      finalizeWash();
    } else if (payment === "PIX") {
      setStep("pix");
    } else if (payment === "Cartão") {
      setStep("card");
    } else {
      finalizeWash();
    }
  }

  function finalizeWash() {
    if (selectedProducts.length > 0) {
      setProducts((prev) =>
        prev.map((p) => {
          const soldItem = selectedProducts.find((sp) => sp.product.id === p.id);
          if (soldItem) {
            const currentStock = p.stock?.[currentFranchise.id] || 0;
            return {
              ...p,
              stock: { ...p.stock, [currentFranchise.id]: Math.max(0, currentStock - soldItem.quantity) },
            };
          }
          return p;
        })
      );
    }
    
    // Register wash
    if (subscriber) {
      setSubscribers((prev) =>
        prev.map((s) => (s.id === subscriber.id ? { ...s, planUsed: s.planUsed + 1 } : s))
      );
    }
    
    toast.success("Lavagem de assinante registrada com sucesso!");
    onSuccess();
    reset();
  }

  function reset() {
    setStep("form");
    setAppliedCoupon(null);
    setSelectedProducts([]);
    setProductSearch("");
    onOpenChange(false);
    setTimeout(() => { setPayment("Cartão"); }, 200);
  }

  function addProduct(product: Product) {
    setSelectedProducts((prev) => {
      const existing = prev.find((p) => p.product.id === product.id);
      if (existing) {
        const maxStock = product.stock?.[currentFranchise.id] || 0;
        if (existing.quantity >= maxStock) { toast.error("Estoque insuficiente"); return prev; }
        return prev.map((p) => (p.product.id === product.id ? { ...p, quantity: p.quantity + 1 } : p));
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function removeProduct(productId: string) {
    setSelectedProducts((prev) => {
      const existing = prev.find((p) => p.product.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map((p) => (p.product.id === productId ? { ...p, quantity: p.quantity - 1 } : p));
      }
      return prev.filter((p) => p.product.id !== productId);
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); else onOpenChange(v); }}>
      <DialogContent className="max-w-5xl">
        {step === "form" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Lavagem Inclusa — Assinante</DialogTitle>
              <DialogDescription>Placa do veículo: <span className="font-mono font-bold text-success text-base bg-success/10 px-2 py-1 rounded border border-success/20">{plate}</span></DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mt-2">
              <div className="lg:col-span-3 space-y-6">
                <div>
                  <Label className="text-base font-semibold mb-3 block">1. Serviço Inserido</Label>
                  <div className="relative p-4 rounded-xl border-2 border-success bg-success/5 flex flex-col gap-2">
                    <div className="absolute top-3 right-3 h-3 w-3 rounded-full bg-success" />
                    <div className="font-bold text-lg text-success leading-tight">Lavagem do Plano<br/>(Inclusa)</div>
                    <div className="flex items-center justify-between mt-auto pt-2">
                      <span className="text-xl font-black text-success">R$ 0,00</span>
                      <span className="text-xs text-success/80 bg-success/10 px-2 py-1 rounded border border-success/20">Assinante: {subscriber?.name}</span>
                    </div>
                  </div>
                </div>

                {availableProducts.length > 0 && (
                  <div>
                    <Label className="text-base font-semibold mb-3 block">2. Adicionar Conveniência (Opcional)</Label>
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        <Input 
                          placeholder="Buscar produto por nome ou código..." 
                          className="pl-10 h-12 text-base" 
                          value={productSearch} 
                          onChange={(e) => setProductSearch(e.target.value)} 
                        />
                        {productSearch && (
                          <div className="absolute z-10 w-full mt-2 bg-background border rounded-lg shadow-xl max-h-60 overflow-y-auto">
                            {searchedProducts.map(p => (
                              <div key={p.id} onClick={() => { addProduct(p); setProductSearch(""); }} className="p-3 hover:bg-muted cursor-pointer flex justify-between items-center text-sm border-b last:border-0">
                                <div>
                                  <p className="font-medium text-base">{p.name}</p>
                                  {p.code && <p className="text-xs text-muted-foreground mt-0.5">Cód: {p.code}</p>}
                                </div>
                                <span className="font-bold text-base">{formatBRL(p.priceOverrides?.[currentFranchise.id] ?? p.basePrice)}</span>
                              </div>
                            ))}
                            {searchedProducts.length === 0 && <div className="p-6 text-sm text-muted-foreground text-center">Nenhum produto encontrado.</div>}
                          </div>
                        )}
                      </div>

                      {!productSearch && (
                        <div className="grid grid-cols-4 gap-2">
                          {availableProducts.slice(0, 4).map(p => {
                            const stock = p.stock?.[currentFranchise.id] || 0;
                            return (
                              <div key={p.id} onClick={() => addProduct(p)} className="relative bg-background border-2 rounded-xl p-3 hover:border-brand hover:shadow-md cursor-pointer transition-all flex flex-col h-full text-center group">
                                {p.isHot && (
                                  <div className="absolute -top-2 -right-2 bg-gradient-to-br from-orange-400 to-orange-600 text-white p-1.5 rounded-full shadow-md z-10">
                                    <Flame className="h-3 w-3 fill-white" />
                                  </div>
                                )}
                                <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40 group-hover:text-brand transition-colors" />
                                <p className="font-semibold text-xs leading-tight line-clamp-2 flex-1 text-foreground/80">{p.name}</p>
                                <span className="font-black text-sm mt-2 block text-brand">{formatBRL(p.priceOverrides?.[currentFranchise.id] ?? p.basePrice)}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="lg:col-span-2 flex flex-col bg-muted/10 border rounded-xl overflow-hidden">
                <div className="p-4 bg-muted/30 border-b">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" /> Resumo do Pedido
                  </h3>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b">
                      <div>
                        <div className="font-semibold text-sm">Lavagem Assinatura</div>
                        <div className="text-xs text-muted-foreground">Veículo: {plate}</div>
                      </div>
                      <div className="font-bold text-success">Grátis</div>
                    </div>

                    {selectedProducts.map((sp) => {
                      const productPrice = sp.product.priceOverrides?.[currentFranchise.id] ?? sp.product.basePrice;
                      const stock = sp.product.stock?.[currentFranchise.id] || 0;
                      return (
                        <div key={sp.product.id} className="flex justify-between items-center pb-2 border-b">
                          <div className="flex-1 min-w-0 pr-2">
                            <div className="font-medium text-sm truncate">{sp.product.name}</div>
                            <div className="text-xs text-muted-foreground">{formatBRL(productPrice)} un.</div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className="font-bold text-sm">{formatBRL(productPrice * sp.quantity)}</div>
                            <div className="flex items-center gap-1 bg-background rounded-md border p-0.5">
                              <Button type="button" variant="ghost" size="icon" className="h-5 w-5 rounded-sm" onClick={() => removeProduct(sp.product.id)}>
                                <Minus className="h-2 w-2" />
                              </Button>
                              <span className="font-mono text-xs w-4 text-center">{sp.quantity}</span>
                              <Button type="button" variant="ghost" size="icon" className="h-5 w-5 rounded-sm" onClick={() => addProduct(sp.product)} disabled={sp.quantity >= stock}>
                                <Plus className="h-2 w-2" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 bg-muted/30 border-t space-y-4 mt-auto">
                  {selectedProducts.length > 0 && (
                    <>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">Cupom de Desconto</Label>
                        <CouponInput
                          franchiseId={currentFranchise.id}
                          coupons={coupons}
                          appliedCoupon={appliedCoupon}
                          onApply={setAppliedCoupon}
                          onClear={() => setAppliedCoupon(null)}
                          allowedTargets={["Produto", "Todos"]}
                        />
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground mb-1.5 block">Forma de Pagamento (Avulsos)</Label>
                        <RadioGroup value={payment} onValueChange={(v) => setPayment(v as typeof payment)} className="flex gap-2">
                          {[
                            { v: "PIX", icon: QrCode },
                            { v: "Cartão", icon: CreditCard },
                            { v: "Dinheiro", icon: Banknote },
                          ].map(({ v, icon: I }) => (
                            <label key={v} className={`flex-1 flex flex-col items-center gap-1 rounded-lg border-2 p-2 cursor-pointer transition-colors ${payment === v ? "border-brand bg-brand/5 text-brand" : "border-muted hover:bg-muted/50 text-muted-foreground"}`}>
                              <RadioGroupItem value={v} className="sr-only" />
                              <I className="h-4 w-4" />
                              <span className="text-[10px] font-bold uppercase">{v}</span>
                            </label>
                          ))}
                        </RadioGroup>
                      </div>

                      <div className="space-y-1 pt-2 border-t">
                        {appliedCoupon && (
                          <div className="flex justify-between items-center text-sm text-muted-foreground">
                            <span>Subtotal Conveniência</span>
                            <span>{formatBRL(productsTotalPrice)}</span>
                          </div>
                        )}
                        {appliedCoupon && (
                          <div className="flex justify-between items-center text-sm text-success font-medium">
                            <span>Desconto</span>
                            <span>− {formatBRL(discount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-xl font-black">
                          <span>Total</span>
                          <span>{formatBRL(finalPrice)}</span>
                        </div>
                        {profile === "franqueado" && (
                          <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1">
                            <span>Royalties (Conveniência)</span>
                            <span className="font-semibold">{formatBRL(productsRoyalty)}</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" onClick={reset} className="flex-1">Cancelar</Button>
                    {finalPrice === 0 ? (
                      <Button onClick={confirm} className="flex-[2] bg-success text-success-foreground hover:bg-success/90 font-bold text-base h-11">
                        Confirmar Lavagem Inclusa
                      </Button>
                    ) : (
                      <Button onClick={confirm} className="flex-[2] bg-brand text-brand-foreground hover:opacity-90 font-bold text-base h-11">
                        Cobrar {formatBRL(finalPrice)}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
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
              <Button onClick={finalizeWash} className="bg-success text-success-foreground hover:opacity-90">
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
              <Button onClick={finalizeWash} className="bg-success text-success-foreground hover:opacity-90">
                Simular aprovação
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function QuickPlanDialog({ open, onOpenChange, plate, onSuccess }: { open: boolean; onOpenChange: (v: boolean) => void; plate: string; onSuccess: (sub: any) => void }) {
  const { setSubscribers, setClients, clients, currentFranchise, plans, profile, coupons } = useApp();
  const [docType, setDocType] = useState<"cpf" | "cnpj">("cpf");
  const [payment, setPayment] = useState<"PIX" | "Cartão" | "Boleto">("Cartão");
  const availablePayments = docType === "cnpj" ? ["PIX", "Cartão", "Boleto"] as const : ["Cartão"] as const;
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [step, setStep] = useState<"form" | "card">("form");

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
      setStep("form");
      setDocType("cpf");
      setPayment("Cartão");
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
    if (payment === "Cartão") {
      setStep("card");
    } else {
      finalizeSubscription();
    }
  }

  function finalizeSubscription() {
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
    toast.success(`Assinatura criada com sucesso!`);
    
    // Reset internal state but do not call onOpenChange directly, let onSuccess handle it
    setTimeout(() => {
      setStep("form");
      setDocType("cpf");
      setPayment("Cartão");
      setName("");
      setPhone("");
      setEmail("");
      setCpf("");
      setCnpj("");
      setAppliedCoupon(null);
    }, 200);

    onSuccess(newSub);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); else onOpenChange(v); }}>
      <DialogContent className="max-w-lg">
        {step === "form" ? (
          <>
            <DialogHeader>
              <DialogTitle>Venda rápida de assinatura</DialogTitle>
              <DialogDescription>Plano {defaultPlan.name || "Lava Thru"} — {formatBRL(resolvedPlanPrice)} / mês, {defaultPlan.lavagesIncluded} lavagens inclusas</DialogDescription>
            </DialogHeader>
            <Tabs value={docType} onValueChange={(v) => { setDocType(v as "cpf" | "cnpj"); setPayment(v === "cpf" ? "Cartão" : "PIX"); }}>
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
            allowedTargets={["Plano", "Todos"]}
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

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={reset}>Cancelar</Button>
          <Button onClick={confirm} className="bg-brand text-brand-foreground hover:opacity-90">
            {payment === "Cartão" ? "Avançar para Pagamento" : "Criar assinatura"}
          </Button>
        </DialogFooter>
      </>
    ) : (
      <>
        <DialogHeader>
          <DialogTitle>Pagamento de Recorrência</DialogTitle>
          <DialogDescription>Insira os dados do cartão de crédito para a assinatura recorrente.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex justify-center pb-2">
            <CreditCard className="h-12 w-12 text-brand" />
          </div>
          <div className="space-y-1.5">
            <Label>Número do Cartão</Label>
            <Input placeholder="0000 0000 0000 0000" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Validade</Label>
              <Input placeholder="MM/AA" />
            </div>
            <div className="space-y-1.5">
              <Label>CVC</Label>
              <Input placeholder="123" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Nome Impresso</Label>
            <Input placeholder="NOME DO TITULAR" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setStep("form")}>Voltar</Button>
          <Button onClick={finalizeSubscription} className="bg-success text-success-foreground hover:opacity-90">
            Aprovar Pagamento
          </Button>
        </DialogFooter>
      </>
    )}
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
