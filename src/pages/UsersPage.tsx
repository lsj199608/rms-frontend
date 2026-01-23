import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function UsersPage() {
    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold">Users</h1>
            <Card>
                <CardHeader>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Manage your system users here.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>This is an example users page.</p>
                </CardContent>
            </Card>
        </div>
    )
}
