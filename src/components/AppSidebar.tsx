import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  UserCircle,
  Sparkles,
  DollarSign,
  ChevronRight,
  FolderPlus,
  Building2,
  UserCheck,
  Wrench,
  Tag,
  CreditCard,
  ShoppingCart,
  Car,
  Truck,
  LineChart,
  BarChart3,
  Package,
  Store,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Logo } from "./Logo";
import { useApp } from "@/lib/app-context";

const topItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Assistente IA", url: "/ia", icon: Sparkles },
];

const financeiroItems = [
  { title: "Visão Geral", url: "/financeiro/visao-geral", icon: DollarSign },
  { title: "DRE", url: "/financeiro/dre", icon: BarChart3 },
  { title: "Centros de Custo", url: "/cadastros/centros-de-custo", icon: LineChart },
];

const vendasMenuGroups = [
  {
    label: "Operação Diária",
    items: [
      { title: "Lançar Venda", url: "/vendas/operacao", icon: Car },
      { title: "PDV Conveniência", url: "/vendas/pdv", icon: Store },
      { title: "Assinantes", url: "/vendas/assinantes", icon: Users },
    ]
  },
  {
    label: "Cadastros de Venda",
    items: [
      { title: "Serviços", url: "/cadastros/servicos", icon: Wrench },
      { title: "Produtos", url: "/cadastros/produtos", icon: Package },
      { title: "Planos", url: "/cadastros/planos", icon: CreditCard },
      { title: "Cupons", url: "/cadastros/cupons", icon: Tag },
    ]
  }
];

const cadastroItemsFranquia = [
  { title: "Franquias", url: "/cadastros/franquias", icon: Building2 },
  { title: "Usuários", url: "/cadastros/usuarios", icon: UserCheck },
  { title: "Clientes", url: "/cadastros/clientes", icon: UserCircle },
  { title: "Fornecedores", url: "/cadastros/fornecedores", icon: Truck },
];

const cadastroItemsFranqueado = [
  { title: "Usuários", url: "/cadastros/usuarios", icon: UserCheck },
  { title: "Clientes", url: "/cadastros/clientes", icon: UserCircle },
  { title: "Fornecedores", url: "/cadastros/fornecedores", icon: Truck },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { profile } = useApp();

  const visibleCadastroItems =
    profile === "franqueado" ? cadastroItemsFranqueado : cadastroItemsFranquia;

  const isVendasActive = pathname.startsWith("/vendas");
  const isFinanceiroActive = pathname.startsWith("/financeiro");
  const isCadastrosActive = pathname.startsWith("/cadastros");

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Top-level items: Dashboard, IA, Financeiro */}
              {topItems.map((item) => {
                const active = item.url === "/" ? pathname === "/" : pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className="data-[active=true]:bg-brand data-[active=true]:text-brand-foreground hover:bg-sidebar-accent"
                    >
                      <Link to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

              {/* Submenu: Financeiro */}
              <Collapsible defaultOpen={isFinanceiroActive} className="group/collapsible-financeiro">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      isActive={isFinanceiroActive}
                      className="data-[active=true]:bg-brand/10 data-[active=true]:text-brand hover:bg-sidebar-accent"
                    >
                      <DollarSign className="h-4 w-4" />
                      <span>Financeiro</span>
                      <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible-financeiro:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {financeiroItems.map((subItem) => {
                        const active = pathname.startsWith(subItem.url);
                        return (
                          <SidebarMenuSubItem key={subItem.url}>
                            <SidebarMenuSubButton asChild isActive={active}>
                              <Link to={subItem.url} className="flex items-center gap-2">
                                <subItem.icon className="h-3.5 w-3.5" />
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Submenu: Vendas */}
              <Collapsible defaultOpen={isVendasActive} className="group/collapsible-vendas">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      isActive={isVendasActive}
                      className="data-[active=true]:bg-brand/10 data-[active=true]:text-brand hover:bg-sidebar-accent"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      <span>Vendas</span>
                      <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible-vendas:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {vendasMenuGroups.map((group, i) => (
                        <div key={group.label} className={i > 0 ? "mt-3" : ""}>
                          <div className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                            {group.label}
                          </div>
                          {group.items.map((subItem) => {
                            const active = pathname.startsWith(subItem.url);
                            return (
                              <SidebarMenuSubItem key={subItem.url}>
                                <SidebarMenuSubButton asChild isActive={active}>
                                  <Link to={subItem.url} className="flex items-center gap-2">
                                    <subItem.icon className="h-3.5 w-3.5" />
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </div>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Submenu: Cadastros */}
              <Collapsible defaultOpen={isCadastrosActive} className="group/collapsible-cadastros">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      isActive={isCadastrosActive}
                      className="data-[active=true]:bg-brand/10 data-[active=true]:text-brand hover:bg-sidebar-accent"
                    >
                      <FolderPlus className="h-4 w-4" />
                      <span>Cadastros</span>
                      <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible-cadastros:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {visibleCadastroItems.map((subItem) => {
                        const active = pathname === subItem.url;
                        return (
                          <SidebarMenuSubItem key={subItem.url}>
                            <SidebarMenuSubButton asChild isActive={active}>
                              <Link to={subItem.url} className="flex items-center gap-2">
                                <subItem.icon className="h-3.5 w-3.5" />
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
