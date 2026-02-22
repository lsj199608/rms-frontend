import type { LucideIcon } from "lucide-react";
import { Home, MessageCircle, Settings, Shield, Users } from "lucide-react";
import { ReactNode } from "react"
import DashboardHome from "@/pages/DashboardHome"
import AdminPage from "@/pages/AdminPage"
import ChatPage from "@/pages/ChatPage"
import UsersPage from "@/pages/UsersPage"
import SettingsPage from "@/pages/SettingsPage"

export interface NavigationItem {
    title: string
    url: string
    icon: LucideIcon
    component: ReactNode
    requiredRoles?: string[]
    requiredPermissions?: string[]
}

export const navigation: NavigationItem[] = [
    {
        title: "Home",
        url: "/",
        icon: Home,
        component: <DashboardHome />,
    },
    {
        title: "Users",
        url: "/users",
        icon: Users,
        component: <UsersPage />,
        requiredPermissions: ["USER_READ"],
    },
    {
        title: "Chat",
        url: "/chat",
        icon: MessageCircle,
        component: <ChatPage />,
        requiredPermissions: ["USER_READ"],
    },
    {
        title: "Settings",
        url: "/settings",
        icon: Settings,
        component: <SettingsPage />,
    },
    {
        title: "Admin",
        url: "/admin",
        icon: Shield,
        component: <AdminPage />,
        requiredRoles: ["ADMIN"],
    },
]
