// Mock data for the Lava Thru prototype.

// ─── Centro de Custo ────────────────────────────────────────────────────────
export interface CostCenter {
  id: string;
  name: string;
  type: "receita" | "despesa" | "ambos";
  group: string;
  description?: string;
  franchiseIds?: string[]; // If undefined/empty, it's global
}

export const COST_CENTERS: CostCenter[] = [
  { id: "cc-001", name: "Receita de Lavagens",          type: "receita",  group: "Operacional"    },
  { id: "cc-002", name: "Receita de Planos/Assinaturas", type: "receita",  group: "Operacional"    },
  { id: "cc-003", name: "Royalties Matriz",              type: "receita",  group: "Royalties"      },
  { id: "cc-004", name: "Taxa de Adesão de Franquia",    type: "receita",  group: "Royalties"      },
  { id: "cc-005", name: "Parcerias Comerciais",          type: "receita",  group: "Comercial"      },
  { id: "cc-006", name: "Venda de Equipamentos",         type: "receita",  group: "Comercial"      },
  { id: "cc-007", name: "Aluguel Comercial",             type: "despesa",  group: "Infraestrutura" },
  { id: "cc-008", name: "Salários e Encargos",           type: "despesa",  group: "Pessoal"        },
  { id: "cc-009", name: "Água, Luz e Internet",          type: "despesa",  group: "Infraestrutura" },
  { id: "cc-010", name: "Marketing e Publicidade",       type: "despesa",  group: "Comercial"      },
  { id: "cc-011", name: "Tecnologia e Software",         type: "despesa",  group: "Administrativo" },
  { id: "cc-012", name: "Suprimentos de Lavagem",        type: "despesa",  group: "Operacional"    },
  { id: "cc-013", name: "Manutenção de Equipamentos",    type: "despesa",  group: "Operacional"    },
  { id: "cc-014", name: "Outros / Genérico",             type: "ambos",   group: "Geral"          },
];

export type ServiceType = "Essencial" | "Completa" | "Premium" | "Detalhada";

export interface Service {
  name: string;
  price: number;
  duration: string;
  royaltyPercent?: number; // % de Royalties da Matriz para este serviço
  costCenterId?: string;   // Centro de Custo vinculado (deve ser tipo receita/ambos)
  priceOverrides?: Record<string, number>;
}

export const SERVICES: Service[] = [
  { name: "Essencial", price: 35,  duration: "15 min", royaltyPercent: 10, costCenterId: "cc-001" },
  { name: "Completa",  price: 65,  duration: "30 min", royaltyPercent: 10, costCenterId: "cc-001" },
  { name: "Premium",   price: 120, duration: "50 min", royaltyPercent: 12, costCenterId: "cc-001" },
  { name: "Detalhada", price: 220, duration: "90 min", royaltyPercent: 12, costCenterId: "cc-001" },
];

export const PLAN_PRICE = 199;

export interface Franchise {
  id: string;
  name: string;
  city: string;
  royaltyFeePercent: number;
}

export const FRANCHISES: Franchise[] = [
  { id: "f-001", name: "Lava Thru Vila Olímpia", city: "São Paulo", royaltyFeePercent: 10 },
  { id: "f-002", name: "Lava Thru Savassi", city: "Belo Horizonte", royaltyFeePercent: 8 },
  { id: "f-003", name: "Lava Thru Curitiba Centro", city: "Curitiba", royaltyFeePercent: 12 },
  { id: "f-004", name: "Lava Thru Alphaville", city: "Barueri", royaltyFeePercent: 10 },
];

export interface Subscriber {
  id: string;
  plate: string;
  name: string;
  phone: string;
  email: string;
  document: string;
  planIncluded: number;
  planUsed: number;
  since: string;
  franchiseId: string;
}

