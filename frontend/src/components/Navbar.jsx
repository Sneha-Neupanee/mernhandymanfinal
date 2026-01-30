import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'
import logo from '../assets/logo.png' // 👈 Import the logo

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Left Section — Logo + Brand */}
        <Link to="/" className="navbar-brand">
          <img
            src={logo} // 👈 Use the imported variable
            alt="K-Handyman Logo"
            className="navbar-logo"
          />
          <span className="brand-text">
            <span className="brand-highlight">K</span>-Handyman
          </span>
        </Link>

        {/* Right Section — Links */}
        <div className="navbar-links">
          {user ? (
            <>
              {user.role === 'provider' && (
                <Link to="/provider/dashboard" className="navbar-link">
                  Dashboard
                </Link>
              )}
              {user.role === 'appointer' && (
                <>
                  <Link to="/appointer/booking" className="navbar-link">
                    Book Appointment
                  </Link>
                  <Link to="/appointer/dashboard" className="navbar-link">
                    My Bookings
                  </Link>
                </>
              )}
              {user.role === 'admin' && (
                <Link to="/admin/dashboard" className="navbar-link">
                  Admin Dashboard
                </Link>
              )}
              <button onClick={handleLogout} className="btn-logout">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/appointer/booking" className="navbar-link">
                Book Appointment
              </Link>
            </>
          )}
          <Link to="/" className="navbar-link home-link">
            Home
          </Link>
        </div>
      </div>
    </nav>
  )
}

export default Navbar