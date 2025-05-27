import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import LanguageSelector from "@/ui/LanguageSelector";
import { ThemeToggleButton } from "@/ui";

const Header = () => {
  const { t } = useTranslation();
  const logoUrl = "/images/LogoRHackers.svg";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background backdrop-blur supports-[backdrop-filter]:bg-background/90">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <Link to="/" className="flex items-center space-x-2">
          <img
            src={logoUrl}
            alt={t("logoAltText") || "Equilátero DSC Logo"}
            className="h-8 w-auto"
          />
          <span className="font-semibold text-primary">Equilátero DSC</span>
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-2 md:space-x-4">
          <LanguageSelector />
          <ThemeToggleButton />
        </div>
      </div>
    </header>
  );
};

export default Header;
