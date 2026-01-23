import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SettingsPage() {
    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold">Settings</h1>
            <Card>
                <CardHeader>
                    <CardTitle>System Settings</CardTitle>
                    <CardDescription>Configure your application preferences.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>This is an example settings page.</p>
                </CardContent>
            </Card>
        </div>
    )
}
