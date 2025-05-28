import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import Waves from "@/ui/Waves";

const RootLayout = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

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
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="relative w-full h-[300px] overflow-hidden">
        <Waves
          lineColor="hsl(var(--foreground))"
          waveSpeedX={0.02}
          waveSpeedY={0.01}
          waveAmpX={40}
          waveAmpY={20}
          friction={0.9}
          tension={0.01}
          maxCursorMove={120}
          xGap={12}
          yGap={36}
          className="bg-background/80 dark:bg-background/80 backdrop-blur-sm"
        >
          <div className="text-left pointer-events-auto w-full h-full flex flex-col justify-center px-4 sm:px-6 lg:px-8">
            <h1 className="text-5xl font-bold tracking-tight text-foreground">
              {t("events.selectTitle")}
            </h1>
            <p className="text-muted-foreground max-w-md mt-1">
              {t("events.selectDescription")}
            </p>
          </div>
        </Waves>
      </div>
      <main className="container max-w-screen-xl py-8 flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default RootLayout;
