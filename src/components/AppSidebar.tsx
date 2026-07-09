import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Car,
  Users,
  UserCircle,
  Sparkles,
  DollarSign,
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
} from "@/components/ui/sidebar";
import { Logo } from "./Logo";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Operação", url: "/operacao", icon: Car },
  { title: "Assinantes", url: "/assinantes", icon: Users },
  { title: "Clientes", url: "/clientes", icon: UserCircle },
  { title: "Assistente IA", url: "/ia", icon: Sparkles },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

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
              {items.map((item) => {
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
