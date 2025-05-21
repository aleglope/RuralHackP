import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Calendar, BarChart2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';

interface Event {
  id: string;
  slug: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
}

const EventSelection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .order('start_date', { ascending: true });

      if (error) {
        console.error('Error fetching events:', error);
      } else {
        setEvents(data || []);
      }
      setLoading(false);
    };

    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('events.selectTitle')}</h1>
        <p className="text-muted-foreground">{t('events.selectDescription')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <div
            key={event.id}
            className="group relative rounded-lg border p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <Calendar className="h-6 w-6 text-primary" />
              <h2 className="font-semibold tracking-tight">{event.name}</h2>
            </div>
            
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {event.description}
            </p>
            
            <div className="mt-4 text-sm text-muted-foreground">
              {new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                className="flex-1"
                onClick={() => navigate(`/event/${event.slug}`)}
              >
                {t('events.select')}
              </Button>
              <Button
                variant="outline"
                className="flex gap-2"
                onClick={() => navigate(`/event/${event.slug}/results`)}
              >
                <BarChart2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">{t('events.noEvents')}</p>
        </div>
      )}
    </div>
  );
};

export default EventSelection;