export const SUBSCRIBERS: Subscriber[] = [
  { id: "s1", plate: "ABC1D23", name: "Marina Costa", phone: "(11) 98765-4321", email: "marina@email.com", document: "123.456.789-00", planIncluded: 8, planUsed: 3, since: "2025-03-12", franchiseId: "f-001" },
  { id: "s2", plate: "XYZ9K88", name: "Rafael Almeida", phone: "(11) 99123-4567", email: "rafael@email.com", document: "234.567.890-11", planIncluded: 8, planUsed: 7, since: "2025-01-20", franchiseId: "f-001" },
  { id: "s3", plate: "BRA2E19", name: "Juliana Mendes", phone: "(21) 98888-1122", email: "ju@email.com", document: "345.678.901-22", planIncluded: 12, planUsed: 5, since: "2024-11-05", franchiseId: "f-002" },
  { id: "s4", plate: "MER0T55", name: "Empresa Frotas LTDA", phone: "(31) 97777-2233", email: "frota@empresa.com", document: "12.345.678/0001-90", planIncluded: 40, planUsed: 22, since: "2024-08-15", franchiseId: "f-003" },
  { id: "s5", plate: "GOL4U67", name: "Pedro Henrique", phone: "(41) 96666-3344", email: "pedro@email.com", document: "456.789.012-33", planIncluded: 8, planUsed: 1, since: "2026-05-01", franchiseId: "f-004" },
  { id: "s6", plate: "LAV1T22", name: "Camila Rocha", phone: "(11) 95555-4455", email: "camila@email.com", document: "567.890.123-44", planIncluded: 8, planUsed: 8, since: "2025-06-18", franchiseId: "f-001" },
  { id: "s7", plate: "SAO7P90", name: "Distribuidora Sul S/A", phone: "(51) 94444-5566", email: "contato@sul.com", document: "98.765.432/0001-10", planIncluded: 60, planUsed: 41, since: "2024-02-10", franchiseId: "f-002" },
];

export interface Sale {
  id: string;
  date: string;
  plate: string;
  service: string;
  amount: number;
  payment: "PIX" | "Cartão" | "Dinheiro" | "Assinatura" | "Boleto";
  franchiseId: string;
  type: "avulsa" | "assinatura" | "plano";
  clientName?: string;
}

// Generate ~120 sales across last 90 days
function generateSales(): Sale[] {
  const sales: Sale[] = [];
  const payments: Sale["payment"][] = ["PIX", "Cartão", "Dinheiro", "Assinatura"];
  const plates = ["ABC1D23", "XYZ9K88", "BRA2E19", "MER0T55", "GOL4U67", "LAV1T22", "SAO7P90", "RJH2M45", "MGT7X01", "PRT3B88", "SPA9L23", "BHZ5W77"];
  const names = ["Marina Costa", "Rafael Almeida", "Juliana Mendes", "Pedro Henrique", "Camila Rocha", "Lucas Ferreira", "Ana Beatriz", "João Vitor", "Fernanda Lima", "Bruno Souza"];
  let idCounter = 1;
  for (let d = 0; d < 90; d++) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    const dayCount = 8 + Math.floor(Math.random() * 12);
    for (let i = 0; i < dayCount; i++) {
      const service = SERVICES[Math.floor(Math.random() * SERVICES.length)];
      const payment = payments[Math.floor(Math.random() * payments.length)];
      const franchise = FRANCHISES[Math.floor(Math.random() * FRANCHISES.length)];
      sales.push({
        id: `sale-${idCounter++}`,
        date: date.toISOString(),
        plate: plates[Math.floor(Math.random() * plates.length)],
        service: service.name,
        amount: payment === "Assinatura" ? 0 : service.price,
        payment,
        franchiseId: franchise.id,
        type: payment === "Assinatura" ? "assinatura" : "avulsa",
        clientName: names[Math.floor(Math.random() * names.length)],
      });
    }
  }
  return sales;
}

export const SALES: Sale[] = generateSales();

export interface Client {
  id: string;
  name: string;
  plate: string; // Placa principal
  plates: string[]; // Todas as placas vinculadas
  phone: string;
  visits: number;
  lastVisit: string;
  totalSpent: number;
  isSubscriber: boolean;
}

