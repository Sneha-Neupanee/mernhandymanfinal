import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './Home.css'

const images = [
  '/src/assets/images/service1.png',
  '/src/assets/images/service2.png',
  '/src/assets/images/service3.png',
]

const Home = () => {
  const navigate = useNavigate()
  const [currentImage, setCurrentImage] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="home">
      {/* HERO SECTION */}
      <div className="home-hero">
        <div className="home-content">
          <h1 className="home-title">K-Handyman</h1>
          <p className="home-subtitle">Your Trusted Service Marketplace in Kathmandu</p>
          <p className="home-description">
            Connect with skilled handymen for all your home repair and maintenance needs.
            From plumbing to carpentry, we've got you covered.
          </p>

          <div className="home-buttons">
            <Link to="/provider/register" className="btn btn-primary home-btn">
              Become a Service Provider
            </Link>
            <Link to="/appointer/login" className="btn btn-primary home-btn">
              Login as Appointer
            </Link>
            <Link to="/provider/login" className="btn btn-primary home-btn">
              Login as Provider
            </Link>
            <Link to="/admin/login" className="btn btn-primary home-btn">
              Admin Login
            </Link>
          </div>

          <div style={{ marginTop: '30px' }}>
            <Link
              to="/appointer/booking"
              className="btn btn-secondary home-btn"
              style={{ maxWidth: '300px' }}
            >
              📅 Book an Appointment Now
            </Link>
          </div>
        </div>

        {/* IMAGE SLIDER */}
        <div className="home-image">
          <div className="image-slider">
            {images.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`K-Handyman service ${index + 1}`}
                className={`slider-image ${index === currentImage ? 'active' : ''}`}
              />
            ))}
            <div className="image-caption">Kathmandu Handyman Services</div>
          </div>
        </div>
      </div>

      {/* SERVICES SECTION (UPDATED WITH BIG IMAGES) */}
      <div className="home-services">
        <div className="container">
          <h2>Our Services in Kathmandu</h2>

          <div className="services-grid">
            {[
              ['/src/assets/services/plumbing.png', 'Plumbing', 'Expert plumbing services for leaks, installations, and repairs'],
              ['/src/assets/services/carpentry.png', 'Carpentry', 'Professional carpentry work for furniture and fixtures'],
              ['/src/assets/services/painting.png', 'Painting', 'Interior and exterior painting services'],
              ['/src/assets/services/tiling.png', 'Tiling', 'Floor and wall tiling installation and repair'],
              ['/src/assets/services/electrical.png', 'Minor Electrical', 'Electrical repairs and installations'],
              ['/src/assets/services/masonry.png', 'Masonry', 'Brickwork and masonry services'],
              ['/src/assets/services/roofing.png', 'Roofing', 'Roof repairs and maintenance'],
              ['/src/assets/services/handyman.png', 'General Handyman', 'All-around handyman services for your home'],
            ].map(([img, title, desc], i) => (
              <div key={i} className="service-card">

                {/* BIG IMAGE BOX */}
                <div className="service-image-box">
                  <img src={img} alt={title} className="service-image" />
                </div>

                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* FEATURES SECTION */}
      <div className="home-features">
        <div className="container">
          <h2>Why Choose K-Handyman?</h2>
          <div className="features-grid">
            {[
              ['🔧', 'Skilled Professionals', 'Verified and experienced service providers'],
              ['⭐', 'Rating System', 'Transparent reviews and ratings'],
              ['📱', 'Easy Booking', 'Simple and quick appointment booking'],
              ['🏠', 'Local Service', 'Serving Kathmandu with local expertise'],
            ].map(([icon, title, desc], i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon">{icon}</div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TRAINING SECTION */}
      <div className="training-wrapper">
        <div
          className="training-card"
          onClick={() => navigate('/training')}
        >
          <h3 className="training-title">Get Training</h3>
          <p className="training-sub">
            Become a skilled professional. Choose from 9 hands-on technical trainings.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Home
