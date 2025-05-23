import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useParams, useNavigate } from "react-router-dom";
import { UserType, TravelData } from "../types";
import TravelSegment from "./TravelSegment";
import ResultsSection from "./ResultsSection";
import { supabase } from "../lib/supabase";
import { calculateSegmentCarbonFootprint } from "../utils/calculations";

const travelSegmentSchema = z.object({
  vehicleType: z.enum([
    "walking",
    "bicycle",
    "motorcycle",
    "car",
    "van",
    "bus",
    "truck",
    "train",
    "plane",
    "other",
  ]),
  fuelType: z
    .enum(["gasoline", "diesel", "hybrid", "pluginHybrid", "electric"])
    .optional(),
  passengers: z.number().min(1).optional(),
  vanSize: z.enum(["<7.5t", "7.5-12t"]).optional(),
  truckSize: z
    .enum(["<7.5t", "7.5-12t", "20-26t", "34-40t", "50-60t"])
    .optional(),
  carbonCompensated: z.boolean().optional(),
  date: z.string().optional(),
  distance: z.number().min(0).optional(),
  origin: z.string().optional(),
  destination: z.string().optional(),
});

const travelFormSchema = z.object({
  userType: z.enum([
    "public",
    "participant",
    "logistics",
    "provider",
    "staff",
    "other",
  ]),
  segments: z.tuple([travelSegmentSchema, travelSegmentSchema]),
  hotelNights: z.number().min(0).optional(),
  comments: z.string().optional(),
});

const defaultSegmentIda = {
  vehicleType: "car" as const,
  fuelType: "diesel" as const,
  passengers: 1,
  date: new Date().toISOString().split("T")[0],
  distance: 500,
  origin: "Madrid",
  destination: "Pontevedra",
};

const defaultSegmentVuelta = {
  vehicleType: "car" as const,
  fuelType: "diesel" as const,
  passengers: 1,
  date: new Date().toISOString().split("T")[0],
  distance: 500,
  origin: "Pontevedra",
  destination: "Madrid",
  returnTrip: false,
  frequency: 1,
};

