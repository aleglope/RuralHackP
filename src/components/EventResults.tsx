import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { Leaf, Route, Building, Users } from "lucide-react";
import { supabase } from "../lib/supabase";

// Interface for raw segment data from the database
interface RawSegment {
  id: string;
  submission_id: string;
  calculated_carbon_footprint?: number | null;
  distance?: number | null;
  vehicle_type: string;
  origin?: string | null;
  destination?: string | null;
  date?: string | null;
  carbon_compensated?: boolean | null;
  // Datos de la submission relacionada (via JOIN)
  submission_user_type?: string;
  submission_hotel_nights?: number | null;
}

// Interface for a submission from travel_data_submissions
interface Submission {
  id: string;
  user_type: string;
  total_hotel_nights: number | null;
}

// Define una interfaz para la estructura de un segmento de viaje
interface SegmentData {
  calculated_carbon_footprint?: number | null;
  distance?: number | null;
  vehicle_type: string; // O el tipo ENUM específico si está disponible aquí (ej: TransportType)
  // Añade aquí otras propiedades de 'segment' que puedas necesitar
}

interface EventResult {
  total_carbon_footprint: number;
  total_distance: number;
  total_hotel_nights: number;
  total_participants: number;
  by_user_type: Record<
    string,
    {
      carbon_footprint: number;
      distance: number;
      participants: number;
    }
  >;
  by_transport_type: Record<
    string,
    {
      distance: number;
      trips: number;
    }
  >;
}

