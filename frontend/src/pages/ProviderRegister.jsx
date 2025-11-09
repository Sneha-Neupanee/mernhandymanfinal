import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
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

const ProviderRegister = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    skills: [],
    experienceYears: '',
    address: ''
  })
  const [profilePhoto, setProfilePhoto] = useState(null)
  const [portfolioPhotos, setPortfolioPhotos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSkillToggle = (skill) => {
    setFormData(prev => {
      const skills = prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
      return { ...prev, skills }
    })
  }

  const handleProfilePhotoChange = (e) => {
    setProfilePhoto(e.target.files[0])
  }

  const handlePortfolioPhotosChange = (e) => {
    setPortfolioPhotos(Array.from(e.target.files))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (formData.skills.length === 0) {
      setError('Please select at least one service skill')
      setLoading(false)
      return
    }

    try {
      const data = new FormData()
      data.append('name', formData.name)
      data.append('phone', formData.phone)
      data.append('password', formData.password)
      data.append('skills', formData.skills.join(','))
      data.append('experienceYears', formData.experienceYears)
      data.append('address', formData.address)

      if (profilePhoto) {
        data.append('profilePhoto', profilePhoto)
      }

      portfolioPhotos.forEach((photo, index) => {
        data.append('portfolioPhotos', photo)
      })

      const response = await api.post('/providers/register', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      alert('Registration successful! Waiting for admin verification.')
      navigate('/provider/login')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form-page">
      <div className="form-container">
        <h2>Become a Service Provider</h2>
        <p className="form-subtitle">Join K-Handyman and start offering your services</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Phone Number *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
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
          </div>

          <div className="form-group">
            <label>Services/Skills *</label>
            <div className="skills-grid">
              {SERVICE_TYPES.map(skill => (
                <label key={skill} className="skill-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.skills.includes(skill)}
                    onChange={() => handleSkillToggle(skill)}
                  />
                  <span>{skill}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Years of Experience *</label>
            <input
              type="number"
              name="experienceYears"
              value={formData.experienceYears}
              onChange={handleChange}
              required
              min="0"
            />
          </div>

          <div className="form-group">
            <label>Address *</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Profile Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleProfilePhotoChange}
            />
          </div>

          <div className="form-group">
            <label>Portfolio Photos (Example Works)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePortfolioPhotosChange}
            />
            {portfolioPhotos.length > 0 && (
              <p className="file-info">{portfolioPhotos.length} file(s) selected</p>
            )}
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ProviderRegister

