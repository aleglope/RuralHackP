import React, { useState, useEffect } from "react";
import { supabase } from "@/services/supabaseClient";

interface DebugData {
  events: any[];
  submissions: any[];
  segments: any[];
}

const DatabaseDebugger: React.FC = () => {
  const [debugData, setDebugData] = useState<DebugData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDebugData = async () => {
    setLoading(true);
    try {
      // Obtener eventos
      const { data: events, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (eventsError) throw eventsError;

      // Obtener submissions
      const { data: submissions, error: submissionsError } = await supabase
        .from("travel_data_submissions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (submissionsError) throw submissionsError;

      // Obtener segmentos con más detalle
      const { data: segments, error: segmentsError } = await supabase
        .from("travel_segments")
        .select(
          `
          *,
          travel_data_submissions(
            id,
            user_type,
            event_id,
            events(
              name,
              slug
            )
          )
        `
        )
        .order("created_at", { ascending: false })
        .limit(20);

      if (segmentsError) throw segmentsError;

      setDebugData({
        events: events || [],
        submissions: submissions || [],
        segments: segments || [],
      });
    } catch (error) {
      console.error("Error fetching debug data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebugData();
  }, []);

  const testRelationshipQuery = async () => {
    try {
      console.log("Testing relationship query...");

      // Query optimizada con JOIN como en EventResults
      const { data: joinData, error: joinError } = await supabase
        .from("travel_segments")
        .select(
          `
          *,
          travel_data_submissions!inner(
            id,
            user_type,
            total_hotel_nights,
            event_id,
            events(
              id,
              name,
              slug
            )
          )
        `
        )
        .limit(5);

      if (joinError) {
        console.error("JOIN Query Error:", joinError);
      } else {
        console.log("JOIN Query Success:", joinData);
      }
    } catch (error) {
      console.error("Test query failed:", error);
    }
  };

  const clearDatabase = async () => {
    if (
      window.confirm(
        "⚠️ ¿Estás seguro de que quieres eliminar TODOS los datos de prueba? Esta acción no se puede deshacer."
      )
    ) {
      try {
        // Eliminar en orden correcto (por las foreign keys)
        await supabase
          .from("travel_segments")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000");
        await supabase.from("travel_data_submissions").delete().neq("id", 0);

        console.log("Database cleared successfully");
        await fetchDebugData(); // Refresh data
      } catch (error) {
        console.error("Error clearing database:", error);
      }
    }
  };

  if (!debugData) {
    return <div className="p-6">Loading debug data...</div>;
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔍 Database Debugger</h1>

        <div className="mb-6 flex gap-2">
          <button
            onClick={fetchDebugData}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "🔄 Refresh Data"}
          </button>

          <button
            onClick={testRelationshipQuery}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            🧪 Test JOIN Query
          </button>

          <button
            onClick={clearDatabase}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            🗑️ Clear All Data
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Events */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-3 text-blue-600">
              📅 Events ({debugData.events.length})
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {debugData.events.map((event) => (
                <div
                  key={event.id}
                  className="border p-3 rounded text-sm bg-blue-50"
                >
                  <div>
                    <strong>ID:</strong>{" "}
                    <code className="text-xs">{event.id}</code>
                  </div>
                  <div>
                    <strong>Name:</strong> {event.name}
                  </div>
                  <div>
                    <strong>Slug:</strong> <code>{event.slug}</code>
                  </div>
                  <div>
                    <strong>Active:</strong>{" "}
                    <span
                      className={
                        event.is_active ? "text-green-600" : "text-red-600"
                      }
                    >
                      {event.is_active ? "✅ Yes" : "❌ No"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(event.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submissions */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-3 text-green-600">
              📝 Submissions ({debugData.submissions.length})
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {debugData.submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="border p-3 rounded text-sm bg-green-50"
                >
                  <div>
                    <strong>ID:</strong>{" "}
                    <code className="text-xs">{submission.id}</code>
                  </div>
                  <div>
                    <strong>Event ID:</strong>{" "}
                    <code className="text-xs">{submission.event_id}</code>
                  </div>
                  <div>
                    <strong>User Type:</strong>{" "}
                    <span className="bg-green-200 px-2 py-1 rounded text-xs">
                      {submission.user_type}
                    </span>
                  </div>
                  <div>
                    <strong>Hotel Nights:</strong>{" "}
                    {submission.total_hotel_nights || 0}
                  </div>
                  {submission.comments && (
                    <div>
                      <strong>Comments:</strong>{" "}
                      <em>"{submission.comments}"</em>
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(submission.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Segments */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-3 text-purple-600">
              🛣️ Segments ({debugData.segments.length})
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {debugData.segments.map((segment) => (
                <div
                  key={segment.id}
                  className="border p-3 rounded text-sm bg-purple-50"
                >
                  <div>
                    <strong>ID:</strong>{" "}
                    <code className="text-xs">{segment.id}</code>
                  </div>
                  <div>
                    <strong>Submission ID:</strong>{" "}
                    <code className="text-xs">{segment.submission_id}</code>
                  </div>

                  {/* Información del viaje */}
                  <div className="mt-2 p-2 bg-white rounded border-l-4 border-purple-400">
                    <div>
                      <strong>🚗 Vehicle:</strong>{" "}
                      <span className="bg-purple-200 px-2 py-1 rounded text-xs">
                        {segment.vehicle_type}
                      </span>
                    </div>
                    {segment.fuel_type && (
                      <div>
                        <strong>⛽ Fuel:</strong> {segment.fuel_type}
                      </div>
                    )}
                    <div>
                      <strong>📍 Route:</strong> {segment.origin || "N/A"} →{" "}
                      {segment.destination || "N/A"}
                    </div>
                    <div>
                      <strong>📏 Distance:</strong> {segment.distance || 0} km
                    </div>
                    <div>
                      <strong>🌱 Carbon:</strong>{" "}
                      {segment.calculated_carbon_footprint || 0} kg CO₂
                    </div>
                    {segment.passengers && (
                      <div>
                        <strong>👥 Passengers:</strong> {segment.passengers}
                      </div>
                    )}
                    {segment.segment_order && (
                      <div>
                        <strong>📊 Order:</strong> {segment.segment_order}
                      </div>
                    )}
                    {segment.date && (
                      <div>
                        <strong>📅 Date:</strong> {segment.date}
                      </div>
                    )}
                    {segment.carbon_compensated && (
                      <div>
                        <strong>🌳 Compensated:</strong> ✅
                      </div>
                    )}
                  </div>

                  {/* Información del evento relacionado */}
                  {segment.travel_data_submissions?.events && (
                    <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                      <strong>Event:</strong>{" "}
                      {segment.travel_data_submissions.events.name} (
                      {segment.travel_data_submissions.events.slug})
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resumen estadístico */}
        <div className="mt-6 bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">📊 Quick Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-3 bg-blue-50 rounded">
              <div className="text-2xl font-bold text-blue-600">
                {debugData.events.length}
              </div>
              <div className="text-gray-600">Events</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded">
              <div className="text-2xl font-bold text-green-600">
                {debugData.submissions.length}
              </div>
              <div className="text-gray-600">Submissions</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded">
              <div className="text-2xl font-bold text-purple-600">
                {debugData.segments.length}
              </div>
              <div className="text-gray-600">Segments</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded">
              <div className="text-2xl font-bold text-orange-600">
                {debugData.segments
                  .reduce(
                    (total, seg) =>
                      total + (seg.calculated_carbon_footprint || 0),
                    0
                  )
                  .toFixed(1)}
              </div>
              <div className="text-gray-600">Total CO₂ (kg)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseDebugger;
