import { BrowserRouter, Routes, Route } from "react-router-dom"
import DashboardLayout from "@/layouts/DashboardLayout"
import { navigation } from "@/routes/config"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          {navigation.map((item) => (
            <Route
              key={item.url}
              index={item.url === "/"}
              path={item.url === "/" ? undefined : item.url.replace("/", "")}
              element={item.component}
            />
          ))}
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
