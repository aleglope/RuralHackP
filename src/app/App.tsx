import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// Corregir imports usando alias o rutas relativas correctas desde project/src/app/
import TravelForm from "@/features/form/TravelForm";
import EventSelection from "@/features/form/EventSelection";
import EventCreation from "@/features/event-creation/pages/EventCreationPage"; // Asume export default EventCreation o export const EventCreation
import EventResults from "@/features/dashboard/EventResults";
import ProtectedRoute from "@/features/auth/components/ProtectedRoute"; // Asumiendo esta ubicación
import LoginPage from "@/features/auth/pages/LoginPage"; // Asumiendo esta ubicación y que exporta LoginPage o Login
import DatabaseDebugger from "@/features/dashboard/DatabaseDebugger";
import RootLayout from "@/app/components/RootLayout"; // Asumiendo esta ubicación

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <EventSelection />,
      },
      {
        path: "event/:slug",
        element: <TravelForm />,
      },
      {
        path: "event/:slug/results",
        element: <EventResults />,
      },
      {
        path: "login",
        element: <LoginPage />, // O <Login /> dependiendo de la exportación
      },
      {
        path: "event-creation",
        element: (
          <ProtectedRoute>
            <EventCreation />
          </ProtectedRoute>
        ),
      },
      {
        path: "debug",
        element: <DatabaseDebugger />,
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
