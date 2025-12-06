//db.json deploy = https://db-weride-4.onrender.com
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/v1',
  endpoints: {
    users: '/users',
    vehicles: '/garage/vehicles',
    plans: '/plans',
    locations: '/locations',
    bookings: '/bookings',
    notifications: '/notifications',
    favorites: '/favorites',
    trips: '/trips',
    payments: '/payments',
    unlockRequests: '/unlockRequests',
    problemReports: '/problemReports',
    ratings: '/ratings'
  }
};