export const CLIENTS: Client[] = [
  { id: "c1", name: "Marina Costa", plate: "ABC1D23", plates: ["ABC1D23", "SPA9L23"], phone: "(11) 98765-4321", visits: 42, lastVisit: "2026-07-05", totalSpent: 2870, isSubscriber: true },
  { id: "c2", name: "Empresa Frotas LTDA", plate: "MER0T55", plates: ["MER0T55", "BRA2E19", "RJH2M45"], phone: "(31) 97777-2233", visits: 128, lastVisit: "2026-07-08", totalSpent: 8420, isSubscriber: true },
  { id: "c3", name: "Rafael Almeida", plate: "XYZ9K88", plates: ["XYZ9K88"], phone: "(11) 99123-4567", visits: 38, lastVisit: "2026-07-01", totalSpent: 2140, isSubscriber: true },
  { id: "c4", name: "Juliana Mendes", plate: "BRA2E19", plates: ["BRA2E19"], phone: "(21) 98888-1122", visits: 31, lastVisit: "2026-06-28", totalSpent: 1990, isSubscriber: true },
  { id: "c5", name: "Lucas Ferreira", plate: "RJH2M45", plates: ["RJH2M45"], phone: "(21) 91111-2233", visits: 24, lastVisit: "2026-07-07", totalSpent: 1560, isSubscriber: false },
  { id: "c6", name: "Distribuidora Sul S/A", plate: "SAO7P90", plates: ["SAO7P90"], phone: "(51) 94444-5566", visits: 89, lastVisit: "2026-07-06", totalSpent: 6320, isSubscriber: true },
  { id: "c7", name: "Ana Beatriz", plate: "MGT7X01", plates: ["MGT7X01"], phone: "(31) 92222-3344", visits: 19, lastVisit: "2026-06-30", totalSpent: 980, isSubscriber: false },
  { id: "c8", name: "Camila Rocha", plate: "LAV1T22", plates: ["LAV1T22"], phone: "(11) 95555-4455", visits: 17, lastVisit: "2026-06-25", totalSpent: 1240, isSubscriber: true },
  { id: "c9", name: "Pedro Henrique", plate: "GOL4U67", plates: ["GOL4U67"], phone: "(41) 96666-3344", visits: 11, lastVisit: "2026-07-03", totalSpent: 640, isSubscriber: true },
  { id: "c10", name: "João Vitor", plate: "PRT3B88", plates: ["PRT3B88"], phone: "(41) 93333-4455", visits: 9, lastVisit: "2026-06-22", totalSpent: 520, isSubscriber: false },
];

export interface User {
  id: string;
  name: string;
  email: string;
  role: "franquia" | "franqueado" | "operador";
  franchiseId?: string; // kept for backward compat, use franchiseIds instead
  franchiseIds?: string[]; // multi-franchise access
}

export const USERS: User[] = [
  { id: "u-001", name: "Gabrielle Rodmann", email: "gabrielle.rodmann@grupoeuphoria.com.br", role: "franquia" },
  { id: "u-002", name: "Carlos Souza", email: "carlos.souza@lavathru.com.br", role: "franqueado", franchiseId: "f-001", franchiseIds: ["f-001", "f-002"] },
  { id: "u-003", name: "Amanda Lima", email: "amanda.lima@lavathru.com.br", role: "operador", franchiseId: "f-003", franchiseIds: ["f-003"] },
];


export interface Coupon {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  validity: string;
  status: "active" | "inactive";
  scope: "global" | "restricted";
  franchiseIds?: string[];
}

export const COUPONS: Coupon[] = [
  { id: "cp-001", code: "BEMVINDO50", discountType: "fixed", discountValue: 50, validity: "2026-12-31", status: "active", scope: "global" },
  { id: "cp-002", code: "VERAO10", discountType: "percentage", discountValue: 10, validity: "2026-08-31", status: "active", scope: "restricted", franchiseIds: ["f-001"] },
  { id: "cp-003", code: "SHINE20", discountType: "percentage", discountValue: 20, validity: "2026-10-31", status: "inactive", scope: "restricted", franchiseIds: ["f-001", "f-003"] },
];

