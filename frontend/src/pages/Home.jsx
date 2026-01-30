import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './Home.css'

// IMPORT YOUR IMAGES
import service1 from '../assets/images/service1.png'
import service2 from '../assets/images/service2.png'
import service3 from '../assets/images/service3.png'

import plumbing from '../assets/services/plumbing.png'
import carpentry from '../assets/services/carpentry.png'
import painting from '../assets/services/painting.png'
import tiling from '../assets/services/tiling.png'
import electrical from '../assets/services/electrical.png'
import masonry from '../assets/services/masonry.png'
import roofing from '../assets/services/roofing.png'
import handyman from '../assets/services/handyman.png'

const images = [service1, service2, service3] // Use the imports

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
              [plumbing, 'Plumbing', 'Expert plumbing services for leaks, installations, and repairs'],
              [carpentry, 'Carpentry', 'Professional carpentry work for furniture and fixtures'],
              [painting, 'Painting', 'Interior and exterior painting services'],
              [tiling, 'Tiling', 'Floor and wall tiling installation and repair'],
              [electrical, 'Minor Electrical', 'Electrical repairs and installations'],
              [masonry, 'Masonry', 'Brickwork and masonry services'],
              [roofing, 'Roofing', 'Roof repairs and maintenance'],
              [handyman, 'General Handyman', 'All-around handyman services for your home'],
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