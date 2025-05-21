import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { Leaf, Route, Building, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface EventResult {
  total_carbon_footprint: number;
  total_distance: number;
  total_hotel_nights: number;
  total_participants: number;
  by_user_type: Record<string, {
    carbon_footprint: number;
    distance: number;
    participants: number;
  }>;
  by_transport_type: Record<string, {
    distance: number;
    trips: number;
  }>;
}

const EventResults = () => {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<EventResult | null>(null);
  const [eventName, setEventName] = useState('');

  useEffect(() => {
    const fetchResults = async () => {
      try {
        // First get the event details
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('id, name')
          .eq('slug', slug)
          .single();

        if (eventError) throw eventError;
        setEventName(eventData.name);

        // Get all travel segments for this event
        const { data: segmentsData, error: segmentsError } = await supabase
          .from('travel_segments')
          .select('*')
          .eq('event_id', eventData.id);

        if (segmentsError) throw segmentsError;

        // Aggregate the results
        const aggregatedResults: EventResult = {
          total_carbon_footprint: 0,
          total_distance: 0,
          total_hotel_nights: 0,
          total_participants: new Set(segmentsData.map(s => s.user_type)).size,
          by_user_type: {},
          by_transport_type: {}
        };

        segmentsData.forEach(segment => {
          // Add to totals
          aggregatedResults.total_carbon_footprint += segment.carbon_footprint || 0;
          aggregatedResults.total_distance += segment.distance || 0;
          aggregatedResults.total_hotel_nights += segment.hotel_nights || 0;

          // Add to user type stats
          if (!aggregatedResults.by_user_type[segment.user_type]) {
            aggregatedResults.by_user_type[segment.user_type] = {
              carbon_footprint: 0,
              distance: 0,
              participants: 0
            };
          }
          aggregatedResults.by_user_type[segment.user_type].carbon_footprint += segment.carbon_footprint || 0;
          aggregatedResults.by_user_type[segment.user_type].distance += segment.distance || 0;
          aggregatedResults.by_user_type[segment.user_type].participants += 1;

          // Add to transport type stats
          if (!aggregatedResults.by_transport_type[segment.vehicle_type]) {
            aggregatedResults.by_transport_type[segment.vehicle_type] = {
              distance: 0,
              trips: 0
            };
          }
          aggregatedResults.by_transport_type[segment.vehicle_type].distance += segment.distance || 0;
          aggregatedResults.by_transport_type[segment.vehicle_type].trips += 1;
        });

        setResults(aggregatedResults);
      } catch (error) {
        console.error('Error fetching results:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">{t('results.noData')}</p>
      </div>
    );
  }

  const treesNeeded = Math.ceil(results.total_carbon_footprint / 22); // 22kg CO2 per tree per year

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{eventName}</h1>
        <p className="text-muted-foreground">{t('results.aggregatedResults')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 text-success">
            <Leaf className="h-4 w-4" />
            <h3 className="font-medium">{t('results.totalCarbonFootprint')}</h3>
          </div>
          <p className="stat-value">{results.total_carbon_footprint.toFixed(2)} kg CO₂e</p>
          <p className="stat-label">{t('results.treesNeeded', { count: treesNeeded })}</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2 text-primary">
            <Route className="h-4 w-4" />
            <h3 className="font-medium">{t('results.totalDistance')}</h3>
          </div>
          <p className="stat-value">{results.total_distance.toFixed(2)} km</p>
          <p className="stat-label">{t('results.distanceLabel')}</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building className="h-4 w-4" />
            <h3 className="font-medium">{t('results.totalAccommodation')}</h3>
          </div>
          <p className="stat-value">{results.total_hotel_nights}</p>
          <p className="stat-label">{t('results.nightsLabel')}</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <h3 className="font-medium">{t('results.totalParticipants')}</h3>
          </div>
          <p className="stat-value">{results.total_participants}</p>
          <p className="stat-label">{t('results.participantsLabel')}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">{t('results.byUserType')}</h3>
          <div className="space-y-4">
            {Object.entries(results.by_user_type).map(([type, stats]) => (
              <div key={type} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{t(`userType.${type}`)}</span>
                  <span className="text-sm text-muted-foreground">
                    {stats.participants} {t('results.participants')}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>{t('results.carbonFootprint')}:</span>
                    <span>{stats.carbon_footprint.toFixed(2)} kg CO₂e</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('results.distance')}:</span>
                    <span>{stats.distance.toFixed(2)} km</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">{t('results.byTransportType')}</h3>
          <div className="space-y-4">
            {Object.entries(results.by_transport_type).map(([type, stats]) => (
              <div key={type} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{t(`transport.${type}`)}</span>
                  <span className="text-sm text-muted-foreground">
                    {stats.distance.toFixed(2)} km
                  </span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{t('results.trips')}:</span>
                  <span>{stats.trips}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventResults;