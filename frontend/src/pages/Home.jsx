import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './Home.css'

const images = [
  '/src/assets/images/service1.png',
  '/src/assets/images/service2.png',
  '/src/assets/images/service3.png',
]

const Home = () => {
  const [currentImage, setCurrentImage] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length)
    }, 4000) // show each image for ~4s (includes fade)
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

      {/* SERVICES SECTION */}
      <div className="home-services">
        <div className="container">
          <h2>Our Services in Kathmandu</h2>
          <div className="services-grid">
            {[
              ['🔧', 'Plumbing', 'Expert plumbing services for leaks, installations, and repairs'],
              ['🪚', 'Carpentry', 'Professional carpentry work for furniture and fixtures'],
              ['🎨', 'Painting', 'Interior and exterior painting services'],
              ['🧱', 'Tiling', 'Floor and wall tiling installation and repair'],
              ['⚡', 'Minor Electrical', 'Electrical repairs and installations'],
              ['🏗️', 'Masonry', 'Brickwork and masonry services'],
              ['🏠', 'Roofing', 'Roof repairs and maintenance'],
              ['🔨', 'General Handyman', 'All-around handyman services for your home'],
            ].map(([icon, title, desc], i) => (
              <div key={i} className="service-card">
                <div className="service-icon">{icon}</div>
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
    </div>
  )
}

export default Home