const TravelForm = () => {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<TravelData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReturnTripSame, setIsReturnTripSame] = useState(false);

  const methods = useForm<TravelData>({
    resolver: zodResolver(travelFormSchema),
    defaultValues: {
      segments: [defaultSegmentIda, defaultSegmentVuelta],
    },
    mode: "onChange",
  });

  const watchedSegment0 = methods.watch("segments.0");

  useEffect(() => {
    if (isReturnTripSame && watchedSegment0) {
      methods.setValue("segments.1.vehicleType", watchedSegment0.vehicleType, {
        shouldValidate: true,
      });
      methods.setValue("segments.1.fuelType", watchedSegment0.fuelType, {
        shouldValidate: true,
      });
      methods.setValue("segments.1.passengers", watchedSegment0.passengers, {
        shouldValidate: true,
      });
      methods.setValue("segments.1.vanSize", watchedSegment0.vanSize, {
        shouldValidate: true,
      });
      methods.setValue("segments.1.truckSize", watchedSegment0.truckSize, {
        shouldValidate: true,
      });
      methods.setValue(
        "segments.1.carbonCompensated",
        watchedSegment0.carbonCompensated,
        { shouldValidate: true }
      );
      methods.setValue("segments.1.distance", watchedSegment0.distance, {
        shouldValidate: true,
      });
      methods.setValue("segments.1.origin", watchedSegment0.destination, {
        shouldValidate: true,
      });
      methods.setValue("segments.1.destination", watchedSegment0.origin, {
        shouldValidate: true,
      });
    } else if (!isReturnTripSame) {
      // Opcional: Limpiar campos del segmento 1 si se desmarca la casilla,
      // o dejarlos como estaban para que el usuario los edite.
      // Por ahora, no los limpiamos para no perder datos si el usuario desmarca por error.
    }
  }, [isReturnTripSame, watchedSegment0, methods]);

  const userTypes: UserType[] = [
    "public",
    "participant",
    "logistics",
    "provider",
    "staff",
    "other",
  ];

  const saveToDatabase = async (data: TravelData) => {
    try {
      setIsSubmitting(true);

      if (!slug) {
        console.error("Event slug is not available.");
        setIsSubmitting(false);
        alert(t("error.eventNotFound"));
        return false;
      }
      const currentSlug: string = slug; // slug está garantizado como string aquí

      // Get event ID from slug
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("id")
        .eq("slug", currentSlug)
        .single();

      if (eventError) throw eventError;
      if (!eventData) throw new Error("Event not found");

      // 1. Insert into travel_data_submissions
      const { data: submissionData, error: submissionInsertError } =
        await supabase
          .from("travel_data_submissions")
          .insert({
            event_id: eventData.id,
            user_type: data.userType,
            total_hotel_nights: data.hotelNights,
            comments: data.comments,
            // user_id: null, // O el ID del usuario si está autenticado y es relevante
            // is_round_trip: true, // Asume que siempre son dos segmentos (ida y vuelta)
          })
          .select("id")
          .single();

      if (submissionInsertError) throw submissionInsertError;
      if (!submissionData) throw new Error("Failed to create submission entry");

      const submissionId = submissionData.id;

      // 2. Insert each travel segment, linking to the submissionId
      const segmentsToInsert = data.segments.map((segment, index) => {
        const carbonFootprint = calculateSegmentCarbonFootprint(segment);
        return {
          submission_id: submissionId,
          vehicle_type: segment.vehicleType,
          fuel_type: segment.fuelType,
          passengers: segment.passengers,
          van_size: segment.vanSize || null,
          truck_size: segment.truckSize || null,
          calculated_carbon_footprint: carbonFootprint,
          carbon_compensated: segment.carbonCompensated || false,
          date: segment.date,
          distance: segment.distance,
          origin: segment.origin,
          destination: segment.destination,
          segment_order: index + 1, // Para identificar ida (1) y vuelta (2)
          // hotel_nights y comments no pertenecen al segmento individual según el nuevo diseño
        };
      });

      const { error: segmentsInsertError } = await supabase
        .from("travel_segments")
        .insert(segmentsToInsert);

      if (segmentsInsertError) throw segmentsInsertError;

      return true;
    } catch (error) {
      console.error("Error saving data:", error);
      // Mas adelante mostrar un mensaje de error más amigable al usuario aquí
      // por ejemplo, usando un estado y mostrándolo en la UI, o un toast notification.
      // alert(t("error.savingData"));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (data: TravelData) => {
    if (step < (isPublicOrParticipant ? 4 : 3)) {
      setStep(step + 1);
    } else {
      const success = await saveToDatabase(data);
      if (success) {
        setFormData(data);
        navigate(`/event/${slug}/results`);
      } else {
        alert(t("error.savingData"));
      }
    }
  };

  const [step, setStep] = useState(1);
  const isPublicOrParticipant =
    methods.watch("userType") === "public" ||
    methods.watch("userType") === "participant";
  const maxSteps = isPublicOrParticipant ? 4 : 3;

  if (step === maxSteps && formData) {
    return <ResultsSection data={formData} onBack={() => setStep(step - 1)} />;
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        {step === 1 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">
              {t("userType.title")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {userTypes.map((type) => (
                <label
                  key={type}
                  className="relative flex items-center p-4 border rounded-lg cursor-pointer hover:bg-green-50"
                >
                  <input
                    type="radio"
                    {...methods.register("userType")}
                    value={type}
                    className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                  />
                  <span className="ml-3">{t(`userType.${type}`)}</span>
                </label>
              ))}
            </div>
            {methods.formState.errors.userType && (
              <p className="mt-1 text-sm text-red-600">
                {t("userType.required")}
              </p>
            )}
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">
              {t("transport.segments")}
            </h2>
            {/* Segmento de Ida */}
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {t("transport.ida")}
              </h3>{" "}
              <TravelSegment key="ida" index={0} />
            </div>

            {/* Checkbox para "Viaje de vuelta igual" */}
            <div className="my-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isReturnTripSame}
                  onChange={(e) => setIsReturnTripSame(e.target.checked)}
                  className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  {t("transport.returnTripSameAsDeparture")}
                </span>
              </label>
            </div>

            {/* Segmento de Vuelta - Renderizado condicional */}
            {isReturnTripSame && (
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  {t("transport.vuelta")}
                </h3>{" "}
                <TravelSegment
                  key="vuelta"
                  index={1}
                  // disabled={isReturnTripSame} // Consideraremos esto más adelante si los campos deben ser no editables
                />
              </div>
            )}

            {methods.formState.errors.segments && (
              <p className="mt-1 text-sm text-red-600">
                {t("transport.segmentsRequired")}
              </p>
            )}
          </div>
        )}

        {step === 3 && isPublicOrParticipant && (
          <div>
            <h2 className="text-xl font-semibold mb-4">
              {t("accommodation.title")}
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("accommodation.nights")}
              </label>
              <input
                type="number"
                min="0"
                {...methods.register("hotelNights", { valueAsNumber: true })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              />
              {methods.formState.errors.hotelNights && (
                <p className="mt-1 text-sm text-red-600">
                  {t("accommodation.nightsInvalid")}
                </p>
              )}
            </div>
          </div>
        )}

        {((isPublicOrParticipant && step === 4) ||
          (!isPublicOrParticipant && step === 3)) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("common.comments")}
            </label>
            <textarea
              {...methods.register("comments")}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              rows={4}
            />
          </div>
        )}

        <div className="flex justify-between space-x-4">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              {t("common.back")}
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
              isSubmitting ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting
              ? t("common.submitting")
              : step < (isPublicOrParticipant ? 4 : 3)
              ? t("common.next")
              : t("common.submit")}
          </button>
        </div>
      </form>
    </FormProvider>
  );
};

export default TravelForm;