export interface Plan {
  id: string;
  name: string;
  price: number;
  lavagesIncluded: number;
  description: string;
  royaltyPercent?: number; // % de Royalties da Matriz para este plano
  costCenterId?: string;   // Centro de Custo vinculado (deve ser tipo receita/ambos)
  priceOverrides?: Record<string, number>;
}

export const PLANS: Plan[] = [
  { id: "pl-001", name: "Plano Bronze", price: 199, lavagesIncluded: 8,  description: "Até 8 lavagens por mês",  royaltyPercent: 10, costCenterId: "cc-002" },
  { id: "pl-002", name: "Plano Prata",  price: 269, lavagesIncluded: 12, description: "Até 12 lavagens por mês", royaltyPercent: 10, costCenterId: "cc-002" },
  { id: "pl-003", name: "Plano Ouro",   price: 799, lavagesIncluded: 40, description: "Uso comercial / Frotas - Até 40 lavagens por mês", royaltyPercent: 12, costCenterId: "cc-002" },
];

export function isSubscribed(plate: string): Subscriber | undefined {
  return SUBSCRIBERS.find((s) => s.plate.toUpperCase() === plate.toUpperCase());
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export interface FinancialEntry {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  status: "paid" | "pending";
  type: "receber" | "pagar";
  costCenterId: string;      // Centro de Custo (substitui category)
  /** @deprecated use costCenterId */ category?: string;
  franchiseId?: string;      // If undefined, it is a global Matriz entry
  originalSaleAmount?: number;
  paymentDate?: string;      // Data do pagamento/recebimento
  clientId?: string;         // Cliente vinculado
  supplierId?: string;       // Fornecedor vinculado
  plate?: string;            // Placa veicular vinculada
  installment?: string;      // Controle de parcela (ex: "1/3")
  royaltyPercent?: number;   // % de royalties original
}

export const MOCK_FINANCIAL_ENTRIES: FinancialEntry[] = [
  // Matriz payables
  { id: "fe-001", description: "Desenvolvimento do App / Infra AWS",  amount: 4800,  dueDate: "2026-07-25", status: "pending", type: "pagar",   costCenterId: "cc-011" },
  { id: "fe-002", description: "Agência de Marketing Nacional",         amount: 2500,  dueDate: "2026-07-20", status: "paid",    type: "pagar",   costCenterId: "cc-010" },
  // Matriz receivables
  { id: "fe-003", description: "Taxa de Implantação Unidade Batel",    amount: 25000, dueDate: "2026-07-15", status: "paid",    type: "receber", costCenterId: "cc-004" },
  { id: "fe-004", description: "Venda de Equipamentos (Aspiradores)",   amount: 8500,  dueDate: "2026-07-30", status: "pending", type: "receber", costCenterId: "cc-006" },

  // Vila Olímpia (f-001) payables
  { id: "fe-005", description: "Aluguel Comercial Pátio",               amount: 3500,  dueDate: "2026-07-10", status: "paid",    type: "pagar",   costCenterId: "cc-007", franchiseId: "f-001" },
  { id: "fe-006", description: "Folha de Pagamento - Operadores",       amount: 6200,  dueDate: "2026-07-05", status: "paid",    type: "pagar",   costCenterId: "cc-008", franchiseId: "f-001" },
  { id: "fe-007", description: "Conta de Água e Saneamento",            amount: 850,   dueDate: "2026-07-18", status: "pending", type: "pagar",   costCenterId: "cc-009", franchiseId: "f-001" },
  // Vila Olímpia (f-001) receivables
  { id: "fe-008", description: "Parceria Estacionamento Conveniado",    amount: 1500,  dueDate: "2026-07-20", status: "pending", type: "receber", costCenterId: "cc-005", franchiseId: "f-001" },

  // Savassi (f-002) payables
  { id: "fe-009", description: "Aluguel Comercial Savassi",             amount: 2800,  dueDate: "2026-07-10", status: "paid",    type: "pagar",   costCenterId: "cc-007", franchiseId: "f-002" },
  { id: "fe-010", description: "Energia e Luz Comercial",               amount: 650,   dueDate: "2026-07-15", status: "pending", type: "pagar",   costCenterId: "cc-009", franchiseId: "f-002" },
];