const EventResults = () => {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<EventResult | null>(null);
  const [eventName, setEventName] = useState("");

  useEffect(() => {
    const fetchResults = async () => {
      if (!slug) {
        setLoading(false);
        console.warn("Event slug is not available.");
        setResults(null);
        return;
      }

      try {
        // First get the event details
        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select("id, name")
          .eq("slug", slug)
          .single();

        if (eventError) throw eventError;
        if (!eventData) {
          setLoading(false);
          console.warn(`Event with slug "${slug}" not found.`);
          setResults(null);
          return;
        }
        setEventName(eventData.name);

        // Consulta optimizada con JOIN para obtener todos los datos de una vez
        const { data: segmentsWithSubmissions, error: queryError } =
          await supabase
            .from("travel_segments")
            .select(
              `
            *,
            travel_data_submissions!inner(
              id,
              user_type,
              total_hotel_nights,
              event_id
            )
          `
            )
            .eq("travel_data_submissions.event_id", eventData.id);

        if (queryError) throw queryError;

        if (!segmentsWithSubmissions || segmentsWithSubmissions.length === 0) {
          setResults(null);
          setLoading(false);
          return;
        }

        // Agrupar segmentos por submission
        const submissionsMap = new Map<
          string,
          {
            id: string;
            user_type: string;
            total_hotel_nights: number | null;
            segments: SegmentData[];
          }
        >();

        segmentsWithSubmissions.forEach((item: any) => {
          const submissionData = item.travel_data_submissions;
          const submissionId = submissionData.id.toString();

          if (!submissionsMap.has(submissionId)) {
            submissionsMap.set(submissionId, {
              id: submissionId,
              user_type: submissionData.user_type,
              total_hotel_nights: submissionData.total_hotel_nights,
              segments: [],
            });
          }

          submissionsMap.get(submissionId)!.segments.push({
            calculated_carbon_footprint: item.calculated_carbon_footprint,
            distance: item.distance,
            vehicle_type: item.vehicle_type,
          });
        });

        const fullSubmissionData = Array.from(submissionsMap.values());

        const aggregatedResults: EventResult = {
          total_carbon_footprint: 0,
          total_distance: 0,
          total_hotel_nights: 0,
          total_participants: fullSubmissionData.length,
          by_user_type: {},
          by_transport_type: {},
        };

        fullSubmissionData.forEach((submission) => {
          // Agregar noches de hotel de la submission
          aggregatedResults.total_hotel_nights +=
            submission.total_hotel_nights || 0;

          // Procesar cada segmento de la submission
          submission.segments.forEach((segment: SegmentData) => {
            aggregatedResults.total_carbon_footprint +=
              segment.calculated_carbon_footprint || 0;
            aggregatedResults.total_distance += segment.distance || 0;

            // Agregar a by_user_type (usando el user_type de la submission)
            const userTypeKey = submission.user_type;
            if (!aggregatedResults.by_user_type[userTypeKey]) {
              aggregatedResults.by_user_type[userTypeKey] = {
                carbon_footprint: 0,
                distance: 0,
                participants: 0,
              };
            }
            aggregatedResults.by_user_type[userTypeKey].carbon_footprint +=
              segment.calculated_carbon_footprint || 0;
            aggregatedResults.by_user_type[userTypeKey].distance +=
              segment.distance || 0;

            // Agregar a by_transport_type (usando el vehicle_type del segmento)
            const transportTypeKey = segment.vehicle_type;
            if (!aggregatedResults.by_transport_type[transportTypeKey]) {
              aggregatedResults.by_transport_type[transportTypeKey] = {
                distance: 0,
                trips: 0,
              };
            }
            aggregatedResults.by_transport_type[transportTypeKey].distance +=
              segment.distance || 0;
            aggregatedResults.by_transport_type[transportTypeKey].trips += 1;
          });

          // Contar participantes por user_type (basado en submissions)
          const userTypeKey = submission.user_type;
          if (aggregatedResults.by_user_type[userTypeKey]) {
            // Ya debería existir por el bucle de segmentos
            aggregatedResults.by_user_type[userTypeKey].participants += 1;
          } else {
            // Caso poco probable si cada submission tiene segmentos, pero por seguridad
            aggregatedResults.by_user_type[userTypeKey] = {
              carbon_footprint: 0,
              distance: 0,
              participants: 1,
            };
          }
        });

        setResults(aggregatedResults);
      } catch (error) {
        console.error("Error fetching results:", error);
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
        <p className="text-muted-foreground">{t("results.noData")}</p>
      </div>
    );
  }

  const treesNeeded = Math.ceil(results.total_carbon_footprint / 22); // 22kg CO2 per tree per year

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{eventName}</h1>
        <p className="text-muted-foreground">
          {t("results.aggregatedResults")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 text-success">
            <Leaf className="h-4 w-4" />
            <h3 className="font-medium">{t("results.totalCarbonFootprint")}</h3>
          </div>
          <p className="stat-value">
            {results.total_carbon_footprint.toFixed(2)} kg CO₂e
          </p>
          <p className="stat-label">
            {t("results.treesNeeded", { count: treesNeeded })}
          </p>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2 text-primary">
            <Route className="h-4 w-4" />
            <h3 className="font-medium">{t("results.totalDistance")}</h3>
          </div>
          <p className="stat-value">{results.total_distance.toFixed(2)} km</p>
          <p className="stat-label">{t("results.distanceLabel")}</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building className="h-4 w-4" />
            <h3 className="font-medium">{t("results.totalAccommodation")}</h3>
          </div>
          <p className="stat-value">{results.total_hotel_nights}</p>
          <p className="stat-label">{t("results.nightsLabel")}</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <h3 className="font-medium">{t("results.totalParticipants")}</h3>
          </div>
          <p className="stat-value">{results.total_participants}</p>
          <p className="stat-label">{t("results.participantsLabel")}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">
            {t("results.byUserType")}
          </h3>
          <div className="space-y-4">
            {Object.entries(results.by_user_type).map(([type, stats]) => (
              <div key={type} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{t(`userType.${type}`)}</span>
                  <span className="text-sm text-muted-foreground">
                    {stats.participants} {t("results.participants")}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>{t("results.carbonFootprint")}:</span>
                    <span>{stats.carbon_footprint.toFixed(2)} kg CO₂e</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("results.distance")}:</span>
                    <span>{stats.distance.toFixed(2)} km</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">
            {t("results.byTransportType")}
          </h3>
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
                  <span>{t("results.trips")}:</span>
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
