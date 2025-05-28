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
      <div className="flex items-center justify-center min-h-[calc(100vh-var(--header-height,80px))] fixed inset-0">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* El Título y Descripción han sido eliminados de aquí */}

      {/* Contenedor de las Tarjetas de Evento */}
      <div
        className="flex justify-center items-start w-full px-4 sm:px-6 lg:px-8"
        style={{
          paddingTop: "200px",
          paddingBottom: "50px",
        }}
      >
        {events.length === 0 && !loading ? (
          <div className="text-center py-8 mt-10">
            <p className="text-muted-foreground text-lg">
              {t("events.noEvents")}
            </p>
          </div>
        ) : (
          <div
            className={`flex flex-wrap gap-6 ${
              events.length <= 3 ? "justify-center" : "justify-start"
            }`}
          >
            {events.map((event) => (
              <div
                key={event.id}
                className="group relative rounded-lg border p-6 hover:shadow-lg transition-shadow bg-card flex flex-col w-full sm:w-[calc(50%-1.5rem)] lg:w-[calc(33.333%-1.5rem)] max-w-sm"
                style={{ flex: "1 0 auto" }}
              >
                <div className="flex items-center gap-4">
                  <Calendar className="h-6 w-6 text-primary" />
                  <h2 className="font-semibold tracking-tight text-card-foreground">
                    {event.name}
                  </h2>
                </div>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-3 flex-grow">
                  {event.description}
                </p>
                <div className="mt-4 text-xs text-muted-foreground">
                  {new Date(event.start_date).toLocaleDateString()} -{" "}
                  {new Date(event.end_date).toLocaleDateString()}
                </div>
                <div className="mt-6 flex flex-col gap-2">
                  <Button
                    className="w-full"
                    onClick={() => navigate(`/event/${event.slug}`)}
                  >
                    {t("events.select")}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full flex gap-2 items-center justify-center"
                    onClick={() => navigate(`/event/${event.slug}/results`)}
                  >
                    <BarChart2 className="h-4 w-4" />
                    <span>{t("events.results")}</span>
                  </Button>
                  {isAdmin && (
                    <Button
                      variant="destructive"
                      className="w-full mt-1 flex gap-2 items-center justify-center"
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
        )}
      </div>
    </div>
  );
};

export default EventSelection;
