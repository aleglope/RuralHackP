import { TravelSegment } from '../types';

// CO2e emissions factors (kg CO2e per km)
const EMISSIONS_FACTORS = {
  walking: 0,
  bicycle: 0,
  motorcycle: 0.103,
  car: {
    gasoline: 0.192,
    diesel: 0.171,
    hybrid: 0.111,
    pluginHybrid: 0.092,
    electric: 0.053
  },
  van: {
    gasoline: 0.297,
    diesel: 0.265,
    hybrid: 0.172,
    pluginHybrid: 0.142,
    electric: 0.082
  },
  bus: 0.027, // per passenger
  truck: {
    '<7.5t': 0.459,
    '7.5-12t': 0.563,
    '20-26t': 0.679,
    '34-40t': 0.855,
    '50-60t': 0.932
  },
  train: 0.041, // per passenger
  plane: 0.255, // per passenger
  other: 0.2 // default value
};

const HOTEL_EMISSIONS = 12; // kg CO2e per night

export const calculateSegmentCarbonFootprint = (segment: TravelSegment): number => {
  const distance = segment.distance || 0;
  const frequency = segment.frequency || 1;
  const multiplier = segment.returnTrip ? 2 : 1;
  let emissions = 0;

  switch (segment.vehicleType) {
    case 'car':
    case 'van':
      if (segment.fuelType) {
        const factor = EMISSIONS_FACTORS[segment.vehicleType][segment.fuelType];
        emissions = factor * distance;
        if (segment.passengers && segment.passengers > 1) {
          emissions /= segment.passengers;
        }
      }
      break;
    case 'truck':
      if (segment.truckSize) {
        emissions = EMISSIONS_FACTORS.truck[segment.truckSize] * distance;
      }
      break;
    case 'plane':
      emissions = EMISSIONS_FACTORS.plane * distance;
      if (segment.carbonCompensated) {
        emissions *= 0.5; // Assume 50% reduction if carbon is offset
      }
      break;
    default:
      const factor = typeof EMISSIONS_FACTORS[segment.vehicleType] === 'number'
        ? EMISSIONS_FACTORS[segment.vehicleType]
        : EMISSIONS_FACTORS.other;
      emissions = factor * distance;
  }

  return emissions * frequency * multiplier;
};

export const calculateCarbonFootprint = (data: { segments: TravelSegment[], hotelNights?: number }): number => {
  let totalEmissions = 0;

  // Calculate emissions from travel segments
  for (const segment of data.segments) {
    totalEmissions += calculateSegmentCarbonFootprint(segment);
  }

  // Add hotel emissions if applicable
  if (data.hotelNights) {
    totalEmissions += data.hotelNights * HOTEL_EMISSIONS;
  }

  return totalEmissions;
};

export const calculateTreesNeeded = (carbonFootprint: number): number => {
  // Average tree absorbs 22kg CO2 per year
  return carbonFootprint / 22;
};

export const calculateTotalDistance = (segments: TravelSegment[]) => {
  const byType: Record<string, number> = {};
  let totalDistance = 0;

  for (const segment of segments) {
    const distance = (segment.distance || 0) * (segment.frequency || 1) * (segment.returnTrip ? 2 : 1);
    if (segment.vehicleType) {
      byType[segment.vehicleType] = (byType[segment.vehicleType] || 0) + distance;
    }
    totalDistance += distance;
  }

  return { totalDistance, byType };
};