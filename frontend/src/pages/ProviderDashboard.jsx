import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api, { API_ORIGIN } from '../utils/api'
import ChatWindow from '../components/ChatWindow'
import MapLocationPicker from '../components/MapLocationPicker'
import { showNotification } from '../components/NotificationSystem'
import './Dashboard.css'

const ProviderDashboard = () => {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('bookings')
  const [chats, setChats] = useState([])
  const [selectedBookingForChat, setSelectedBookingForChat] = useState(null)
  const [confirmedBookings, setConfirmedBookings] = useState([])

  // 🔹 Fetch data once on mount
  useEffect(() => {
    fetchDashboardData()
  }, [])

  // 🔹 Fetch chats or confirmed bookings when tab or verification changes
  useEffect(() => {
    if (dashboardData?.provider?.verificationStatus === 'verified') {
      if (activeTab === 'messages') fetchChats()
      if (activeTab === 'bookings') fetchConfirmedBookings()
    }
  }, [activeTab, dashboardData])

  // 🔹 Keep confirmed bookings synced
  useEffect(() => {
    if (dashboardData?.confirmedBookings) {
      setConfirmedBookings(dashboardData.confirmedBookings)
    }
  }, [dashboardData?.confirmedBookings])

  // ---------- FUNCTIONS ----------
  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/providers/dashboard')
      setDashboardData(response.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const fetchChats = async () => {
    try {
      const response = await api.get('/chat/provider')
      setChats(response.data)
    } catch (err) {
      console.error('Failed to fetch chats:', err)
    }
  }

  const fetchConfirmedBookings = async () => {
    if (dashboardData?.confirmedBookings) {
      setConfirmedBookings(dashboardData.confirmedBookings)
    }
  }

  const handleBookingResponse = async (bookingId, action) => {
    try {
      await api.put(`/providers/bookings/${bookingId}/respond`, { action })
      showNotification({
        title: 'Success',
        message: `Booking ${action}ed successfully`,
        type: 'success',
      })
      fetchDashboardData()
      if (action === 'accept') {
        fetchConfirmedBookings()
        fetchChats()
      }
    } catch (err) {
      showNotification({
        title: 'Error',
        message: err.response?.data?.message || 'Failed to respond to booking',
        type: 'error',
      })
    }
  }

  // ---------- CONDITIONAL STATES ----------
  if (loading) return <div className="dashboard-loading">Loading...</div>
  if (error) return <div className="dashboard-error">{error}</div>

  const provider = dashboardData?.provider
  const pendingBookings = dashboardData?.pendingBookings || []

  return (
    <div className="dashboard">
      <div className="container">
        <h1 className="dashboard-title">Provider Dashboard</h1>

        {/* ========== STATUS ALERTS ========== */}
        {!provider && (
          <div className="alert alert-info">
            <h3>Loading Provider Info...</h3>
            <p>Please wait while we load your account details.</p>
          </div>
        )}

        {provider?.verificationStatus === 'pending' && (
          <div className="alert alert-warning">
            <h3>Waiting for Admin Verification</h3>
            <p>Your account is pending verification. You’ll be able to accept bookings once verified.</p>
          </div>
        )}

        {provider?.verificationStatus === 'rejected' && (
          <div className="alert alert-danger">
            <h3>Account Verification Rejected</h3>
            <p>Your verification has been rejected. Please contact admin for more information.</p>
          </div>
        )}

        {provider?.verificationStatus === 'verified' && (
          <>
            {/* ---------- PROFILE SECTION ---------- */}
            <div className="dashboard-header">
              <div className="profile-card">
                {provider.profilePhotoUrl && (
                  <img
                    src={`${API_ORIGIN}${provider.profilePhotoUrl}`}
                    alt="Profile"
                    className="profile-photo"
                  />
                )}
                <div>
                  <h2>{provider.name}</h2>
                  <p><strong>Phone:</strong> {provider.phone}</p>
                  <p><strong>Address:</strong> {provider.address}</p>
                  <p><strong>Experience:</strong> {provider.experienceYears} years</p>
                  <p><strong>Skills:</strong> {provider.skills?.join(', ')}</p>
                  <p><strong>Rating:</strong> {provider.rating?.average?.toFixed(1) || 'N/A'} ⭐ ({provider.rating?.totalReviews || 0} reviews)</p>
                  <p><strong>Jobs Completed:</strong> {provider.jobsCompleted || 0}</p>
                </div>
              </div>
            </div>

            {/* ---------- TABS ---------- */}
            <div className="tabs">
              <button
                className={`tab ${activeTab === 'bookings' ? 'active' : ''}`}
                onClick={() => setActiveTab('bookings')}
              >
                Bookings
              </button>
              <button
                className={`tab ${activeTab === 'messages' ? 'active' : ''}`}
                onClick={() => setActiveTab('messages')}
              >
                Messages{' '}
                {chats.length > 0 && chats.some(c => c.unreadCount > 0) && (
                  <span className="unread-badge">
                    {chats.reduce((sum, c) => sum + c.unreadCount, 0)}
                  </span>
                )}
              </button>
            </div>

            {/* ---------- BOOKINGS TAB ---------- */}
            {activeTab === 'bookings' && (
              <>
                {/* Pending Bookings */}
                <div className="dashboard-section">
                  <h2>Pending Booking Requests</h2>
                  {pendingBookings.length > 0 ? (
                    <div className="bookings-list">
                      {pendingBookings.map(booking => (
                        <div key={booking._id} className="booking-card">
                          <div className="booking-info">
                            <h3>{booking.serviceType}</h3>
                            <p><strong>Customer:</strong> {booking.customerName}</p>
                            <p><strong>Phone:</strong> {booking.customerPhone}</p>
                            <p><strong>Preferred Date/Time:</strong> {new Date(booking.preferredDateTime).toLocaleString()}</p>
                            {booking.serviceRequestPhotoUrl && (
                              <img
                                src={`${API_ORIGIN}${booking.serviceRequestPhotoUrl}`}
                                alt="Service Request"
                                className="service-photo"
                              />
                            )}
                          </div>
                          <div className="booking-actions">
                            <button
                              className="btn btn-success"
                              onClick={() => handleBookingResponse(booking._id, 'accept')}
                            >
                              Accept
                            </button>
                            <button
                              className="btn btn-danger"
                              onClick={() => handleBookingResponse(booking._id, 'reject')}
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-data">No pending bookings</p>
                  )}
                </div>

                {/* Confirmed Bookings */}
                <div className="dashboard-section">
                  <h2>Confirmed Bookings</h2>
                  {confirmedBookings.length > 0 ? (
                    <div className="bookings-list">
                      {confirmedBookings.map(booking => (
                        <div key={booking._id} className="booking-card">
                          <div className="booking-header">
                            <h3>{booking.serviceType}</h3>
                            <span
                              className="status-badge"
                              style={{
                                backgroundColor:
                                  booking.status === 'confirmed'
                                    ? '#28a745'
                                    : '#17a2b8',
                              }}
                            >
                              {booking.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="booking-info">
                            <p><strong>Customer:</strong> {booking.customerName}</p>
                            <p><strong>Phone:</strong> {booking.customerPhone}</p>
                            <p><strong>Date/Time:</strong> {new Date(booking.preferredDateTime).toLocaleString()}</p>

                            {booking.serviceLocation && (
                              <div className="location-section">
                                <p><strong>Service Location:</strong> {booking.serviceLocation.addressText || 'Location set'}</p>
                                <MapLocationPicker
                                  initialLocation={booking.serviceLocation}
                                  readOnly={true}
                                />
                                <a
                                  href={`https://www.google.com/maps/dir/?api=1&destination=${booking.serviceLocation.latitude},${booking.serviceLocation.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-primary"
                                  style={{ marginTop: '10px' }}
                                >
                                  Navigate
                                </a>
                              </div>
                            )}
                          </div>

                          <div className="booking-actions">
                            <button
                              className="btn btn-chat"
                              onClick={() => setSelectedBookingForChat(booking)}
                            >
                              💬 Chat Now
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-data">No confirmed bookings</p>
                  )}
                </div>
              </>
            )}

            {/* ---------- MESSAGES TAB ---------- */}
            {activeTab === 'messages' && (
              <div className="dashboard-section">
                <h2>Messages</h2>
                {chats.length > 0 ? (
                  <div className="chats-list">
                    {chats.map((chat, i) => (
                      <div
                        key={i}
                        className="chat-item-card"
                        onClick={async () => {
                          try {
                            const res = await api.get(`/bookings/${chat.booking._id}`)
                            setSelectedBookingForChat(res.data)
                          } catch {
                            const booking = {
                              _id: chat.booking._id,
                              serviceType: chat.booking.serviceType,
                              customerName: chat.booking.customerName,
                              status: chat.booking.status,
                              assignedProviderId: {
                                name: dashboardData?.provider?.name || 'Provider',
                              },
                            }
                            setSelectedBookingForChat(booking)
                          }
                        }}
                      >
                        <div className="chat-item-header">
                          <h3>{chat.booking.customerName}</h3>
                          {chat.unreadCount > 0 && (
                            <span className="unread-badge">{chat.unreadCount}</span>
                          )}
                        </div>
                        <p className="chat-item-service">{chat.booking.serviceType}</p>
                        {chat.lastMessage && (
                          <>
                            <p className="chat-item-preview">{chat.lastMessage.messageText}</p>
                            <p className="chat-item-time">
                              {new Date(chat.lastMessage.timestamp).toLocaleString()}
                            </p>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-data">No messages yet</p>
                )}
              </div>
            )}

            {/* ---------- CHAT MODAL ---------- */}
            {selectedBookingForChat && (
              <div className="chat-modal-overlay" onClick={() => setSelectedBookingForChat(null)}>
                <div
                  className="chat-modal-content"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="chat-modal-header">
                    <h2>
                      Chat with{' '}
                      {selectedBookingForChat.customerName ||
                        selectedBookingForChat.assignedProviderId?.name ||
                        'Customer'}
                    </h2>
                    <button
                      className="chat-modal-close"
                      onClick={() => setSelectedBookingForChat(null)}
                    >
                      ×
                    </button>
                  </div>
                  <ChatWindow
                    bookingId={selectedBookingForChat._id}
                    booking={selectedBookingForChat}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default ProviderDashboard
