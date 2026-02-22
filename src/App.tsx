import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import DashboardLayout from "@/layouts/DashboardLayout"
import { navigation } from "@/routes/config"
import LoginPage from "@/pages/LoginPage"
import { ProtectedRoute } from "@/components/ProtectedRoute"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardLayout />}>
            {navigation.map((item) => (
              <Route
                key={item.url}
                index={item.url === "/"}
                path={item.url === "/" ? undefined : item.url.replace("/", "")}
                element={
                  <ProtectedRoute
                    requiredRoles={item.requiredRoles}
                    requiredPermissions={item.requiredPermissions}
                  >
                    {item.component}
                  </ProtectedRoute>
                }
              />
            ))}
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
