import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api, { API_ORIGIN } from '../utils/api'
import ReviewModal from '../components/ReviewModal'
import ChatWindow from '../components/ChatWindow'
import { showNotification } from '../components/NotificationSystem'
import './Dashboard.css'

const AppointerDashboard = () => {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showReviewModal, setShowReviewModal] = useState(false)

  const [selectedBookingForChat, setSelectedBookingForChat] = useState(null)

  /* ⭐ NEW STATE — price input popup */
  const [showPricePopup, setShowPricePopup] = useState(false)
  const [priceInput, setPriceInput] = useState("")
  const [bookingToComplete, setBookingToComplete] = useState(null)

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      const response = await api.get('/bookings/appointer')
      setBookings(response.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  /* ⭐ User clicks “Mark as Completed” → open popup */
  const handleCompleteBooking = (booking) => {
    setBookingToComplete(booking)
    setShowPricePopup(true)
  }

  /* ⭐ Submit price to backend */
  const handleSubmitPrice = async () => {
    if (!priceInput || Number(priceInput) <= 0) {
      return showNotification({
        title: "Invalid Amount",
        message: "Please enter a valid price.",
        type: "error"
      })
    }

    try {
      await api.put(`/bookings/${bookingToComplete._id}/complete-with-price`, {
        pricePaid: Number(priceInput)   // ⭐ FIXED HERE
      })

      showNotification({
        title: "Success",
        message: "Amount saved. You can now leave a review.",
        type: "success"
      })

      setShowPricePopup(false)
      setPriceInput("")
      setBookingToComplete(null)

      fetchBookings()
    } catch (err) {
      showNotification({
        title: "Error",
        message: err.response?.data?.message || "Failed to complete booking",
        type: "error"
      })
    }
  }

  const handleLeaveReview = (booking) => {
    setSelectedBooking(booking)
    setShowReviewModal(true)
  }

  const handleReviewSubmitted = () => {
    setShowReviewModal(false)
    setSelectedBooking(null)
    fetchBookings()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ffc107'
      case 'confirmed': return '#28a745'
      case 'completed': return '#17a2b8'
      case 'rejected': return '#dc3545'
      default: return '#6c757d'
    }
  }

  if (loading) return <div className="dashboard-loading">Loading...</div>
  if (error) return <div className="dashboard-error">{error}</div>

  return (
    <div className="dashboard">
      <div className="container">
        <h1 className="dashboard-title">My Bookings</h1>
        <p className="dashboard-subtitle">Welcome, {user?.name || user?.phone}!</p>

        {bookings.length > 0 ? (
          <div className="bookings-list">
            {bookings.map(booking => (
              <div key={booking._id} className="booking-card">
                
                <div className="booking-header">
                  <h3>{booking.serviceType}</h3>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(booking.status) }}
                  >
                    {booking.status.toUpperCase()}
                  </span>
                </div>

                <div className="booking-info">
                  <p><strong>Preferred Date/Time:</strong> {new Date(booking.preferredDateTime).toLocaleString()}</p>
                  <p><strong>Created:</strong> {new Date(booking.createdAt).toLocaleString()}</p>

                  {booking.assignedProviderId && (
                    <div className="provider-info">
                      <p><strong>Assigned Provider:</strong> {booking.assignedProviderId.name}</p>
                      <p><strong>Provider Phone:</strong> {booking.assignedProviderId.phone}</p>
                      <p><strong>Provider Rating:</strong> {booking.assignedProviderId.rating?.average?.toFixed(1) || 'N/A'} ⭐</p>

                      {booking.providerStatus && booking.status === 'confirmed' && (
                        <p>
                          <strong>Provider Status:</strong>
                          <span className="provider-status-badge"
                            style={{
                              marginLeft: '8px',
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '600',
                              backgroundColor:
                                booking.providerStatus === 'on-route' ? '#ffc107' :
                                booking.providerStatus === 'arrived' ? '#17a2b8' :
                                booking.providerStatus === 'working' ? '#28a745' :
                                '#6c757d',
                              color: 'white'
                            }}
                          >
                            {booking.providerStatus.replace('-', ' ').toUpperCase()}
                          </span>
                        </p>
                      )}
                    </div>
                  )}

                  {booking.serviceRequestPhotoUrl && (
                    <img 
                      src={`${API_ORIGIN}${booking.serviceRequestPhotoUrl}`} 
                      alt="Service Request" 
                      className="service-photo"
                    />
                  )}
                </div>

                <div className="booking-actions">

                  {/* ⭐ BEFORE entering price */}
                  {booking.status === "confirmed" && !booking.pricePaidByCustomer && (
                    <>
                      <button
                        className="btn btn-chat"
                        onClick={() => setSelectedBookingForChat(booking)}
                      >
                        💬 Chat Now
                      </button>

                      <button
                        className="btn btn-success"
                        onClick={() => handleCompleteBooking(booking)}
                      >
                        Mark as Completed
                      </button>
                    </>
                  )}

                  {/* ⭐ AFTER entering price → show Review button */}
                  {booking.status === "completed" && booking.canReview && !booking.reviewSubmitted && (
                    <>
                      <button
                        className="btn btn-chat"
                        onClick={() => setSelectedBookingForChat(booking)}
                      >
                        💬 Chat Now
                      </button>

                      <button
                        className="btn btn-primary"
                        onClick={() => handleLeaveReview(booking)}
                      >
                        Leave Review
                      </button>
                    </>
                  )}

                </div>

              </div>
            ))}
          </div>
        ) : (
          <p className="no-data">No bookings found. <a href="/appointer/booking">Book an appointment</a></p>
        )}

        {/* ⭐ Review Modal */}
        {showReviewModal && selectedBooking && (
          <ReviewModal
            booking={selectedBooking}
            onClose={() => setShowReviewModal(false)}
            onSubmitted={handleReviewSubmitted}
          />
        )}

        {/* ⭐ Chat Modal */}
        {selectedBookingForChat && (
          <div className="chat-modal-overlay" onClick={() => setSelectedBookingForChat(null)}>
            <div className="chat-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="chat-modal-header">
                <h2>Chat with {selectedBookingForChat.assignedProviderId?.name || 'Provider'}</h2>
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

        {/* ⭐ PRICE INPUT POPUP */}
        {showPricePopup && (
          <div className="popup-overlay">
            <div className="popup-box">
              <h2>Enter Amount Paid</h2>
              <p>Please enter the total amount you paid to the service provider.</p>

              <input
                type="number"
                className="popup-input"
                placeholder="Amount in Rs."
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
              />

              <div className="popup-actions">
                <button className="btn btn-success" onClick={handleSubmitPrice}>
                  Submit Amount
                </button>

                <button className="btn btn-danger" onClick={() => setShowPricePopup(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default AppointerDashboard
