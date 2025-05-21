import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import TravelForm from './components/TravelForm';
import EventSelection from './components/EventSelection';
import EventCreation from './components/EventCreation';
import EventResults from './components/EventResults';
import LanguageSelector from './components/LanguageSelector';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';

const router = createBrowserRouter([
  {
    path: "/",
    element: <EventSelection />,
  },
  {
    path: "/event/:slug",
    element: <TravelForm />,
  },
  {
    path: "/event/:slug/results",
    element: <EventResults />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/event-creation",
    element: (
      <ProtectedRoute>
        <EventCreation />
      </ProtectedRoute>
    ),
  },
]);

function App() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center">
          <div className="flex items-center space-x-2">
            <Globe className="h-6 w-6 text-primary" />
            <span className="font-semibold">Equilátero DSC</span>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <LanguageSelector />
          </div>
        </div>
      </header>

      <main className="container max-w-screen-xl py-8">
        <RouterProvider router={router} />
      </main>

      <footer className="border-t">
        <div className="container flex h-14 max-w-screen-2xl items-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Equilátero DSC
        </div>
      </footer>
    </div>
  );
}

export default App;