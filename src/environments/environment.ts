//deploy actual (Render) = https://db-weride-4.onrender.com/api/v1
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/v1',
  endpoints: {
    authentication: '/authentication',
    profiles: '/profiles',
    users: '/users',
    vehicles: '/vehicles',
    plans: '/plans',
    locations: '/location',
    bookings: '/bookings',
    notifications: '/notifications',
    favorites: '/favorites',
    trips: '/trips',
    payments: '/payments',
    unlockRequests: '/unlockRequests',
    problemReports: '/problemReports',
    ratings: '/ratings',
    travelHistory: '/travel-history'
  }
};
