import { Home, Users, Settings, LucideIcon } from "lucide-react"
import { ReactNode } from "react"
import DashboardHome from "@/pages/DashboardHome"
import UsersPage from "@/pages/UsersPage"
import SettingsPage from "@/pages/SettingsPage"

export interface NavigationItem {
    title: string
    url: string
    icon: LucideIcon
    component: ReactNode
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
    },
    {
        title: "Settings",
        url: "/settings",
        icon: Settings,
        component: <SettingsPage />,
    },
]
