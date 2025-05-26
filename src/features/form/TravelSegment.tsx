import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useFormContext } from "react-hook-form";
import { TransportType, FuelType, VanTruckSize } from "@/types";

interface TravelSegmentProps {
  index: number;
  segmentPathPrefix: "idaSegments" | "vueltaSegments";
  onRemove: () => void;
  showRemoveButton: boolean;
  disabled?: boolean;
}

const TravelSegment: React.FC<TravelSegmentProps> = ({
  index,
  segmentPathPrefix,
  onRemove,
  showRemoveButton,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const {
    register,
    watch,
    setValue,
    formState: { errors },
    clearErrors,
  } = useFormContext();

  // Construir el path base para este segmento
  const basePath = `${segmentPathPrefix}.${index}`;

  const vehicleType = watch(`${basePath}.vehicleType`);
  const userType = watch("userType");
  const otherUserTypeDetails = watch("otherUserTypeDetails");
  const fuelType = watch(`${basePath}.fuelType`);

  useEffect(() => {
    if (vehicleType !== "other") {
      setValue(`${basePath}.otherVehicleTypeDetails`, "");
      // @ts-ignore - Acceso a errores anidados
      if (errors[segmentPathPrefix]?.[index]?.otherVehicleTypeDetails) {
        clearErrors(`${basePath}.otherVehicleTypeDetails`);
      }
    }
  }, [
    vehicleType,
    basePath,
    setValue,
    clearErrors,
    errors,
    segmentPathPrefix,
    index,
  ]);

  useEffect(() => {
    if (fuelType !== "other") {
      setValue(`${basePath}.fuel_type_other_details`, "");
      // @ts-ignore - Acceso a errores anidados
      if (errors[segmentPathPrefix]?.[index]?.fuel_type_other_details) {
        clearErrors(`${basePath}.fuel_type_other_details`);
      }
    }
  }, [
    fuelType,
    basePath,
    setValue,
    clearErrors,
    errors,
    segmentPathPrefix,
    index,
  ]);

  const transportTypes: TransportType[] = [
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
  ];

  const fuelTypes: FuelType[] = [
    "gasoline",
    "diesel",
    "hybrid",
    "pluginHybrid",
    "electric",
  ];

  const needsFuelType = ["car", "van", "motorcycle", "truck", "bus"].includes(
    vehicleType
  );

  const getFilteredFuelTypes = () => {
    const groundVehicles = ["motorcycle", "car", "van", "bus", "truck"];
    let availableFuelTypes = [...fuelTypes];

    if (groundVehicles.includes(vehicleType)) {
      availableFuelTypes.push("unknown");
    }
    if (needsFuelType) {
      availableFuelTypes.push("other");
    }

    return Array.from(new Set(availableFuelTypes));
  };

  const currentFuelTypes = getFilteredFuelTypes();

  const vanTruckSizes: VanTruckSize[] = [
    "<7.5t",
    "7.5-12t",
    "20-26t",
    "34-40t",
    "50-60t",
  ];

  const needsPassengers = ["car", "van", "bus"].includes(vehicleType);
  const isVan = vehicleType === "van";
  const isTruck = vehicleType === "truck";
  const needsCarbonCompensated = ["plane", "bus", "train"].includes(
    vehicleType
  );
  const needsNumberOfVehicles = [
    "car",
    "van",
    "bus",
    "motorcycle",
    "truck",
  ].includes(vehicleType);

  return (
    <div className="border rounded-lg p-4 mb-4 bg-white shadow-sm">
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-lg font-semibold">
          {t("transport.segment")} #{index + 1}
        </h3>
        {showRemoveButton && (
          <button
            type="button"
            onClick={onRemove}
            className="text-red-500 hover:text-red-700 text-sm font-medium"
          >
            {t("common.remove")}
          </button>
        )}
      </div>
      {userType && (
        <div className="mb-3 text-sm text-gray-600">
          {t("userType.title")}:{" "}
          <strong>
            {userType === "other" && otherUserTypeDetails
              ? `${t("userType.other")} (${otherUserTypeDetails})`
              : t(`userType.${userType}`)}
          </strong>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("transport.type")}
          </label>
          <select
            {...register(`${basePath}.vehicleType`)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            disabled={disabled}
          >
            <option value="">Select a vehicle type</option>
            {transportTypes.map((type) => (
              <option key={type} value={type}>
                {t(`transport.${type}`)}
              </option>
            ))}
          </select>
        </div>

        {vehicleType === "other" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("vehicleType.otherDetailsLabel")}
            </label>
            <input
              type="text"
              {...register(`${basePath}.otherVehicleTypeDetails`)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              placeholder={
                t("vehicleType.otherDetailsPlaceholder") ||
                "Specify vehicle type..."
              }
              disabled={disabled}
            />
            {/* @ts-ignore - Acceso a errores anidados */}
            {errors[segmentPathPrefix]?.[index]?.otherVehicleTypeDetails && (
              <p className="mt-1 text-sm text-red-600">
                {/* @ts-ignore - Acceso a errores anidados */}
                {t(
                  errors[segmentPathPrefix]?.[index]?.otherVehicleTypeDetails
                    ?.message || "vehicleType.specifyOther"
                )}
              </p>
            )}
          </div>
        )}

        {needsFuelType && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("transport.fuelType")}
            </label>
            <select
              {...register(`${basePath}.fuelType`)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              disabled={disabled}
            >
              <option value="">{t("transport.fuel.select")}</option>
              {currentFuelTypes.map((type) => (
                <option key={type} value={type}>
                  {t(`transport.fuel.${type}`)}
                </option>
              ))}
            </select>
          </div>
        )}

        {fuelType === "other" && needsFuelType && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("transport.fuel.otherDetailsLabel")}
            </label>
            <input
              type="text"
              {...register(`${basePath}.fuel_type_other_details`)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              placeholder={
                t("transport.fuel.otherDetailsPlaceholder") ||
                "Specify fuel type..."
              }
              disabled={disabled}
            />
            {/* @ts-ignore - Acceso a errores anidados */}
            {errors[segmentPathPrefix]?.[index]?.fuel_type_other_details && (
              <p className="mt-1 text-sm text-red-600">
                {/* @ts-ignore - Acceso a errores anidados */}
                {t(
                  errors[segmentPathPrefix]?.[index]?.fuel_type_other_details
                    ?.message || "transport.fuel.specifyOtherFuel"
                )}
              </p>
            )}
          </div>
        )}

        {needsPassengers && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("transport.passengers")}
            </label>
            <input
              type="number"
              min="1"
              {...register(`${basePath}.passengers`, {
                valueAsNumber: true,
              })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              disabled={disabled}
            />
          </div>
        )}

        {needsNumberOfVehicles && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("transport.numberOfVehicles")}
            </label>
            <input
              type="number"
              min="1"
              {...register(`${basePath}.numberOfVehicles`, {
                valueAsNumber: true,
              })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              disabled={disabled}
            />
          </div>
        )}

        {isVan && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("transport.vanSize")}
            </label>
            <select
              {...register(`${basePath}.vanSize`)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              disabled={disabled}
            >
              <option value="">Select van size</option>
              {vanTruckSizes.slice(0, 2).map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}

        {isTruck && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("transport.truckSize")}
            </label>
            <select
              {...register(`${basePath}.truckSize`)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              disabled={disabled}
            >
              <option value="">Select truck size</option>
              {vanTruckSizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}

        {needsCarbonCompensated && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("transport.carbonCompensated")}
            </label>
            <input
              type="checkbox"
              {...register(`${basePath}.carbonCompensated`)}
              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              disabled={disabled}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("transport.date")}
          </label>
          <input
            type="date"
            {...register(`${basePath}.date`)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            disabled={disabled}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("transport.distance")}
          </label>
          <input
            type="number"
            min="0"
            {...register(`${basePath}.distance`, { valueAsNumber: true })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            disabled={disabled}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("transport.origin")}
          </label>
          <input
            type="text"
            {...register(`${basePath}.origin`)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            disabled={disabled}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("transport.destination")}
          </label>
          <input
            type="text"
            {...register(`${basePath}.destination`)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            disabled={disabled}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("transport.returnTrip")}
          </label>
          <input
            type="checkbox"
            {...register(`${basePath}.returnTrip`)}
            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
            disabled={disabled}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("transport.frequency")}
          </label>
          <input
            type="number"
            min="1"
            {...register(`${basePath}.frequency`, {
              valueAsNumber: true,
            })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
};

export default TravelSegment;
