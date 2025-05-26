import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm, FormProvider, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useParams, useNavigate } from "react-router-dom";
import { UserType, TravelData } from "@/types";
import TravelSegment from "./TravelSegment";
import ResultsSection from "@/features/dashboard/ResultsSection";
import { supabase } from "@/services/supabaseClient";
import { calculateSegmentCarbonFootprint } from "@/utils/calculations";

const travelSegmentSchema = z
  .object({
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
    otherVehicleTypeDetails: z.string().optional(),
    fuelType: z
      .enum([
        "gasoline",
        "diesel",
        "hybrid",
        "pluginHybrid",
        "electric",
        "unknown",
      ])
      .optional(),
    fuel_type_other_details: z.string().optional(),
    passengers: z.number().min(1).optional(),
    numberOfVehicles: z.number().min(1).optional(),
    vanSize: z.enum(["<7.5t", "7.5-12t"]).optional(),
    truckSize: z
      .enum(["<7.5t", "7.5-12t", "20-26t", "34-40t", "50-60t"])
      .optional(),
    carbonCompensated: z.boolean().optional(),
    date: z.string().optional(),
    distance: z.number().min(0).optional(),
    origin: z.string().min(1, { message: "error.fieldRequired" }),
    destination: z.string().min(1, { message: "error.fieldRequired" }),
    returnTrip: z.boolean().optional(),
    frequency: z.number().min(1).optional(),
  })
  .refine(
    (data) => {
      if (data.vehicleType === "other") {
        return (
          data.otherVehicleTypeDetails &&
          data.otherVehicleTypeDetails.trim() !== ""
        );
      }
      return true;
    },
    {
      message: "vehicleType.specifyOther",
      path: ["otherVehicleTypeDetails"],
    }
  )
  .refine(
    (data) => {
      if (data.fuelType === "unknown") {
        return (
          data.fuel_type_other_details &&
          data.fuel_type_other_details.trim() !== ""
        );
      }
      return true;
    },
    {
      message: "fuelType.specifyOther",
      path: ["fuel_type_other_details"],
    }
  );

const travelFormSchema = z
  .object({
    userType: z.enum([
      "public",
      "participant",
      "logistics",
      "provider",
      "staff",
      "other",
    ]),
    otherUserTypeDetails: z.string().optional(),
    idaSegments: z
      .array(travelSegmentSchema)
      .min(1, { message: "error.idaSegmentsRequired" }),
    vueltaSegments: z
      .array(travelSegmentSchema)
      .min(1, { message: "error.vueltaSegmentsRequired" }),
    hotelNights: z.number().min(0).optional(),
    comments: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.userType === "other") {
        return (
          data.otherUserTypeDetails && data.otherUserTypeDetails.trim() !== ""
        );
      }
      return true;
    },
    {
      message: "userType.specifyOtherFuel",
      path: ["otherUserTypeDetails"],
    }
  );

const defaultSegmentIda = {
  vehicleType: "car" as const,
  fuelType: "diesel" as const,
  passengers: 1,
  numberOfVehicles: 1,
  date: new Date().toISOString().split("T")[0],
  distance: 500,
  origin: "Madrid",
  destination: "Pontevedra",
  otherVehicleTypeDetails: "",
  fuel_type_other_details: "",
  returnTrip: false,
  frequency: 1,
};

