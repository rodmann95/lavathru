// Mock data for the Lava Thru prototype.

export type ServiceType = "Essencial" | "Completa" | "Premium" | "Detalhada";

export const SERVICES: { name: ServiceType; price: number; duration: string }[] = [
  { name: "Essencial", price: 35, duration: "15 min" },
  { name: "Completa", price: 65, duration: "30 min" },
  { name: "Premium", price: 120, duration: "50 min" },
  { name: "Detalhada", price: 220, duration: "90 min" },
];

export const PLAN_PRICE = 199;

export interface Franchise {
  id: string;
  name: string;
  city: string;
}

export const FRANCHISES: Franchise[] = [
  { id: "f-001", name: "Lava Thru Vila Olímpia", city: "São Paulo, SP" },
  { id: "f-002", name: "Lava Thru Barra da Tijuca", city: "Rio de Janeiro, RJ" },
  { id: "f-003", name: "Lava Thru Savassi", city: "Belo Horizonte, MG" },
  { id: "f-004", name: "Lava Thru Batel", city: "Curitiba, PR" },
  { id: "f-005", name: "Lava Thru Boa Viagem", city: "Recife, PE" },
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
  service: ServiceType;
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
  plate: string;
  phone: string;
  visits: number;
  lastVisit: string;
  totalSpent: number;
  isSubscriber: boolean;
}

export const CLIENTS: Client[] = [
  { id: "c1", name: "Marina Costa", plate: "ABC1D23", phone: "(11) 98765-4321", visits: 42, lastVisit: "2026-07-05", totalSpent: 2870, isSubscriber: true },
  { id: "c2", name: "Empresa Frotas LTDA", plate: "MER0T55", phone: "(31) 97777-2233", visits: 128, lastVisit: "2026-07-08", totalSpent: 8420, isSubscriber: true },
  { id: "c3", name: "Rafael Almeida", plate: "XYZ9K88", phone: "(11) 99123-4567", visits: 38, lastVisit: "2026-07-01", totalSpent: 2140, isSubscriber: true },
  { id: "c4", name: "Juliana Mendes", plate: "BRA2E19", phone: "(21) 98888-1122", visits: 31, lastVisit: "2026-06-28", totalSpent: 1990, isSubscriber: true },
  { id: "c5", name: "Lucas Ferreira", plate: "RJH2M45", phone: "(21) 91111-2233", visits: 24, lastVisit: "2026-07-07", totalSpent: 1560, isSubscriber: false },
  { id: "c6", name: "Distribuidora Sul S/A", plate: "SAO7P90", phone: "(51) 94444-5566", visits: 89, lastVisit: "2026-07-06", totalSpent: 6320, isSubscriber: true },
  { id: "c7", name: "Ana Beatriz", plate: "MGT7X01", phone: "(31) 92222-3344", visits: 19, lastVisit: "2026-06-30", totalSpent: 980, isSubscriber: false },
  { id: "c8", name: "Camila Rocha", plate: "LAV1T22", phone: "(11) 95555-4455", visits: 17, lastVisit: "2026-06-25", totalSpent: 1240, isSubscriber: true },
  { id: "c9", name: "Pedro Henrique", plate: "GOL4U67", phone: "(41) 96666-3344", visits: 11, lastVisit: "2026-07-03", totalSpent: 640, isSubscriber: true },
  { id: "c10", name: "João Vitor", plate: "PRT3B88", phone: "(41) 93333-4455", visits: 9, lastVisit: "2026-06-22", totalSpent: 520, isSubscriber: false },
];

export function isSubscribed(plate: string): Subscriber | undefined {
  return SUBSCRIBERS.find((s) => s.plate.toUpperCase() === plate.toUpperCase());
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
