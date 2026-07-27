export interface TravelHistoryEntry {
  id: string;
  userId: string;
  location: string;
  vehicle: string;
  image: string;
  tripDuration: string;
  travelDistance: string;
  createdAt: string;
}

export interface CreateTravelHistoryRequest {
  userId: string;
  location: string;
  vehicle: string;
  image: string;
  tripDuration: string;
  travelDistance: string;
}
