import ServiceProvider from '../models/ServiceProvider.js';

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Kathmandu center coordinates (Thamel area)
 */
const KATHMANDU_CENTER = {
  latitude: 27.7172,
  longitude: 85.3240
};

/**
 * Bayesian ranking algorithm to score providers
 * Uses Wilson score confidence interval for a Bernoulli parameter
 * This ensures new providers aren't unfairly ranked higher just because they have few reviews
 * 
 * Now includes distance factor for location-based matching
 */
export const computeBayesScore = (provider, serviceLocation = null) => {
  const avgRating = provider.rating?.average || 0;
  const totalReviews = provider.rating?.totalReviews || 0;
  
  // Prior parameters (assume average rating of 3.0 with 10 "virtual" reviews)
  const priorMean = 3.0;
  const priorStrength = 10;
  
  // Calculate Bayesian average
  const bayesianAverage = (priorMean * priorStrength + avgRating * totalReviews) / 
                          (priorStrength + totalReviews);
  
  // Boost score slightly for providers with more reviews (trust factor)
  const trustFactor = Math.log(1 + totalReviews) * 0.1;
  
  // Experience factor (more experience = slightly higher score)
  const experienceFactor = Math.min(provider.experienceYears / 10, 1) * 0.2;
  
  // Distance factor: closer providers get higher score
  let distanceFactor = 0;
  let distance = null;
  
  if (serviceLocation && serviceLocation.latitude && serviceLocation.longitude) {
    // If service location is provided, calculate distance from provider
    if (provider.location?.latitude && provider.location?.longitude) {
      distance = calculateDistance(
        serviceLocation.latitude,
        serviceLocation.longitude,
        provider.location.latitude,
        provider.location.longitude
      );
    } else {
      // If provider location not set, use Kathmandu center as reference
      distance = calculateDistance(
        serviceLocation.latitude,
        serviceLocation.longitude,
        KATHMANDU_CENTER.latitude,
        KATHMANDU_CENTER.longitude
      );
    }
    
    // Distance factor: closer = better (max 20km considered, beyond that no bonus)
    // Inverse relationship: closer providers get higher score
    if (distance <= 20) {
      distanceFactor = (20 - distance) / 20 * 0.3; // Max 0.3 boost for very close
    }
  } else {
    // If no service location, use distance from Kathmandu center
    if (provider.location?.latitude && provider.location?.longitude) {
      distance = calculateDistance(
        KATHMANDU_CENTER.latitude,
        KATHMANDU_CENTER.longitude,
        provider.location.latitude,
        provider.location.longitude
      );
      
      if (distance <= 20) {
        distanceFactor = (20 - distance) / 20 * 0.15; // Smaller boost when no service location
      }
    }
  }
  
  const finalScore = bayesianAverage + trustFactor + experienceFactor + distanceFactor;
  
  return {
    score: finalScore,
    bayesianAverage,
    trustFactor,
    experienceFactor,
    distanceFactor,
    distance: distance || null,
    provider: provider._id
  };
};

/**
 * Backtracking algorithm to find best combination of providers
 * for multiple service types or when multiple providers are needed
 */
export const findBestCombination = async (serviceTypes, availableProviders, maxProviders = 3) => {
  // Filter providers who have at least one of the required skills
  const relevantProviders = availableProviders.filter(provider => {
    return serviceTypes.some(service => provider.skills.includes(service));
  });

  if (relevantProviders.length === 0) {
    return [];
  }

  // If only one service type, return top providers for that service
  if (serviceTypes.length === 1) {
    const serviceType = serviceTypes[0];
    const matchingProviders = relevantProviders
      .filter(p => p.skills.includes(serviceType))
      .map(p => ({ ...computeBayesScore(p), provider: p }))
      .sort((a, b) => b.score - a.score)
      .slice(0, maxProviders);
    
    return matchingProviders;
  }

  // For multiple service types, use backtracking to find best combination
  const bestCombination = [];
  const usedProviders = new Set();
  
  const backtrack = (remainingServices, currentCombination, currentScore) => {
    // Base case: all services covered or no more providers
    if (remainingServices.length === 0 || currentCombination.length >= maxProviders) {
      if (currentScore > (bestCombination.reduce((sum, c) => sum + c.score, 0) || 0)) {
        bestCombination.length = 0;
        bestCombination.push(...currentCombination);
      }
      return;
    }

    // Try each remaining provider
    for (const provider of relevantProviders) {
      if (usedProviders.has(provider._id.toString())) continue;

      const providerScore = computeBayesScore(provider);
      const providerServices = provider.skills.filter(s => remainingServices.includes(s));
      
      if (providerServices.length === 0) continue;

      // Add provider to combination
      usedProviders.add(provider._id.toString());
      currentCombination.push({
        ...providerScore,
        provider: provider,
        coveredServices: providerServices
      });

      // Recurse with remaining services
      const newRemainingServices = remainingServices.filter(s => !providerServices.includes(s));
      backtrack(newRemainingServices, currentCombination, currentScore + providerScore.score);

      // Backtrack: remove provider
      currentCombination.pop();
      usedProviders.delete(provider._id.toString());
    }
  };

  backtrack(serviceTypes, [], 0);

  // If backtracking didn't find a good combination, fall back to top providers
  if (bestCombination.length === 0) {
    const topProviders = relevantProviders
      .map(p => ({ ...computeBayesScore(p), provider: p }))
      .sort((a, b) => b.score - a.score)
      .slice(0, maxProviders);
    
    return topProviders;
  }

  return bestCombination;
};

/**
 * Main matching function
 * Matches providers for a given service type
 * Now includes distance calculation for location-based matching
 * 
 * @param {string} serviceType - Type of service needed
 * @param {number} limit - Maximum number of providers to return
 * @param {object} serviceLocation - Optional: {latitude, longitude} of service location
 * @returns {Array} Array of matched providers with scores and distances
 */
export const matchProviders = async (serviceType, limit = 10, serviceLocation = null) => {
  try {
    // Get all verified providers
    const providers = await ServiceProvider.find({ verificationStatus: 'verified' });

    // Filter providers who have the required skill
    const matchingProviders = providers.filter(provider => 
      provider.skills.includes(serviceType)
    );

    // Calculate Bayesian scores for each provider (including distance)
    const scoredProviders = matchingProviders.map(provider => ({
      ...computeBayesScore(provider, serviceLocation),
      provider: provider
    }));

    // Sort by score (descending) - higher score = better match
    scoredProviders.sort((a, b) => b.score - a.score);

    // Return top providers with full provider data
    return scoredProviders.slice(0, limit).map(item => ({
      ...item.provider.toObject(),
      matchScore: item.score,
      distance: item.distance,
      distanceFactor: item.distanceFactor
    }));
  } catch (error) {
    throw new Error(`Error matching providers: ${error.message}`);
  }
};

