import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import TravelForm from "./components/TravelForm";
import EventSelection from "./components/EventSelection";
import EventCreation from "./components/EventCreation";
import EventResults from "./components/EventResults";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./components/Login";
import DatabaseDebugger from "./components/DatabaseDebugger";
import RootLayout from "./components/RootLayout";

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
        element: <Login />,
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
