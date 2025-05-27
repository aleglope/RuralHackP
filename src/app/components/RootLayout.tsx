import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Header from "@/app/components/Header"; // Asumiendo que Header está en la misma carpeta / mas adelante hay que aujustar las rutas para que el proyecto este organizado

const RootLayout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const navigationEntries = performance.getEntriesByType("navigation");
    if (
      navigationEntries.length > 0 &&
      (navigationEntries[0] as PerformanceNavigationTiming).type === "reload"
    ) {
      navigate("/");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-screen-xl py-8">
        <Outlet />
      </main>
      <footer className="border-t">
        <div className="container flex h-14 max-w-screen-2xl items-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Equilátero DSC
        </div>
      </footer>
    </div>
  );
};

export default RootLayout;
