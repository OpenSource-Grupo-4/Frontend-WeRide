// dev: '/api/v1' is proxied by the dev server to https://db-weride-4.onrender.com (see proxy.conf.json)
export const environment = {
  production: false,
  apiUrl: '/api/v1',
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
