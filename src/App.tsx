import React from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { LandingPage } from "./components/pages/LandingPage"
import { ConnectWalletPage } from "./components/pages/ConnectWalletPage"
import { DashboardPage } from "./components/dashboard/DashboardPage"

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const wallet = localStorage.getItem("wavy_wallet")
  
  if (!wallet) {
    return <Navigate to="/connect" replace />
  }
  
  return <>{children}</>
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/connect" element={<ConnectWalletPage />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  )
}

export default App