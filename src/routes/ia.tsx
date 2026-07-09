import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles, Send, User } from "lucide-react";
import { SALES, CLIENTS, SUBSCRIBERS, formatBRL } from "@/lib/mock-data";
import { useApp } from "@/lib/app-context";

export const Route = createFileRoute("/ia")({
  head: () => ({ meta: [{ title: "Assistente IA — Lava Thru" }] }),
  component: IAPage,
});

interface Msg { role: "user" | "assistant"; content: string; }

function IAPage() {
  const { currentFranchise } = useApp();
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: `Olá! Sou o assistente Lava Thru. Posso responder sobre faturamento, ranking de clientes, uso de planos e mais para ${currentFranchise.name}. Experimente perguntar algo como:\n\n• "Qual meu faturamento nos últimos 30 dias?"\n• "Quem são meus melhores clientes?"\n• "Quantos assinantes ativos temos?"` },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  function reply(q: string): string {
    const t = q.toLowerCase();
    const salesF = SALES.filter((s) => s.franchiseId === currentFranchise.id);
    const last30 = salesF.filter((s) => new Date(s.date).getTime() > Date.now() - 30 * 86400000);

    if (/(faturamento|receita|revenue)/.test(t)) {
      const total = last30.reduce((a, s) => a + s.amount, 0);
      return `Nos últimos 30 dias, ${currentFranchise.name} faturou **${formatBRL(total)}** em ${last30.length} lavagens.`;
    }
    if (/(melhor|ranking|top).*(cliente)/.test(t) || /(cliente).*(melhor|ranking|top)/.test(t)) {
      const top = [...CLIENTS].sort((a, b) => b.visits - a.visits).slice(0, 3);
      return `Top 3 clientes por visitas:\n\n${top.map((c, i) => `${i + 1}. **${c.name}** (${c.plate}) — ${c.visits} visitas · ${formatBRL(c.totalSpent)}`).join("\n")}`;
    }
    if (/(assinante|assinatura)/.test(t)) {
      const franchiseSubs = SUBSCRIBERS.filter((s) => s.franchiseId === currentFranchise.id);
      const total = franchiseSubs.length;
      const usados = franchiseSubs.reduce((a, s) => a + s.planUsed, 0);
      const inclusos = franchiseSubs.reduce((a, s) => a + s.planIncluded, 0);
      return `Temos **${total} assinantes ativos** em ${currentFranchise.name}. Uso agregado: ${usados}/${inclusos} lavagens (${Math.round((usados / inclusos) * 100)}%).`;
    }
    if (/(carro|lavagem|lavado|volume)/.test(t)) {
      return `Volume dos últimos 30 dias: **${last30.length} carros lavados**. Ticket médio ${formatBRL(last30.reduce((a, s) => a + s.amount, 0) / Math.max(1, last30.filter((s) => s.amount > 0).length))}.`;
    }
    if (/(serviço|servico|premium|essencial|completa)/.test(t)) {
      const byS: Record<string, number> = {};
      last30.forEach((s) => { byS[s.service] = (byS[s.service] || 0) + 1; });
      const list = Object.entries(byS).sort((a, b) => b[1] - a[1]);
      return `Serviços mais vendidos (30d):\n\n${list.map(([k, v]) => `• ${k}: ${v} vendas`).join("\n")}`;
    }
    return `Posso analisar dados de operação, assinantes, clientes e financeiro. Tente perguntar sobre "faturamento", "melhores clientes", "assinantes" ou "serviços mais vendidos". (Este é um protótipo — respostas baseadas nos dados mockados de ${currentFranchise.name}.)`;
  }

  function send() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setTimeout(() => setMessages((m) => [...m, { role: "assistant", content: reply(text) }]), 400);
  }

  const suggestions = [
    "Qual meu faturamento nos últimos 30 dias?",
    "Quem são meus melhores clientes?",
    "Quantos assinantes ativos temos?",
    "Serviços mais vendidos",
  ];

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-lg bg-brand-gradient flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Assistente IA</h1>
          <p className="text-xs text-muted-foreground">Converse sobre os dados de {currentFranchise.name}</p>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "assistant" && (
                <div className="h-8 w-8 rounded-full bg-brand-gradient flex-shrink-0 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
              )}
              <div className={`rounded-2xl px-4 py-2.5 max-w-[80%] whitespace-pre-wrap text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {m.content.split("**").map((chunk, idx) => idx % 2 === 1 ? <strong key={idx}>{chunk}</strong> : <span key={idx}>{chunk}</span>)}
              </div>
              {m.role === "user" && (
                <div className="h-8 w-8 rounded-full bg-secondary flex-shrink-0 flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </CardContent>
        <div className="border-t p-3 space-y-2">
          <div className="flex gap-2 flex-wrap">
            {suggestions.map((s) => (
              <Button key={s} variant="outline" size="sm" onClick={() => setInput(s)}>{s}</Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input placeholder="Pergunte algo sobre seus dados…" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
            <Button onClick={send} className="bg-brand text-brand-foreground hover:opacity-90"><Send className="h-4 w-4" /></Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
