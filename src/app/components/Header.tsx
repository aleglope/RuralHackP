import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import LanguageSelector from "@/ui/LanguageSelector";
import { ThemeToggleButton } from "@/ui";
import { Button } from "@/ui/button";
import {
  supabase,
  getUserRole,
  signOut as supabaseSignOut,
} from "@/services/authService";

const Header = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const logoUrl = "/images/LogoRHackers.svg";

  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const checkUserRole = async (
      user: import("@supabase/supabase-js").User | null
    ) => {
      if (user) {
        const role = await getUserRole();
        setIsAdmin(role === "admin");
      } else {
        setIsAdmin(false);
      }
      setLoadingAuth(false);
    };

    const setInitialAuthState = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      checkUserRole(session?.user ?? null);
    };
    setInitialAuthState();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setLoadingAuth(true);
        checkUserRole(session?.user ?? null);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabaseSignOut();
    setIsAdmin(false);
    navigate("/");
  };

  const handleLogin = () => {
    navigate("/login");
  };

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
          {!loadingAuth && (
            <>
              {isAdmin ? (
                <Button variant="outline" onClick={handleLogout}>
                  {t("auth.logoutAdmin")}
                </Button>
              ) : (
                <Button variant="outline" onClick={handleLogin}>
                  {t("auth.loginAdmin")}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
