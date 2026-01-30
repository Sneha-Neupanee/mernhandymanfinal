import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { API_ORIGIN } from '../utils/api'
import MapLocationPicker from '../components/MapLocationPicker'
import { showNotification } from '../components/NotificationSystem'
import './FormPage.css'

const SERVICE_TYPES = [
  'Plumbing',
  'Carpentry',
  'Painting',
  'Tiling',
  'Minor Electrical',
  'Masonry',
  'Roofing',
  'Flooring',
  'General Handyman'
]

const AppointerBooking = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    password: '',
    serviceType: '',
    preferredDateTime: ''
  })
  const [serviceRequestPhoto, setServiceRequestPhoto] = useState(null)
  const [serviceLocation, setServiceLocation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [matchedProviders, setMatchedProviders] = useState([])
  const [showProviders, setShowProviders] = useState(false)
  const [bookingId, setBookingId] = useState(null)
  const [sortBy, setSortBy] = useState('matchScore') // matchScore, rating, distance
  const [filterRating, setFilterRating] = useState('all') // all, 4+, 3+

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handlePhotoChange = (e) => {
    setServiceRequestPhoto(e.target.files[0])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = new FormData()
      data.append('customerName', formData.customerName)
      data.append('customerPhone', formData.customerPhone)
      data.append('password', formData.password)
      data.append('serviceType', formData.serviceType)
      data.append('preferredDateTime', formData.preferredDateTime)

      if (serviceRequestPhoto) {
        data.append('serviceRequestPhoto', serviceRequestPhoto)
      }

      if (serviceLocation) {
        data.append('serviceLocation', JSON.stringify(serviceLocation))
      }

      const response = await api.post('/bookings/create', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      setBookingId(response.data.booking.id)
      
      // Get matched providers with service location
      const matchResponse = await api.post('/match/service', {
        serviceType: formData.serviceType,
        limit: 20,
        serviceLocation: serviceLocation ? {
          latitude: serviceLocation.latitude,
          longitude: serviceLocation.longitude
        } : null
      })

      setMatchedProviders(matchResponse.data.providers)
      setShowProviders(true)
      
      showNotification({
        title: 'Booking Created',
        message: 'Your booking has been created. Select a provider below.',
        type: 'success'
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed')
    } finally {
      setLoading(false)
    }
  }

  const handleRequestProvider = async (providerId) => {
    try {
      await api.post('/match/request-provider', {
        bookingId,
        providerId
      })
      showNotification({
        title: 'Provider Requested',
        message: 'Provider requested successfully! The provider will be notified.',
        type: 'success'
      })
      navigate('/appointer/login')
    } catch (err) {
      showNotification({
        title: 'Error',
        message: err.response?.data?.message || 'Failed to request provider',
        type: 'error'
      })
    }
  }

  // Sort and filter providers
  const getSortedAndFilteredProviders = () => {
    let filtered = [...matchedProviders]

    // Filter by rating
    if (filterRating === '4+') {
      filtered = filtered.filter(p => (p.rating?.average || 0) >= 4)
    } else if (filterRating === '3+') {
      filtered = filtered.filter(p => (p.rating?.average || 0) >= 3)
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'rating') {
        return (b.rating?.average || 0) - (a.rating?.average || 0)
      } else if (sortBy === 'distance') {
        if (a.distance === null && b.distance === null) return 0
        if (a.distance === null) return 1
        if (b.distance === null) return -1
        return a.distance - b.distance
      } else {
        // matchScore (default)
        return (b.matchScore || 0) - (a.matchScore || 0)
      }
    })

    return filtered
  }

  if (showProviders) {
    return (
      <div className="form-page">
        <div className="form-container" style={{ maxWidth: '800px' }}>
          <h2>Select a Service Provider</h2>
          <p className="form-subtitle">Choose from the best-matched providers for your service</p>

          {matchedProviders.length > 0 && (
            <div className="filter-sort-controls" style={{ marginBottom: '20px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '150px' }}>
                <label style={{ fontSize: '14px' }}>Sort By:</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: '8px' }}>
                  <option value="matchScore">Best Match</option>
                  <option value="rating">Highest Rating</option>
                  <option value="distance">Nearest First</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '150px' }}>
                <label style={{ fontSize: '14px' }}>Filter Rating:</label>
                <select value={filterRating} onChange={(e) => setFilterRating(e.target.value)} style={{ padding: '8px' }}>
                  <option value="all">All Ratings</option>
                  <option value="4+">4+ Stars</option>
                  <option value="3+">3+ Stars</option>
                </select>
              </div>
            </div>
          )}

          {getSortedAndFilteredProviders().length > 0 ? (
            <div className="providers-list">
              {getSortedAndFilteredProviders().map(provider => (
                <div key={provider._id} className="provider-card">
                  <div className="provider-info">
                    {provider.profilePhotoUrl && (
                      <img 
                        src={`${API_ORIGIN}${provider.profilePhotoUrl}`} 
                        alt={provider.name}
                        className="provider-photo"
                      />
                    )}
                    <div>
                      <h3>{provider.name}</h3>
                      <p><strong>Phone:</strong> {provider.phone}</p>
                      <p><strong>Skills:</strong> {provider.skills.join(', ')}</p>
                      <p><strong>Experience:</strong> {provider.experienceYears} years</p>
                      <p><strong>Rating:</strong> {provider.rating?.average?.toFixed(1) || 'N/A'} ⭐ ({provider.rating?.totalReviews || 0} reviews)</p>
                      <p><strong>Match Score:</strong> {provider.matchScore?.toFixed(2) || 'N/A'}</p>
                      {provider.distance !== null && (
                        <p><strong>Distance:</strong> {provider.distance.toFixed(1)} km</p>
                      )}
                    </div>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleRequestProvider(provider._id)}
                  >
                    Request This Provider
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No providers available for this service type</p>
          )}

          <button
            className="btn btn-secondary"
            onClick={() => navigate('/appointer/login')}
            style={{ marginTop: '20px' }}
          >
            Continue to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="form-page">
      <div className="form-container">
        <h2>Book an Appointment</h2>
        <p className="form-subtitle">Fill in the details to book a service</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Your Name *</label>
            <input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Phone Number *</label>
            <input
              type="tel"
              name="customerPhone"
              value={formData.customerPhone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
            />
            <small style={{ color: '#666', fontSize: '14px' }}>
              Use this password to login later
            </small>
          </div>

          <div className="form-group">
            <label>Service Type *</label>
            <select
              name="serviceType"
              value={formData.serviceType}
              onChange={handleChange}
              required
            >
              <option value="">Select a service</option>
              {SERVICE_TYPES.map(service => (
                <option key={service} value={service}>{service}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Preferred Date & Time *</label>
            <input
              type="datetime-local"
              name="preferredDateTime"
              value={formData.preferredDateTime}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Photo of Issue (Optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
            />
          </div>

          <div className="form-group">
            <label>Service Location (Optional)</label>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
              Select your service location on the map (Kathmandu only)
            </p>
            <MapLocationPicker
              onLocationSelect={setServiceLocation}
              readOnly={false}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating Booking...' : 'Create Booking'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AppointerBooking

