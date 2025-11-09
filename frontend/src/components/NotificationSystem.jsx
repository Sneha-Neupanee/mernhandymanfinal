import { useState, useEffect } from 'react'
import './NotificationSystem.css'

/**
 * Notification System Component
 * Displays toast notifications for booking status updates, messages, etc.
 */
const NotificationSystem = () => {
  const [notifications, setNotifications] = useState([])

  // Listen for custom notification events
  useEffect(() => {
    const handleNotification = (event) => {
      addNotification(event.detail)
    }

    window.addEventListener('show-notification', handleNotification)

    return () => {
      window.removeEventListener('show-notification', handleNotification)
    }
  }, [])

  const addNotification = (notification) => {
    const id = Date.now()
    const newNotification = {
      id,
      ...notification,
      type: notification.type || 'info' // success, error, warning, info
    }

    setNotifications(prev => [...prev, newNotification])

    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeNotification(id)
    }, 5000)
  }

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return '✓'
      case 'error':
        return '✕'
      case 'warning':
        return '⚠'
      default:
        return 'ℹ'
    }
  }

  return (
    <div className="notification-container">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`notification notification-${notification.type}`}
          onClick={() => removeNotification(notification.id)}
        >
          <div className="notification-icon">
            {getNotificationIcon(notification.type)}
          </div>
          <div className="notification-content">
            <p className="notification-title">{notification.title || 'Notification'}</p>
            {notification.message && (
              <p className="notification-message">{notification.message}</p>
            )}
          </div>
          <button
            className="notification-close"
            onClick={(e) => {
              e.stopPropagation()
              removeNotification(notification.id)
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}

/**
 * Helper function to show notifications
 * Usage: showNotification({ title: 'Success', message: 'Booking confirmed!', type: 'success' })
 */
export const showNotification = (notification) => {
  const event = new CustomEvent('show-notification', {
    detail: notification
  })
  window.dispatchEvent(event)
}

export default NotificationSystem

