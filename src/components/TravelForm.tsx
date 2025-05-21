import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams, useNavigate } from 'react-router-dom';
import { UserType, TravelData } from '../types';
import TravelSegment from './TravelSegment';
import ResultsSection from './ResultsSection';
import { supabase } from '../lib/supabase';
import { calculateSegmentCarbonFootprint } from '../utils/calculations';

const travelFormSchema = z.object({
  userType: z.enum(['public', 'participant', 'logistics', 'provider', 'staff', 'other']),
  segments: z.array(z.object({
    vehicleType: z.enum(['walking', 'bicycle', 'motorcycle', 'car', 'van', 'bus', 'truck', 'train', 'plane', 'other']),
    fuelType: z.enum(['gasoline', 'diesel', 'hybrid', 'pluginHybrid', 'electric']).optional(),
    passengers: z.number().min(1).optional(),
    vanSize: z.enum(['<7.5t', '7.5-12t']).optional(),
    truckSize: z.enum(['<7.5t', '7.5-12t', '20-26t', '34-40t', '50-60t']).optional(),
    carbonCompensated: z.boolean().optional(),
    date: z.string().optional(),
    distance: z.number().min(0).optional(),
    origin: z.string().optional(),
    destination: z.string().optional(),
    returnTrip: z.boolean().optional(),
    frequency: z.number().min(1).optional(),
  })).min(1),
  hotelNights: z.number().min(0).optional(),
  comments: z.string().optional(),
});

const defaultSegment = {
  vehicleType: 'car' as const,
  fuelType: 'diesel' as const,
  passengers: 1,
  date: new Date().toISOString().split('T')[0],
  distance: 500,
  origin: 'Madrid',
  destination: 'Pontevedra',
  returnTrip: false,
  frequency: 1
};

const TravelForm = () => {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<TravelData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const methods = useForm<TravelData>({
    resolver: zodResolver(travelFormSchema),
    defaultValues: {
      segments: [defaultSegment],
    },
    mode: 'onChange'
  });

  const userTypes: UserType[] = ['public', 'participant', 'logistics', 'provider', 'staff', 'other'];

  const saveToDatabase = async (data: TravelData) => {
    try {
      setIsSubmitting(true);
      
      // Get event ID from slug
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('id')
        .eq('slug', slug)
        .single();

      if (eventError) throw eventError;

      // Insert each travel segment as a separate record
      const segmentsToInsert = data.segments.map(segment => {
        const carbonFootprint = calculateSegmentCarbonFootprint(segment);
        const hotelNightsPerSegment = data.hotelNights ? Math.floor(data.hotelNights / data.segments.length) : 0;

        return {
          event_id: eventData.id,
          user_type: data.userType,
          vehicle_type: segment.vehicleType,
          fuel_type: segment.fuelType,
          passengers: segment.passengers,
          van_size: segment.vanSize,
          truck_size: segment.truckSize,
          carbon_footprint: carbonFootprint,
          carbon_compensated: segment.carbonCompensated,
          date: segment.date,
          distance: segment.distance,
          origin: segment.origin,
          destination: segment.destination,
          return_trip: segment.returnTrip,
          frequency: segment.frequency,
          hotel_nights: hotelNightsPerSegment,
          comments: data.comments,
        };
      });

      const { error: segmentsError } = await supabase
        .from('travel_segments')
        .insert(segmentsToInsert);

      if (segmentsError) throw segmentsError;

      return true;
    } catch (error) {
      console.error('Error saving data:', error);
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
        alert(t('error.savingData'));
      }
    }
  };

  const addSegment = () => {
    const segments = methods.getValues('segments') || [];
    methods.setValue('segments', [...segments, defaultSegment]);
  };

  const removeSegment = (index: number) => {
    const segments = methods.getValues('segments') || [];
    if (segments.length > 1) {
      const newSegments = segments.filter((_, i) => i !== index);
      methods.setValue('segments', newSegments);
    }
  };

  const [step, setStep] = useState(1);
  const isPublicOrParticipant = methods.watch('userType') === 'public' || methods.watch('userType') === 'participant';
  const maxSteps = isPublicOrParticipant ? 4 : 3;

  if (step === maxSteps && formData) {
    return <ResultsSection data={formData} onBack={() => setStep(step - 1)} />;
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        {step === 1 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">{t('userType.title')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {userTypes.map((type) => (
                <label
                  key={type}
                  className="relative flex items-center p-4 border rounded-lg cursor-pointer hover:bg-green-50"
                >
                  <input
                    type="radio"
                    {...methods.register('userType')}
                    value={type}
                    className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                  />
                  <span className="ml-3">{t(`userType.${type}`)}</span>
                </label>
              ))}
            </div>
            {methods.formState.errors.userType && (
              <p className="mt-1 text-sm text-red-600">
                {t('userType.required')}
              </p>
            )}
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">{t('transport.segments')}</h2>
            {methods.watch('segments')?.map((_, index) => (
              <TravelSegment
                key={index}
                index={index}
                onRemove={() => removeSegment(index)}
              />
            ))}
            <button
              type="button"
              onClick={addSegment}
              className="mt-4 px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              {t('transport.addSegment')}
            </button>
            {methods.formState.errors.segments && (
              <p className="mt-1 text-sm text-red-600">
                {t('transport.segmentsRequired')}
              </p>
            )}
          </div>
        )}

        {step === 3 && isPublicOrParticipant && (
          <div>
            <h2 className="text-xl font-semibold mb-4">{t('accommodation.title')}</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('accommodation.nights')}
              </label>
              <input
                type="number"
                min="0"
                {...methods.register('hotelNights', { valueAsNumber: true })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              />
              {methods.formState.errors.hotelNights && (
                <p className="mt-1 text-sm text-red-600">
                  {t('accommodation.nightsInvalid')}
                </p>
              )}
            </div>
          </div>
        )}

        {((isPublicOrParticipant && step === 4) || (!isPublicOrParticipant && step === 3)) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('common.comments')}
            </label>
            <textarea
              {...methods.register('comments')}
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
              {t('common.back')}
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting
              ? t('common.submitting')
              : step < (isPublicOrParticipant ? 4 : 3)
              ? t('common.next')
              : t('common.submit')}
          </button>
        </div>
      </form>
    </FormProvider>
  );
};

export default TravelForm;