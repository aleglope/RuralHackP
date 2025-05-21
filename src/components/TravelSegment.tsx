import React from 'react';
import { useTranslation } from 'react-i18next';
import { useFormContext } from 'react-hook-form';
import { TransportType, FuelType, VanTruckSize } from '../types';

interface TravelSegmentProps {
  index: number;
  onRemove: () => void;
}

const TravelSegment: React.FC<TravelSegmentProps> = ({ index, onRemove }) => {
  const { t } = useTranslation();
  const { register, watch } = useFormContext();
  const vehicleType = watch(`segments.${index}.vehicleType`);

  const transportTypes: TransportType[] = [
    'walking', 'bicycle', 'motorcycle', 'car', 'van', 
    'bus', 'truck', 'train', 'plane', 'other'
  ];

  const fuelTypes: FuelType[] = [
    'gasoline', 'diesel', 'hybrid', 'pluginHybrid', 'electric'
  ];

  const vanTruckSizes: VanTruckSize[] = [
    '<7.5t', '7.5-12t', '20-26t', '34-40t', '50-60t'
  ];

  const needsFuelType = ['car', 'van', 'motorcycle', 'truck'].includes(vehicleType);
  const needsPassengers = ['car', 'van'].includes(vehicleType);
  const isVan = vehicleType === 'van';
  const isTruck = vehicleType === 'truck';
  const isPlane = vehicleType === 'plane';

  return (
    <div className="border rounded-lg p-4 mb-4 bg-white shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          {t('transport.segment')} {index + 1}
        </h3>
        <button
          type="button"
          onClick={onRemove}
          className="text-red-600 hover:text-red-800"
        >
          {t('common.remove')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('transport.type')}
          </label>
          <select
            {...register(`segments.${index}.vehicleType`)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          >
            <option value="">Select a vehicle type</option>
            {transportTypes.map(type => (
              <option key={type} value={type}>
                {t(`transport.${type}`)}
              </option>
            ))}
          </select>
        </div>

        {needsFuelType && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('transport.fuelType')}
            </label>
            <select
              {...register(`segments.${index}.fuelType`)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            >
              <option value="">Select a fuel type</option>
              {fuelTypes.map(type => (
                <option key={type} value={type}>
                  {t(`transport.fuel.${type}`)}
                </option>
              ))}
            </select>
          </div>
        )}

        {needsPassengers && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('transport.passengers')}
            </label>
            <input
              type="number"
              min="1"
              {...register(`segments.${index}.passengers`, { valueAsNumber: true })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>
        )}

        {isVan && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('transport.vanSize')}
            </label>
            <select
              {...register(`segments.${index}.vanSize`)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            >
              <option value="">Select van size</option>
              {vanTruckSizes.slice(0, 2).map(size => (
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
              {t('transport.truckSize')}
            </label>
            <select
              {...register(`segments.${index}.truckSize`)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            >
              <option value="">Select truck size</option>
              {vanTruckSizes.map(size => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}

        {isPlane && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('transport.carbonCompensated')}
            </label>
            <input
              type="checkbox"
              {...register(`segments.${index}.carbonCompensated`)}
              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('transport.date')}
          </label>
          <input
            type="date"
            {...register(`segments.${index}.date`)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('transport.distance')}
          </label>
          <input
            type="number"
            min="0"
            {...register(`segments.${index}.distance`, { valueAsNumber: true })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('transport.origin')}
          </label>
          <input
            type="text"
            {...register(`segments.${index}.origin`)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('transport.destination')}
          </label>
          <input
            type="text"
            {...register(`segments.${index}.destination`)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('transport.returnTrip')}
          </label>
          <input
            type="checkbox"
            {...register(`segments.${index}.returnTrip`)}
            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('transport.frequency')}
          </label>
          <input
            type="number"
            min="1"
            {...register(`segments.${index}.frequency`, { valueAsNumber: true })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>
      </div>
    </div>
  );
};

export default TravelSegment;