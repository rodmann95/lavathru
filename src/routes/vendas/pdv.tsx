import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Search, CreditCard, Banknote, Tag, X, Plus, Minus, Package, ShoppingCart, QrCode
} from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/lib/app-context";
import { formatBRL, type Coupon, type Product } from "@/lib/mock-data";

export const Route = createFileRoute("/vendas/pdv")({
  head: () => ({ meta: [{ title: "PDV (Conveniência) — Lava Thru" }] }),
  component: PdvPage,
});

function PdvPage() {
  const { currentFranchise, profile, coupons, products, setProducts } = useApp();
  
  function computeDiscount(coupon: Coupon | null, price: number): number {
    if (!coupon) return 0;
    if (coupon.discountType === "fixed") return coupon.discountValue;
    return price * (coupon.discountValue / 100);
  }
  
  const [productSearch, setProductSearch] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<{ product: Product; quantity: number }[]>([]);
  const [payment, setPayment] = useState<"PIX" | "Cartão" | "Dinheiro">("PIX");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  
  const [step, setStep] = useState<"cart" | "pix" | "card">("cart");

  const availableProducts = useMemo(() => {
    return products.filter(
      (p) => !p.disabledIn?.includes(currentFranchise.id) && (p.stock?.[currentFranchise.id] || 0) > 0
    );
  }, [products, currentFranchise.id]);

  const searchedProducts = useMemo(() => {
    if (productSearch.trim() === "") return [];
    return availableProducts.filter(p => 
      p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
      (p.code && p.code.toLowerCase().includes(productSearch.toLowerCase()))
    ).slice(0, 8);
  }, [productSearch, availableProducts]);

  const subtotal = useMemo(() => {
    return selectedProducts.reduce((acc, item) => {
      const price = item.product.priceOverrides?.[currentFranchise.id] ?? item.product.basePrice;
      return acc + price * item.quantity;
    }, 0);
  }, [selectedProducts, currentFranchise.id]);

  const discount = computeDiscount(appliedCoupon, subtotal);
  const finalPrice = Math.max(0, subtotal - discount);

  const totalRoyalty = useMemo(() => {
    return selectedProducts.reduce((acc, item) => {
      const price = item.product.priceOverrides?.[currentFranchise.id] ?? item.product.basePrice;
      return acc + (price * item.quantity * (item.product.royaltyFee / 100));
    }, 0);
  }, [selectedProducts, currentFranchise.id]);

  function addProduct(product: Product) {
    setSelectedProducts((prev) => {
      const existing = prev.find((p) => p.product.id === product.id);
      if (existing) {
        const maxStock = product.stock?.[currentFranchise.id] || 0;
        if (existing.quantity >= maxStock) {
          toast.error("Estoque insuficiente para " + product.name);
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

  function confirmCheckout() {
    if (selectedProducts.length === 0) {
      toast.error("Adicione produtos ao carrinho antes de finalizar.");
      return;
    }
    if (payment === "PIX") setStep("pix");
    else if (payment === "Cartão") setStep("card");
    else finalizeSale();
  }

  function finalizeSale() {
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
    toast.success("Venda avulsa registrada com sucesso!");
    reset();
  }

  function reset() {
    setStep("cart");
    setAppliedCoupon(null);
    setSelectedProducts([]);
    setProductSearch("");
    setPayment("PIX");
  }

  if (step === "pix") {
    return (
      <div className="max-w-md mx-auto mt-10">
        <Card>
          <CardHeader>
            <CardTitle>Pagamento via PIX</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3 py-8">
            <QrCode className="h-32 w-32" />
            <div className="text-lg font-semibold">{formatBRL(finalPrice)}</div>
            <div className="text-sm text-muted-foreground text-center">
              Aguardando pagamento pelo cliente.<br/>Esta tela fechará automaticamente.
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setStep("cart")}>Voltar</Button>
            <Button onClick={finalizeSale} className="bg-success text-success-foreground hover:opacity-90">Simular Pagamento</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (step === "card") {
    return (
      <div className="max-w-md mx-auto mt-10">
        <Card>
          <CardHeader>
            <CardTitle>Cartão — Maquininha</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3 py-8">
            <CreditCard className="h-16 w-16 text-brand animate-pulse" />
            <div className="text-lg font-semibold">Enviando {formatBRL(finalPrice)} para a maquininha…</div>
            <div className="text-sm text-muted-foreground">Aproxime, insira ou passe o cartão.</div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setStep("cart")}>Voltar</Button>
            <Button onClick={finalizeSale} className="bg-success text-success-foreground hover:opacity-90">Simular Aprovação</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">PDV (Conveniência)</h1>
          <p className="text-sm text-muted-foreground">Venda rápida de produtos avulsos.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Search & Quick Add */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg">Buscar Produto</CardTitle>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="Busque por nome ou código de barras (SKU)..." 
                  className="pl-10 h-12 text-lg"
                  value={productSearch} 
                  onChange={(e) => setProductSearch(e.target.value)} 
                  autoFocus
                />
                {productSearch && (
                  <div className="absolute z-10 w-full mt-2 bg-background border rounded-lg shadow-xl max-h-[400px] overflow-y-auto">
                    {searchedProducts.map(p => (
                      <div key={p.id} onClick={() => { addProduct(p); setProductSearch(""); }} className="p-4 hover:bg-muted cursor-pointer flex justify-between items-center border-b last:border-0 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-brand/10 rounded-full flex items-center justify-center shrink-0">
                            <Package className="h-5 w-5 text-brand" />
                          </div>
                          <div>
                            <p className="font-semibold text-lg leading-none">{p.name}</p>
                            {p.code && <p className="text-sm text-muted-foreground mt-1">Cód: {p.code}</p>}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-lg">{formatBRL(p.priceOverrides?.[currentFranchise.id] ?? p.basePrice)}</span>
                          <p className="text-xs text-muted-foreground">{p.stock?.[currentFranchise.id] || 0} em estoque</p>
                        </div>
                      </div>
                    ))}
                    {searchedProducts.length === 0 && (
                      <div className="p-8 text-muted-foreground text-center flex flex-col items-center">
                        <Search className="h-8 w-8 mb-2 opacity-50" />
                        <p>Nenhum produto encontrado com "{productSearch}".</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto bg-muted/10 p-6">
              {!productSearch && availableProducts.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Todos os Produtos</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                    {availableProducts.map(p => {
                      const stock = p.stock?.[currentFranchise.id] || 0;
                      return (
                        <div key={p.id} onClick={() => addProduct(p)} className="bg-background border rounded-lg p-3 hover:border-brand hover:shadow-sm cursor-pointer transition-all flex flex-col h-full">
                          <div className="flex-1">
                            <p className="font-medium text-sm line-clamp-2">{p.name}</p>
                            {p.code && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{p.code}</p>}
                          </div>
                          <div className="mt-3 flex items-end justify-between">
                            <span className="font-bold">{formatBRL(p.priceOverrides?.[currentFranchise.id] ?? p.basePrice)}</span>
                            <span className="text-[10px] text-muted-foreground">{stock} un</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {availableProducts.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                  <Package className="h-12 w-12 mb-2 opacity-20" />
                  <p>Nenhum produto cadastrado ou em estoque na sua franquia.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Cart & Checkout */}
        <div className="space-y-4">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Carrinho
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              {selectedProducts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                  <ShoppingCart className="h-10 w-10 mb-3 opacity-20" />
                  <p className="text-sm">O carrinho está vazio.<br/>Busque um produto para adicionar.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {selectedProducts.map((sp) => {
                    const price = sp.product.priceOverrides?.[currentFranchise.id] ?? sp.product.basePrice;
                    const stock = sp.product.stock?.[currentFranchise.id] || 0;
                    return (
                      <div key={sp.product.id} className="p-4 flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">{sp.product.name}</p>
                            <p className="text-xs text-muted-foreground">{formatBRL(price)} un.</p>
                          </div>
                          <span className="font-bold text-sm">{formatBRL(price * sp.quantity)}</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-[10px] text-muted-foreground">{stock - sp.quantity} restantes</p>
                          <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 rounded-sm" onClick={() => removeProduct(sp.product.id)}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="font-mono text-xs w-6 text-center font-medium">{sp.quantity}</span>
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 rounded-sm" onClick={() => addProduct(sp.product)} disabled={sp.quantity >= stock}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>

            <div className="p-4 bg-muted/20 border-t space-y-4">
              {/* Coupon Field */}
              <div>
                <Label className="text-xs mb-1.5 block text-muted-foreground">Cupom (Opcional)</Label>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-success/10 text-success border border-success/20 p-2 rounded-lg text-sm">
                    <span className="font-medium flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5" />
                      {appliedCoupon.code}
                    </span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-success/20 text-success" onClick={() => setAppliedCoupon(null)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Input 
                      placeholder="Código do cupom" 
                      className="h-8 text-sm pr-20"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const val = e.currentTarget.value.trim().toUpperCase();
                          const found = coupons.find((c) => c.code === val);
                          if (found) {
                            if (found.target === "Plano" || found.target === "Serviço") {
                              toast.error("Cupom não aplicável a produtos.");
                            } else {
                              setAppliedCoupon(found);
                              e.currentTarget.value = "";
                            }
                          } else {
                            toast.error("Cupom inválido");
                          }
                        }
                      }}
                    />
                    <Badge variant="secondary" className="absolute right-1 top-1 bottom-1 text-[10px] pointer-events-none flex items-center bg-background/50">
                      Enter
                    </Badge>
                  </div>
                )}
              </div>

              {/* Payment Methods */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Forma de Pagamento</Label>
                <RadioGroup value={payment} onValueChange={(v: any) => setPayment(v)} className="flex gap-2">
                  <Label className="flex-1">
                    <RadioGroupItem value="PIX" className="sr-only" />
                    <div className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 cursor-pointer transition-colors ${payment === "PIX" ? "border-brand bg-brand/5 text-brand" : "border-muted hover:bg-muted/50 text-muted-foreground"}`}>
                      <QrCode className="h-4 w-4 mb-1" />
                      <span className="text-[10px] font-medium">PIX</span>
                    </div>
                  </Label>
                  <Label className="flex-1">
                    <RadioGroupItem value="Cartão" className="sr-only" />
                    <div className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 cursor-pointer transition-colors ${payment === "Cartão" ? "border-brand bg-brand/5 text-brand" : "border-muted hover:bg-muted/50 text-muted-foreground"}`}>
                      <CreditCard className="h-4 w-4 mb-1" />
                      <span className="text-[10px] font-medium">Cartão</span>
                    </div>
                  </Label>
                  <Label className="flex-1">
                    <RadioGroupItem value="Dinheiro" className="sr-only" />
                    <div className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 cursor-pointer transition-colors ${payment === "Dinheiro" ? "border-brand bg-brand/5 text-brand" : "border-muted hover:bg-muted/50 text-muted-foreground"}`}>
                      <Banknote className="h-4 w-4 mb-1" />
                      <span className="text-[10px] font-medium">Dinheiro</span>
                    </div>
                  </Label>
                </RadioGroup>
              </div>

              {/* Totals Summary */}
              <div className="space-y-1 pt-2 border-t">
                {appliedCoupon && (
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatBRL(subtotal)}</span>
                  </div>
                )}
                {appliedCoupon && (
                  <div className="flex justify-between items-center text-sm text-success font-medium">
                    <span>Desconto ({appliedCoupon.code})</span>
                    <span>− {formatBRL(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total</span>
                  <span>{formatBRL(finalPrice)}</span>
                </div>
                {profile === "franqueado" && totalRoyalty > 0 && (
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1">
                    <span>Royalties Matriz (Est.)</span>
                    <span>{formatBRL(totalRoyalty)}</span>
                  </div>
                )}
              </div>

              <Button 
                onClick={confirmCheckout} 
                className="w-full h-12 text-base font-bold bg-success text-success-foreground hover:opacity-90"
                disabled={selectedProducts.length === 0}
              >
                Cobrar {formatBRL(finalPrice)}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
