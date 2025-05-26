import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { Leaf, Route, Building, Users } from "lucide-react";
import { supabase } from "@/services/supabaseClient";
interface SegmentWithSubmission {
  id: string;
  submission_id: number;
  calculated_carbon_footprint?: number | null;
  distance?: number | null;
  vehicle_type: string;
  fuel_type?: string | null;
  fuel_type_other_details?: string | null;
  origin?: string | null;
  destination?: string | null;
  date?: string | null;
  carbon_compensated?: boolean | null;

  travel_data_submissions: {
    id: number;
    user_type: string;
    user_type_other_details: string | null;
    total_hotel_nights: number | null;
    event_id: string;
  };
}

interface SegmentData {
  calculated_carbon_footprint?: number | null;
  distance?: number | null;
  vehicle_type: string;
  fuel_type?: string | null;
  fuel_type_other_details?: string | null;
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
  by_fuel_type: Record<
    string,
    {
      distance: number;
      trips: number;
      carbon_footprint: number;
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

        const { data: segmentsWithSubmissions, error: queryError } =
          await supabase
            .from("travel_segments")
            .select(
              `
            *,
            travel_data_submissions!inner(
              id,
              user_type,
              user_type_other_details,
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

        const submissionsMap = new Map<
          string,
          {
            id: string;
            user_type: string;
            user_type_other_details: string | null;
            total_hotel_nights: number | null;
            segments: SegmentData[];
          }
        >();

        segmentsWithSubmissions.forEach((item: SegmentWithSubmission) => {
          const submissionData = item.travel_data_submissions;
          const submissionId = submissionData.id.toString();

          if (!submissionsMap.has(submissionId)) {
            submissionsMap.set(submissionId, {
              id: submissionId,
              user_type: submissionData.user_type,
              user_type_other_details: submissionData.user_type_other_details,
              total_hotel_nights: submissionData.total_hotel_nights,
              segments: [],
            });
          }

          submissionsMap.get(submissionId)!.segments.push({
            calculated_carbon_footprint: item.calculated_carbon_footprint,
            distance: item.distance,
            vehicle_type: item.vehicle_type,
            fuel_type: item.fuel_type,
            fuel_type_other_details: item.fuel_type_other_details,
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
          by_fuel_type: {},
        };

        fullSubmissionData.forEach((submission) => {
          aggregatedResults.total_hotel_nights +=
            submission.total_hotel_nights || 0;

          submission.segments.forEach((segment: SegmentData) => {
            aggregatedResults.total_carbon_footprint +=
              segment.calculated_carbon_footprint || 0;
            aggregatedResults.total_distance += segment.distance || 0;

            let userTypeKey = submission.user_type;
            if (
              submission.user_type === "other" &&
              submission.user_type_other_details
            ) {
              userTypeKey = `other: ${submission.user_type_other_details}`;
            }
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

            if (segment.fuel_type) {
              let fuelTypeKey = segment.fuel_type;
              if (
                segment.fuel_type === "other" &&
                segment.fuel_type_other_details
              ) {
                fuelTypeKey = `other: ${segment.fuel_type_other_details}`;
              }

              if (!aggregatedResults.by_fuel_type[fuelTypeKey]) {
                aggregatedResults.by_fuel_type[fuelTypeKey] = {
                  distance: 0,
                  trips: 0,
                  carbon_footprint: 0,
                };
              }
              aggregatedResults.by_fuel_type[fuelTypeKey].distance +=
                segment.distance || 0;
              aggregatedResults.by_fuel_type[fuelTypeKey].trips += 1;
              aggregatedResults.by_fuel_type[fuelTypeKey].carbon_footprint +=
                segment.calculated_carbon_footprint || 0;
            }
          });
        });

        // Contar participantes una sola vez por cada userTypeKey
        const uniqueUserTypesForParticipantCount = new Set<string>();
        fullSubmissionData.forEach((submission) => {
          let userTypeKey = submission.user_type;
          if (
            submission.user_type === "other" &&
            submission.user_type_other_details
          ) {
            userTypeKey = `other: ${submission.user_type_other_details}`;
          }
          if (
            aggregatedResults.by_user_type[userTypeKey] &&
            !uniqueUserTypesForParticipantCount.has(
              userTypeKey + "_" + submission.id
            )
          ) {
            // Se reinicia a 0 para evitar doble conteo si se procesa el mismo userTypeKey en múltiples submissions
            if (!uniqueUserTypesForParticipantCount.has(userTypeKey)) {
              aggregatedResults.by_user_type[userTypeKey].participants = 0;
            }
            uniqueUserTypesForParticipantCount.add(
              userTypeKey + "_" + submission.id
            ); // unique key per submission for a user type
          }
        });

        fullSubmissionData.forEach((submission) => {
          let userTypeKey = submission.user_type;
          if (
            submission.user_type === "other" &&
            submission.user_type_other_details
          ) {
            userTypeKey = `other: ${submission.user_type_other_details}`;
          }
          if (aggregatedResults.by_user_type[userTypeKey]) {
            aggregatedResults.by_user_type[userTypeKey].participants += 1;
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
            {Object.entries(results.by_user_type).map(([typeKey, stats]) => {
              let displayUserType = typeKey;
              if (typeKey.startsWith("other: ")) {
                const detail = typeKey.substring("other: ".length);
                displayUserType = `${t("userType.other")} (${detail})`;
              } else {
                displayUserType = t(`userType.${typeKey}`);
              }

              return (
                <div key={typeKey} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{displayUserType}</span>
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
              );
            })}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">
            {t("results.byTransportType")}
          </h3>
          <div className="space-y-4">
            {Object.entries(results.by_transport_type).map(([type, stats]) => {
              // Lógica para mostrar el tipo de transporte (puede necesitar ajustes si vehicle_type es 'other')
              let displayTransportType = t(`transport.${type}`);
              // Aquí podrías añadir lógica si type es 'other' y tienes other_vehicle_details en el segmento
              // if (type === 'other' && segment.other_vehicle_details) {
              //   displayTransportType = `${t('transport.other')} (${segment.other_vehicle_details})`;
              // }

              return (
                <div key={type} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{displayTransportType}</span>
                    <span className="text-sm text-muted-foreground">
                      {stats.distance.toFixed(2)} km
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{t("results.trips")}:</span>
                    <span>{stats.trips}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Nueva sección para mostrar resultados por tipo de combustible */}
        {results.by_fuel_type &&
          Object.keys(results.by_fuel_type).length > 0 && (
            <div className="card md:col-span-2">
              {" "}
              {/* Ocupa todo el ancho si es la única tarjeta en una nueva fila o ajusta según layout */}
              <h3 className="text-lg font-semibold mb-4">
                {t("results.byFuelType")}
              </h3>
              <div className="space-y-4">
                {Object.entries(results.by_fuel_type).map(
                  ([fuelKey, stats]) => {
                    let displayFuelType = fuelKey;
                    if (fuelKey.startsWith("other: ")) {
                      const parts = fuelKey.split(": ");
                      const baseType = t(`transport.fuel.${parts[0]}`);
                      displayFuelType = `${baseType} (${parts[1]})`;
                    } else {
                      displayFuelType = t(`transport.fuel.${fuelKey}`);
                    }

                    return (
                      <div key={fuelKey} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{displayFuelType}</span>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex justify-between">
                            <span>{t("results.carbonFootprint")}:</span>
                            <span>
                              {stats.carbon_footprint.toFixed(2)} kg CO₂e
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>{t("results.distanceTravelled")}:</span>
                            <span>{stats.distance.toFixed(2)} km</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{t("results.trips")}:</span>
                            <span>{stats.trips}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default EventResults;
