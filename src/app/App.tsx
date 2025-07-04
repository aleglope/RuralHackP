import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import TravelForm from "@/features/form/TravelForm";
import EventSelection from "@/features/form/EventSelection";
import EventCreation from "@/features/event-creation/pages/EventCreationPage";
import EventResults from "@/features/dashboard/EventResults";
import AdminProtectedRoute from "@/features/auth/components/AdminProtectedRoute";
import LoginPage from "@/features/auth/pages/LoginPage";
import DatabaseDebugger from "@/features/dashboard/DatabaseDebugger";
import RootLayout from "@/app/components/RootLayout";

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
        element: <LoginPage />,
      },
      {
        path: "event-creation",
        element: (
          <AdminProtectedRoute>
            <EventCreation />
          </AdminProtectedRoute>
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
