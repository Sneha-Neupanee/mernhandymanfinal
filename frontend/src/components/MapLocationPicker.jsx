import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './MapLocationPicker.css'

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Kathmandu center coordinates (Thamel area)
const KATHMANDU_CENTER = [27.7172, 85.3240]

// Kathmandu bounds (approximate)
const KATHMANDU_BOUNDS = [
  [27.6, 85.2], // Southwest
  [27.8, 85.4]  // Northeast
]

/**
 * Map click handler component
 * Handles clicks on the map to set location
 */
function MapClickHandler({ onLocationSelect, selectedLocation }) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng
      
      // Check if location is within Kathmandu bounds
      if (
        lat >= KATHMANDU_BOUNDS[0][0] && lat <= KATHMANDU_BOUNDS[1][0] &&
        lng >= KATHMANDU_BOUNDS[0][1] && lng <= KATHMANDU_BOUNDS[1][1]
      ) {
        onLocationSelect({ latitude: lat, longitude: lng })
      } else {
        alert('Please select a location within Kathmandu valley')
      }
    }
  })

  return null
}

/**
 * MapLocationPicker Component
 * Allows users to select a location on a map (constrained to Kathmandu)
 * 
 * @param {Function} onLocationSelect - Callback when location is selected
 * @param {Object} initialLocation - Initial location {latitude, longitude}
 * @param {boolean} readOnly - If true, map is read-only (for viewing)
 */
const MapLocationPicker = ({ onLocationSelect, initialLocation = null, readOnly = false }) => {
  const [selectedLocation, setSelectedLocation] = useState(initialLocation)
  const [addressText, setAddressText] = useState('')
  const mapRef = useRef(null)

  useEffect(() => {
    if (initialLocation) {
      setSelectedLocation(initialLocation)
    }
  }, [initialLocation])

  const handleLocationSelect = (location) => {
    if (readOnly) return
    
    setSelectedLocation(location)
    if (onLocationSelect) {
      onLocationSelect({
        ...location,
        addressText: addressText || `Location: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
      })
    }
  }

  const handleAddressChange = (e) => {
    const address = e.target.value
    setAddressText(address)
    if (selectedLocation && onLocationSelect) {
      onLocationSelect({
        ...selectedLocation,
        addressText: address
      })
    }
  }

  return (
    <div className="map-location-picker">
      <div className="map-container">
        <MapContainer
          center={selectedLocation ? [selectedLocation.latitude, selectedLocation.longitude] : KATHMANDU_CENTER}
          zoom={selectedLocation ? 14 : 12}
          style={{ height: '400px', width: '100%' }}
          maxBounds={KATHMANDU_BOUNDS}
          minZoom={11}
          maxZoom={18}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {selectedLocation && (
            <Marker position={[selectedLocation.latitude, selectedLocation.longitude]} />
          )}
          {!readOnly && (
            <MapClickHandler 
              onLocationSelect={handleLocationSelect}
              selectedLocation={selectedLocation}
            />
          )}
        </MapContainer>
      </div>
      
      {!readOnly && (
        <div className="map-controls">
          <p className="map-instruction">
            Click on the map to select your service location (Kathmandu only)
          </p>
          <div className="form-group">
            <label>Address (Optional)</label>
            <input
              type="text"
              value={addressText}
              onChange={handleAddressChange}
              placeholder="Enter address or landmark"
            />
          </div>
          {selectedLocation && (
            <div className="location-info">
              <p><strong>Selected Location:</strong></p>
              <p>Latitude: {selectedLocation.latitude.toFixed(6)}</p>
              <p>Longitude: {selectedLocation.longitude.toFixed(6)}</p>
            </div>
          )}
        </div>
      )}
      
      {readOnly && selectedLocation && (
        <div className="location-info">
          <p><strong>Service Location:</strong></p>
          <p>{selectedLocation.addressText || `Lat: ${selectedLocation.latitude.toFixed(6)}, Lng: ${selectedLocation.longitude.toFixed(6)}`}</p>
        </div>
      )}
    </div>
  )
}

export default MapLocationPicker

