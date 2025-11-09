import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import ProviderRegister from './pages/ProviderRegister'
import ProviderLogin from './pages/ProviderLogin'
import ProviderDashboard from './pages/ProviderDashboard'
import AppointerBooking from './pages/AppointerBooking'
import AppointerLogin from './pages/AppointerLogin'
import AppointerDashboard from './pages/AppointerDashboard'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import NotificationSystem from './components/NotificationSystem'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <NotificationSystem />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/provider/register" element={<ProviderRegister />} />
          <Route path="/provider/login" element={<ProviderLogin />} />
          <Route
            path="/provider/dashboard"
            element={
              <ProtectedRoute role="provider">
                <ProviderDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/appointer/booking" element={<AppointerBooking />} />
          <Route path="/appointer/login" element={<AppointerLogin />} />
          <Route
            path="/appointer/dashboard"
            element={
              <ProtectedRoute role="appointer">
                <AppointerDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App

