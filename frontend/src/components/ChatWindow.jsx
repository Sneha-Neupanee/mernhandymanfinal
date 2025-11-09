import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import './ChatWindow.css'

/**
 * ChatWindow Component
 * Real-time chat between Appointer and Service Provider
 * Only available for confirmed bookings
 * 
 * @param {string} bookingId - ID of the booking
 * @param {Object} booking - Booking object with provider info
 */
const ChatWindow = ({ bookingId, booking }) => {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!bookingId || !user) return

    const token = localStorage.getItem('token')
    if (!token) return

    // Connect to Socket.IO server
    const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000'
    const socketConnection = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    })

    socketConnection.on('connect', () => {
      console.log('Socket connected')
      setConnected(true)
      
      // Join booking room
      socketConnection.emit('join-booking', bookingId)
    })

    socketConnection.on('joined-booking', () => {
      console.log('Joined booking room')
      // Load chat history
      loadChatHistory()
    })

    socketConnection.on('new-message', (message) => {
      setMessages(prev => [...prev, message])
      // Mark as read if we're the receiver
      const isReceiver = (user.role === 'appointer' && message.receiverRole === 'appointer') ||
                        (user.role === 'provider' && message.receiverRole === 'provider')
      if (isReceiver) {
        markAsRead()
      }
    })

    socketConnection.on('error', (error) => {
      console.error('Socket error:', error)
      alert(error.message || 'Chat connection error')
    })

    socketConnection.on('disconnect', () => {
      console.log('Socket disconnected')
      setConnected(false)
    })

    setSocket(socketConnection)

    return () => {
      socketConnection.disconnect()
    }
  }, [bookingId, user])

  // Load chat history
  const loadChatHistory = async () => {
    try {
      const response = await api.get(`/chat/booking/${bookingId}`)
      setMessages(response.data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load chat history:', error)
      setLoading(false)
    }
  }

  // Mark messages as read
  const markAsRead = async () => {
    try {
      await api.put(`/chat/booking/${bookingId}/read`)
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  // Send message
  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !socket || !connected) return

    socket.emit('send-message', {
      bookingId,
      messageText: newMessage.trim()
    })

    setNewMessage('')
  }

  // Check if message is from current user
  const isMyMessage = (message) => {
    if (user.role === 'appointer') {
      return message.senderRole === 'appointer'
    } else {
      return message.senderRole === 'provider'
    }
  }

  // Get sender name
  const getSenderName = (message) => {
    if (isMyMessage(message)) {
      return 'You'
    } else {
      if (user.role === 'appointer') {
        return booking?.assignedProviderId?.name || 'Provider'
      } else {
        return booking?.customerName || 'Customer'
      }
    }
  }

  // Get sender initials
  const getSenderInitials = (message) => {
    const name = getSenderName(message)
    if (name === 'You') return 'Y'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  }

  if (loading) {
    return <div className="chat-loading">Loading chat...</div>
  }

  if (!booking || booking.status !== 'confirmed' && booking.status !== 'completed') {
    return (
      <div className="chat-disabled">
        <p>Chat is only available for confirmed bookings.</p>
      </div>
    )
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="chat-avatar">
            {user.role === 'appointer' && booking?.assignedProviderId?.profilePhotoUrl ? (
              <img 
                src={`http://localhost:5000${booking.assignedProviderId.profilePhotoUrl}`} 
                alt="Provider"
              />
            ) : (
              <span>{user.role === 'appointer' ? (booking?.assignedProviderId?.name?.[0] || 'P') : (booking?.customerName?.[0] || 'C')}</span>
            )}
          </div>
          <div>
            <h3>{user.role === 'appointer' ? (booking.assignedProviderId?.name || 'Provider') : (booking.customerName || 'Customer')}</h3>
            <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
              {connected ? '● Online' : '○ Offline'}
            </div>
          </div>
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="no-messages">
            <div className="no-messages-icon">💬</div>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const showAvatar = index === 0 || messages[index - 1].senderRole !== message.senderRole
            return (
              <div
                key={message._id}
                className={`message ${isMyMessage(message) ? 'my-message' : 'other-message'} ${showAvatar ? 'show-avatar' : ''}`}
              >
                {!isMyMessage(message) && showAvatar && (
                  <div className="message-avatar">
                    <span>{getSenderInitials(message)}</span>
                  </div>
                )}
                <div className="message-content-wrapper">
                  {!isMyMessage(message) && showAvatar && (
                    <div className="message-sender-name">{getSenderName(message)}</div>
                  )}
                  <div className="message-content">
                    <p>{message.messageText}</p>
                    <span className="message-time">{formatTime(message.timestamp)}</span>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          disabled={!connected}
          className="chat-input"
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || !connected}
          className="btn btn-primary chat-send-btn"
        >
          Send
        </button>
      </form>
    </div>
  )
}

export default ChatWindow

