import { useState, useEffect } from 'react'
import api from '../utils/api'
import './ReviewModal.css'

const ReviewModal = ({ booking, onClose, onSubmitted }) => {
  const [formData, setFormData] = useState({
    stars: 5,
    comment: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [existingReview, setExistingReview] = useState(null)

  useEffect(() => {
    checkExistingReview()
  }, [booking._id])

  const checkExistingReview = async () => {
    try {
      const response = await api.get(`/reviews/booking/${booking._id}`)
      setExistingReview(response.data)
      setFormData({
        stars: response.data.stars,
        comment: response.data.comment || ''
      })
    } catch (err) {
      // No existing review — that's fine
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleStarClick = (star) => {
    setFormData(prev => ({ ...prev, stars: star }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await api.post('/reviews/create', {
        bookingId: booking._id,
        stars: parseInt(formData.stars),
        comment: formData.comment
      })
      alert('Review submitted successfully!')
      onSubmitted()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Leave a Review</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {existingReview && (
            <p className="info-message">
              You have already reviewed this booking. You can update your review.
            </p>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Rating *</label>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map(star => (
                  <span
                    key={star}
                    className={`star ${star <= formData.stars ? 'active' : ''}`}
                    onClick={() => handleStarClick(star)}
                  >
                    ⭐
                  </span>
                ))}
                <span className="rating-text">{formData.stars} out of 5</span>
              </div>
            </div>

            <div className="form-group">
              <label>Comment (Optional)</label>
              <textarea
                name="comment"
                value={formData.comment}
                onChange={handleChange}
                rows="4"
                placeholder="Share your experience..."
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ReviewModal
