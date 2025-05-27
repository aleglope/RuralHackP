import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Calendar, BarChart2, Trash2 } from "lucide-react";
import { supabase, getUserRole } from "@/services/authService";
import { Button } from "@/ui";

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
  const [isAdmin, setIsAdmin] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const role = await getUserRole();
      setIsAdmin(role === "admin");

      // Fetch eventos
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("is_active", true)
        .order("start_date", { ascending: true });

      if (error) {
        console.error("Error fetching events:", error);
      } else {
        setEvents(data || []);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleDeleteEvent = async (eventId: string, eventName: string) => {
    if (window.confirm(t("events.confirmDelete", { eventName }))) {
      setDeletingId(eventId);
      try {
        const { error } = await supabase
          .from("events")
          .delete()
          .eq("id", eventId);

        if (error) {
          throw error;
        }
        setEvents((prevEvents) =>
          prevEvents.filter((event) => event.id !== eventId)
        );
        alert(t("events.deleteSuccess", { eventName }));
      } catch (error) {
        console.error("Error deleting event:", error);
        alert(t("events.deleteError", { eventName }));
      } finally {
        setDeletingId(null);
      }
    }
  };

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
        <h1 className="text-3xl font-bold tracking-tight">
          {t("events.selectTitle")}
        </h1>
        <p className="text-muted-foreground">{t("events.selectDescription")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <div
            key={event.id}
            className="group relative rounded-lg border p-6 hover:shadow-md transition-shadow bg-card"
          >
            <div className="flex items-center gap-4">
              <Calendar className="h-6 w-6 text-primary" />
              <h2 className="font-semibold tracking-tight text-card-foreground">
                {event.name}
              </h2>
            </div>

            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {event.description}
            </p>

            <div className="mt-4 text-sm text-muted-foreground">
              {new Date(event.start_date).toLocaleDateString()} -{" "}
              {new Date(event.end_date).toLocaleDateString()}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                className="flex-1 min-w-[calc(50%-0.25rem)]"
                onClick={() => navigate(`/event/${event.slug}`)}
              >
                {t("events.select")}
              </Button>
              <Button
                variant="outline"
                className="flex-1 min-w-[calc(50%-0.25rem)] flex gap-2"
                onClick={() => navigate(`/event/${event.slug}/results`)}
              >
                <BarChart2 className="h-4 w-4" />
                <span>{t("events.results")}</span>
              </Button>
              {isAdmin && (
                <Button
                  variant="destructive"
                  className="w-full mt-2 flex gap-2 items-center justify-center"
                  onClick={() => handleDeleteEvent(event.id, event.name)}
                  disabled={deletingId === event.id}
                >
                  {deletingId === event.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-destructive-foreground"></div>
                      {t("common.deleting")}
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      {t("common.delete")}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {events.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">{t("events.noEvents")}</p>
        </div>
      )}
    </div>
  );
};

export default EventSelection;
