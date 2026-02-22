import {
    ChevronUp,
    User2,
    Settings,
} from "lucide-react"
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarHeader,
    SidebarFooter,
} from "@/components/ui/sidebar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"

import { navigation } from "@/routes/config"

export function AppSidebar() {
    const { user, logout, hasRole, hasAuthority } = useAuth();
    const navigate = useNavigate();

    const visibleNavigation = navigation.filter((item) => {
        const hasRequiredRoles = item.requiredRoles?.length ? item.requiredRoles.some(hasRole) : true;
        const hasRequiredPermissions = item.requiredPermissions?.length ? item.requiredPermissions.some(hasAuthority) : true;
        return hasRequiredRoles && hasRequiredPermissions;
    });

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="p-4 border-b border-sidebar-border">
                <h2 className="text-xl font-bold text-sidebar-foreground flex items-center gap-2">
                    <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground">
                        R
                    </div>
                    <span className="group-data-[collapsible=icon]:hidden">RMS</span>
                </h2>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Application</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {visibleNavigation.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild tooltip={item.title}>
                                        <Link to={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
                <SidebarGroup>
                    <SidebarGroupLabel>Utilities</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton>
                                    <Settings />
                                    <span>Administration</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton>
                                    <User2 />
                                    <span>{user?.username ?? "Guest"}</span>
                                    <ChevronUp className="ml-auto" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                side="top"
                                className="w-[--radix-popper-anchor-width]"
                            >
                                <DropdownMenuItem>
                                    <span>Account</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <span>Billing</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleLogout}>
                                    <span>Sign out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