const defaultSegmentVuelta = {
  vehicleType: "car" as const,
  fuelType: "diesel" as const,
  passengers: 1,
  numberOfVehicles: 1,
  date: new Date().toISOString().split("T")[0],
  distance: 500,
  origin: "Pontevedra",
  destination: "Madrid",
  returnTrip: false,
  frequency: 1,
  otherVehicleTypeDetails: "",
  fuel_type_other_details: "",
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
      userType: "public" as UserType,
      idaSegments: [defaultSegmentIda],
      vueltaSegments: [],
      otherUserTypeDetails: "",
      hotelNights: 0,
      comments: "",
    },
    mode: "onChange",
  });

  const {
    fields: idaFields,
    append: appendIda,
    remove: removeIda,
  } = useFieldArray({
    control: methods.control,
    name: "idaSegments",
  });

  const {
    fields: vueltaFields,
    append: appendVuelta,
    remove: removeVuelta,
    replace: replaceVuelta,
  } = useFieldArray({
    control: methods.control,
    name: "vueltaSegments",
  });

  const watchedUserType = methods.watch("userType");

  useEffect(() => {
    if (watchedUserType !== "other") {
      methods.setValue("otherUserTypeDetails", "");
      if (methods.formState.errors.otherUserTypeDetails) {
        methods.clearErrors("otherUserTypeDetails");
      }
    }
  }, [watchedUserType, methods]);

  useEffect(() => {
    const currentIdaSegments = methods.getValues("idaSegments") || [];
    const currentVueltaSegments = methods.getValues("vueltaSegments") || [];

    if (isReturnTripSame) {
      const newVueltaSegments = currentIdaSegments
        .map((segment) => ({
          ...segment,
          origin: segment.destination,
          destination: segment.origin,
          returnTrip: false,
        }))
        .reverse();

      replaceVuelta(
        newVueltaSegments.length > 0
          ? newVueltaSegments
          : [defaultSegmentVuelta]
      );
    } else {
      if (currentVueltaSegments.length === 0) {
        replaceVuelta([defaultSegmentVuelta]);
      }
    }
  }, [isReturnTripSame, replaceVuelta, methods.watch("idaSegments")]);

  useEffect(() => {
    if (!isReturnTripSame && methods.getValues("vueltaSegments").length === 0) {
      replaceVuelta([defaultSegmentVuelta]);
    }
  }, []);

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
      const currentSlug: string = slug;

      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("id")
        .eq("slug", currentSlug)
        .single();

      if (eventError) throw eventError;
      if (!eventData) throw new Error("Event not found");

      const submissionPayload: {
        event_id: string;
        user_type: UserType;
        total_hotel_nights?: number | null;
        comments?: string | null;
        user_type_other_details?: string | null;
      } = {
        event_id: eventData.id,
        user_type: data.userType,
        total_hotel_nights: data.hotelNights,
        comments: data.comments,
      };

      if (data.userType === "other" && data.otherUserTypeDetails) {
        submissionPayload.user_type_other_details = data.otherUserTypeDetails;
      } else {
        submissionPayload.user_type_other_details = null;
      }

      const { data: submissionData, error: submissionInsertError } =
        await supabase
          .from("travel_data_submissions")
          .insert(submissionPayload)
          .select("id")
          .single();

      if (submissionInsertError) throw submissionInsertError;
      if (!submissionData) throw new Error("Failed to create submission entry");

      const submissionId = submissionData.id;

      const idaSegmentsToInsert = data.idaSegments.map((segment, index) => {
        const carbonFootprint = calculateSegmentCarbonFootprint(segment);
        return {
          submission_id: submissionId,
          vehicle_type: segment.vehicleType,
          vehicle_type_other_details:
            segment.vehicleType === "other"
              ? segment.otherVehicleTypeDetails
              : null,
          fuel_type: segment.fuelType,
          fuel_type_other_details:
            segment.fuelType === "other"
              ? segment.fuel_type_other_details
              : null,
          passengers: segment.passengers,
          number_of_vehicles: segment.numberOfVehicles,
          van_size: segment.vanSize || null,
          truck_size: segment.truckSize || null,
          calculated_carbon_footprint: carbonFootprint,
          carbon_compensated: segment.carbonCompensated || false,
          date: segment.date,
          distance: segment.distance,
          origin: segment.origin,
          destination: segment.destination,
          return_trip: segment.returnTrip,
          frequency: segment.frequency,
          segment_order: index,
        };
      });

      const vueltaSegmentsToInsert = data.vueltaSegments.map(
        (segment, index) => {
          const carbonFootprint = calculateSegmentCarbonFootprint(segment);
          return {
            submission_id: submissionId,
            vehicle_type: segment.vehicleType,
            vehicle_type_other_details:
              segment.vehicleType === "other"
                ? segment.otherVehicleTypeDetails
                : null,
            fuel_type: segment.fuelType,
            fuel_type_other_details:
              segment.fuelType === "other"
                ? segment.fuel_type_other_details
                : null,
            passengers: segment.passengers,
            number_of_vehicles: segment.numberOfVehicles,
            van_size: segment.vanSize || null,
            truck_size: segment.truckSize || null,
            calculated_carbon_footprint: carbonFootprint,
            carbon_compensated: segment.carbonCompensated || false,
            date: segment.date,
            distance: segment.distance,
            origin: segment.origin,
            destination: segment.destination,
            return_trip: segment.returnTrip,
            frequency: segment.frequency,
            segment_order: data.idaSegments.length + index,
          };
        }
      );

      const allSegmentsToInsert = [
        ...idaSegmentsToInsert,
        ...vueltaSegmentsToInsert,
      ];

      const { error: segmentsInsertError } = await supabase
        .from("travel_segments")
        .insert(allSegmentsToInsert);

      if (segmentsInsertError) throw segmentsInsertError;

      return true;
    } catch (error) {
      console.error("Error saving data:", error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (data: TravelData) => {
    if (step < 4) {
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
  const maxSteps = 4;

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
                  className={`relative flex items-center p-4 border rounded-lg cursor-pointer hover:bg-green-50 ${
                    watchedUserType === type
                      ? "bg-green-100 border-green-400 ring-2 ring-green-300"
                      : "border-gray-300"
                  }`}
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
                {methods.formState.errors.userType.message}
              </p>
            )}

            {watchedUserType === "other" && (
              <div className="mt-4">
                <label
                  htmlFor="otherUserTypeDetails"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {t("userType.otherDetailsLabel")}
                </label>
                <input
                  type="text"
                  id="otherUserTypeDetails"
                  {...methods.register("otherUserTypeDetails")}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  placeholder={
                    t("userType.otherDetailsPlaceholder") ||
                    "Specify your role..."
                  }
                />
                {methods.formState.errors.otherUserTypeDetails && (
                  <p className="mt-1 text-sm text-red-600">
                    {t(
                      methods.formState.errors.otherUserTypeDetails.message ||
                        "userType.specifyOther"
                    )}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">
              {t("transport.segments")}
            </h2>
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {t("transport.ida")}
              </h3>
              {idaFields.map((field, index) => (
                <div key={field.id} className="mb-3">
                  <TravelSegment
                    segmentPathPrefix={`idaSegments`}
                    index={index}
                    onRemove={() => removeIda(index)}
                    showRemoveButton={idaFields.length > 1}
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => appendIda(defaultSegmentIda)}
                className="mt-2 px-3 py-2 text-sm font-medium text-green-700 border border-green-300 rounded-md hover:bg-green-50"
              >
                {t("transport.addIdaSegment")}
              </button>
            </div>

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

            <div>
              <h3 className="text-lg font-semibold mb-2">
                {t("transport.vuelta")}
              </h3>
              {vueltaFields.map((field, index) => (
                <div key={field.id} className="mb-3">
                  <TravelSegment
                    segmentPathPrefix={`vueltaSegments`}
                    index={index}
                    onRemove={() => removeVuelta(index)}
                    showRemoveButton={
                      vueltaFields.length > 1 && !isReturnTripSame
                    }
                    disabled={isReturnTripSame}
                  />
                </div>
              ))}
              {!isReturnTripSame && (
                <button
                  type="button"
                  onClick={() => appendVuelta(defaultSegmentVuelta)}
                  className="mt-2 px-3 py-2 text-sm font-medium text-green-700 border border-green-300 rounded-md hover:bg-green-50"
                >
                  {t("transport.addVueltaSegment")}
                </button>
              )}
            </div>

            {methods.formState.errors.idaSegments &&
              !methods.formState.errors.idaSegments.root &&
              methods.formState.errors.idaSegments.message && (
                <p className="mt-1 text-sm text-red-600">
                  {t(methods.formState.errors.idaSegments.message)}
                </p>
              )}
            {methods.formState.errors.vueltaSegments &&
              !methods.formState.errors.vueltaSegments.root &&
              methods.formState.errors.vueltaSegments.message && (
                <p className="mt-1 text-sm text-red-600">
                  {t(methods.formState.errors.vueltaSegments.message)}
                </p>
              )}
          </div>
        )}

        {step === 3 && (
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

        {step === 4 && (
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
              : step < maxSteps
              ? t("common.next")
              : t("common.submit")}
          </button>
        </div>
      </form>
    </FormProvider>
  );
};

export default TravelForm;
