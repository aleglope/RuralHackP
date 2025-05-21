import React from 'react';
import { useTranslation } from 'react-i18next';
import { TravelData } from '../types';
import { calculateCarbonFootprint, calculateTreesNeeded, calculateTotalDistance } from '../utils/calculations';
import { Button } from './ui/button';
import { Leaf, Route, Building } from 'lucide-react';

interface ResultsSectionProps {
  data: TravelData;
  onBack: () => void;
}

const ResultsSection: React.FC<ResultsSectionProps> = ({ data, onBack }) => {
  const { t } = useTranslation();

  const carbonFootprint = calculateCarbonFootprint(data);
  const treesNeeded = calculateTreesNeeded(carbonFootprint);
  const { totalDistance, byType } = calculateTotalDistance(data.segments);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="stat-card">
          <div className="flex items-center gap-2 text-success">
            <Leaf className="h-4 w-4" />
            <h3 className="font-medium">{t('results.carbonFootprint')}</h3>
          </div>
          <p className="stat-value">{carbonFootprint.toFixed(2)} kg CO₂e</p>
          <p className="stat-label">{t('results.treesNeeded', { count: Math.ceil(treesNeeded) })}</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2 text-primary">
            <Route className="h-4 w-4" />
            <h3 className="font-medium">{t('results.totalDistance')}</h3>
          </div>
          <p className="stat-value">{totalDistance.toFixed(2)} km</p>
          <p className="stat-label">{t('results.distanceLabel')}</p>
        </div>

        {data.hotelNights && (
          <div className="stat-card">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building className="h-4 w-4" />
              <h3 className="font-medium">{t('results.accommodation')}</h3>
            </div>
            <p className="stat-value">{data.hotelNights}</p>
            <p className="stat-label">{t('results.nightsLabel')}</p>
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">{t('results.byTransportType')}</h3>
        <div className="space-y-4">
          {Object.entries(byType).map(([type, distance]) => (
            distance > 0 && (
              <div key={type} className="flex items-center justify-between">
                <span className="text-muted-foreground">{t(`transport.${type}`)}</span>
                <span className="font-medium">{distance.toFixed(2)} km</span>
              </div>
            )
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onBack}
        >
          {t('common.back')}
        </Button>
        <Button
          variant="default"
          onClick={() => window.print()}
        >
          {t('results.print')}
        </Button>
      </div>
    </div>
  );
};

export default ResultsSection;