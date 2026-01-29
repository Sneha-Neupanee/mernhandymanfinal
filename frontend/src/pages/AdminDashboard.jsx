import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import './Dashboard.css'

/* ⭐ CHART IMPORTS */
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const AdminDashboard = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('statistics')

  const [statistics, setStatistics] = useState(null)
  const [providers, setProviders] = useState([])
  const [bookings, setBookings] = useState([])
  const [trainingBookings, setTrainingBookings] = useState([])

  const [profitData, setProfitData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (activeTab === 'statistics') {
      fetchStatistics()
    } else if (activeTab === 'providers') {
      fetchProviders()
    } else if (activeTab === 'bookings') {
      fetchBookings()
    } else if (activeTab === 'training') {
      fetchTrainingBookings()
    } else if (activeTab === 'profit') {
      fetchProfit()
    }
  }, [activeTab])

  const fetchStatistics = async () => {
    try {
      const response = await api.get('/admin/statistics')
      setStatistics(response.data)
    } catch (err) {
      console.error('Failed to fetch statistics:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchProviders = async () => {
    try {
      const response = await api.get('/admin/providers')
      setProviders(response.data)
    } catch (err) {
      console.error('Failed to fetch providers:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchBookings = async () => {
    try {
      const response = await api.get('/admin/bookings')
      setBookings(response.data)
    } catch (err) {
      console.error('Failed to fetch bookings:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchTrainingBookings = async () => {
    try {
      const res = await api.get('/training/bookings')
      setTrainingBookings(res.data)
    } catch (err) {
      console.error('Failed to fetch training bookings:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchProfit = async () => {
    try {
      const res = await api.get('/admin/profit')
      setProfitData(res.data)
    } catch (err) {
      console.error('Failed to fetch profit:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyProvider = async (providerId, action) => {
    try {
      await api.put(`/admin/providers/${providerId}/verify`, { action })
      alert(`Provider ${action}ed successfully`)
      fetchProviders()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to verify provider')
    }
  }

  const handleMarkTrainingDone = async (id) => {
    try {
      await api.put(`/training/update-status/${id}`)
      alert("Marked as done")
      fetchTrainingBookings()
    } catch (err) {
      alert("Failed to update status")
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ffc107'
      case 'verified': return '#28a745'
      case 'rejected': return '#dc3545'
      default: return '#6c757d'
    }
  }

  const getBookingStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ffc107'
      case 'confirmed': return '#28a745'
      case 'completed': return '#17a2b8'
      case 'rejected': return '#dc3545'
      default: return '#6c757d'
    }
  }

  /* ⭐ BUILD CHART DATA */
  const chartData = statistics ? [
    {
      label: "Total Providers",
      value: statistics.providers.total
    },
    {
      label: "Total Appointments",
      value: statistics.appointments.total
    },
    {
      label: "Completed Last Month",
      value: statistics.appointments.completedLastMonth
    },
    {
      label: "Verified Providers (Last Month)",
      value: statistics.providers.verifiedLastMonth
    }
  ] : [];

  return (
    <div className="dashboard">
      <div className="container">
        <h1 className="dashboard-title">Admin Dashboard</h1>
        <p className="dashboard-subtitle">Welcome, {user?.username}!</p>

        <div className="tabs">
          <button className={`tab ${activeTab === 'statistics' ? 'active' : ''}`} onClick={() => setActiveTab('statistics')}>
            Statistics
          </button>
          <button className={`tab ${activeTab === 'providers' ? 'active' : ''}`} onClick={() => setActiveTab('providers')}>
            Providers
          </button>
          <button className={`tab ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>
            Bookings
          </button>
          <button className={`tab ${activeTab === 'training' ? 'active' : ''}`} onClick={() => setActiveTab('training')}>
            Training Bookings
          </button>
          <button className={`tab ${activeTab === 'profit' ? 'active' : ''}`} onClick={() => setActiveTab('profit')}>
            Profit
          </button>
        </div>

        {loading ? (
          <div className="dashboard-loading">Loading...</div>
        ) : (
          <>
            {/* ==================== STATISTICS TAB ==================== */}
            {activeTab === 'statistics' && statistics && (
              <>
                <div className="statistics-grid">

                  <div className="stat-card">
                    <h3>Total Service Providers</h3>
                    <p className="stat-number">{statistics.providers.total}</p>
                  </div>

                  <div className="stat-card">
                    <h3>Total Appointers</h3>
                    <p className="stat-number">{statistics.appointers.total}</p>
                  </div>

                  <div className="stat-card">
                    <h3>Total Appointments</h3>
                    <p className="stat-number">{statistics.appointments.total}</p>
                  </div>

                  <div className="stat-card">
                    <h3>Completed Last Month</h3>
                    <p className="stat-number">{statistics.appointments.completedLastMonth}</p>
                  </div>

                  <div className="stat-card">
                    <h3>Verified Providers Last Month</h3>
                    <p className="stat-number">{statistics.providers.verifiedLastMonth}</p>
                  </div>

                </div>

                {/* ⭐ CLEAN WHITE BAR CHART */}
                <div style={{
                  width: '100%',
                  height: 380,
                  marginTop: 50,
                  marginBottom: 60,
                  background: '#ffffff',
                  borderRadius: 14,
                  padding: '20px 25px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.08)'
                }}>
                  <h2 style={{
                    textAlign: 'center',
                    marginBottom: 25,
                    color: '#000',
                    fontWeight: 700,
                    fontSize: '22px'
                  }}>
                    Platform Comparison Chart
                  </h2>

                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#dcdcdc" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 13, fill: "#000" }}
                        interval={0}
                      />
                      <YAxis tick={{ fontSize: 13, fill: "#000" }} />
                      <Tooltip
                        contentStyle={{
                          background: "#fff",
                          border: "1px solid #ddd",
                          borderRadius: 8,
                          color: "#000"
                        }}
                      />
                      <Bar
                        dataKey="value"
                        fill="#1A2560"
                        radius={[10, 10, 0, 0]}
                        barSize={55}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {/* ==================== PROVIDERS TAB ==================== */}
            {activeTab === 'providers' && (
              <div className="providers-list">
                {providers.length > 0 ? (
                  providers.map(provider => (
                    <div key={provider._id} className="provider-card">
                      <div className="provider-header">
                        {provider.profilePhotoUrl && (
                          <img 
                            src={`http://localhost:5000${provider.profilePhotoUrl}`} 
                            alt={provider.name}
                            className="provider-photo"
                          />
                        )}
                        <div>
                          <h3>{provider.name}</h3>
                          <p><strong>Phone:</strong> {provider.phone}</p>
                          <p><strong>Address:</strong> {provider.address}</p>
                          <p><strong>Skills:</strong> {provider.skills.join(', ')}</p>
                          <p><strong>Experience:</strong> {provider.experienceYears} years</p>
                          <p><strong>Rating:</strong> {provider.rating?.average?.toFixed(1) || 'N/A'} ⭐ ({provider.rating?.totalReviews || 0} reviews)</p>
                        </div>
                      </div>
                      <div className="provider-actions">
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(provider.verificationStatus) }}
                        >
                          {provider.verificationStatus.toUpperCase()}
                        </span>
                        {provider.verificationStatus === 'pending' && (
                          <>
                            <button
                              className="btn btn-success"
                              onClick={() => handleVerifyProvider(provider._id, 'verify')}
                            >
                              Verify
                            </button>
                            <button
                              className="btn btn-danger"
                              onClick={() => handleVerifyProvider(provider._id, 'reject')}
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-data">No providers found</p>
                )}
              </div>
            )}

            {/* ==================== BOOKINGS TAB ==================== */}
            {activeTab === 'bookings' && (
              <div className="bookings-list">
                {bookings.length > 0 ? (
                  bookings.map(booking => (
                    <div key={booking._id} className="booking-card">
                      <div className="booking-header">
                        <h3>{booking.serviceType}</h3>
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getBookingStatusColor(booking.status) }}
                        >
                          {booking.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="booking-info">
                        <p><strong>Customer:</strong> {booking.customerName}</p>
                        <p><strong>Phone:</strong> {booking.customerPhone}</p>
                        <p><strong>Preferred Date/Time:</strong> {new Date(booking.preferredDateTime).toLocaleString()}</p>
                        <p><strong>Created:</strong> {new Date(booking.createdAt).toLocaleString()}</p>
                        {booking.assignedProviderId && (
                          <p><strong>Provider:</strong> {booking.assignedProviderId.name} ({booking.assignedProviderId.phone})</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-data">No bookings found</p>
                )}
              </div>
            )}

            {/* ==================== TRAINING BOOKINGS TAB ==================== */}
            {activeTab === 'training' && (
              <div className="training-bookings-list">
                {trainingBookings.length > 0 ? (
                  trainingBookings.map((b) => (
                    <div key={b._id} className="booking-card">
                      <div className="booking-header">
                        <h3>Training Request</h3>
                        <span className="status-badge" style={{ backgroundColor: '#1A2560' }}>
                          {b.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="booking-info">
                        <p><strong>Name:</strong> {b.fullName}</p>
                        <p><strong>Phone:</strong> {b.phone}</p>
                        <p><strong>Email:</strong> {b.email}</p>

                        <p><strong>Trainings:</strong>  
                          {b.trainings.map(t => t.name).join(', ')}
                        </p>

                        <p><strong>Preferred Date:</strong> 
                          {b.preferredDate ? new Date(b.preferredDate).toLocaleDateString() : 'Not specified'}
                        </p>

                        <p><strong>Message:</strong> {b.message || 'None'}</p>

                        <p><strong>Requested At:</strong> 
                          {new Date(b.createdAt).toLocaleString()}
                        </p>

                        {b.status === "pending" && (
                          <button
                            className="btn btn-success"
                            onClick={() => handleMarkTrainingDone(b._id)}
                          >
                            Mark as Done
                          </button>
                        )}

                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-data">No training bookings found</p>
                )}
              </div>
            )}

            {/* ==================== PROFIT TAB ==================== */}
            {activeTab === 'profit' && (
              <div className="profit-box">
                <h2>Total Platform Profit</h2>
                <p className="profit-amount">
                  Rs. {profitData?.totalProfit || 0}
                </p>
              </div>
            )}

          </>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard
