import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import './Dashboard.css'

const AdminDashboard = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('statistics')
  const [statistics, setStatistics] = useState(null)
  const [providers, setProviders] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (activeTab === 'statistics') {
      fetchStatistics()
    } else if (activeTab === 'providers') {
      fetchProviders()
    } else if (activeTab === 'bookings') {
      fetchBookings()
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

  const handleVerifyProvider = async (providerId, action) => {
    try {
      await api.put(`/admin/providers/${providerId}/verify`, { action })
      alert(`Provider ${action}ed successfully`)
      fetchProviders()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to verify provider')
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

  return (
    <div className="dashboard">
      <div className="container">
        <h1 className="dashboard-title">Admin Dashboard</h1>
        <p className="dashboard-subtitle">Welcome, {user?.username}!</p>

        <div className="tabs">
          <button
            className={`tab ${activeTab === 'statistics' ? 'active' : ''}`}
            onClick={() => setActiveTab('statistics')}
          >
            Statistics
          </button>
          <button
            className={`tab ${activeTab === 'providers' ? 'active' : ''}`}
            onClick={() => setActiveTab('providers')}
          >
            Providers
          </button>
          <button
            className={`tab ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            Bookings
          </button>
        </div>

        {loading ? (
          <div className="dashboard-loading">Loading...</div>
        ) : (
          <>
            {activeTab === 'statistics' && statistics && (
              <div className="statistics-grid">
                <div className="stat-card">
                  <h3>Total Service Providers</h3>
                  <p className="stat-number">{statistics.providers.total}</p>
                  <div className="stat-details">
                    <span>Verified: {statistics.providers.verified}</span>
                    <span>Pending: {statistics.providers.pending}</span>
                    <span>Rejected: {statistics.providers.rejected}</span>
                  </div>
                </div>

                <div className="stat-card">
                  <h3>Total Appointers</h3>
                  <p className="stat-number">{statistics.appointers.total}</p>
                </div>

                <div className="stat-card">
                  <h3>Total Appointments</h3>
                  <p className="stat-number">{statistics.appointments.total}</p>
                  <div className="stat-details">
                    <span>Pending: {statistics.appointments.pending}</span>
                    <span>Confirmed: {statistics.appointments.confirmed}</span>
                    <span>Completed: {statistics.appointments.completed}</span>
                  </div>
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
            )}

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
          </>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard

