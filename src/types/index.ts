export type TransportType =
  | "walking"
  | "bicycle"
  | "motorcycle"
  | "car"
  | "van"
  | "bus"
  | "truck"
  | "train"
  | "plane"
  | "other";

export type FuelType =
  | "gasoline"
  | "diesel"
  | "hybrid"
  | "pluginHybrid"
  | "electric"
  | "unknown"
  | "other";

export type UserType =
  | "public"
  | "participant"
  | "logistics"
  | "provider"
  | "staff"
  | "other";

export type VanTruckSize = "<7.5t" | "7.5-12t" | "20-26t" | "34-40t" | "50-60t";

export interface TravelSegment {
  vehicleType?: TransportType;
  fuelType?: FuelType;
  passengers?: number;
  vanSize?: VanTruckSize;
  truckSize?: VanTruckSize;
  carbonCompensated?: boolean;
  date?: string;
  distance?: number;
  origin?: string;
  destination?: string;
  returnTrip?: boolean;
  frequency?: number;
}

export interface TravelSegmentData {
  vehicleType: TransportType;
  otherVehicleTypeDetails?: string;
  fuelType?: FuelType;
  fuel_type_other_details?: string;
  passengers?: number;
  numberOfVehicles?: number;
  vanSize?: VanTruckSize;
  truckSize?: VanTruckSize;
  carbonCompensated?: boolean;
  date?: string;
  distance?: number;
  origin?: string;
  destination?: string;
}

export interface TravelData {
  userType: UserType;
  segments: [TravelSegmentData, TravelSegmentData];
  hotelNights?: number;
  comments?: string;
  otherUserTypeDetails?: string;
}
