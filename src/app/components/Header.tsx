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
      try {
        if (user) {
          const role = await getUserRole();
          setIsAdmin(role === "admin");
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error checking user role in Header:", error);
        setIsAdmin(false); // Estado seguro en caso de error
      } finally {
        setLoadingAuth(false); // Asegurar que setLoadingAuth siempre se llame
      }
    };

    const setInitialAuthState = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      checkUserRole(session?.user ?? null);
    };
    setInitialAuthState();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
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
      <div className="container flex h-24 max-w-screen-2xl items-center">
        <Link to="/" className="flex items-center space-x-5 group">
          <img
            src={logoUrl}
            alt={t("logoAltText") || "Isotipo Equilátero DSC"}
            className="h-12 w-auto transform origin-center transition-transform duration-700 ease-in-out group-hover:scale-[4] group-hover:rotate-[360deg] group-hover:translate-y-[50px] group-hover:-translate-x-[100px]"
          />
          <img
            src="/images/equilatero.svg"
            alt="Equilátero DSC Nombre"
            className="h-20 w-auto ml-[10px] transform origin-center transition-transform duration-700 ease-in-out group-hover:scale-[4] group-hover:rotate-[360deg] group-hover:translate-y-[50px] group-hover:translate-x-[100px]"
          />
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-2 md:space-x-4">
          <LanguageSelector />
          <ThemeToggleButton />
          {!loadingAuth && (
            <>
              {isAdmin ? (
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="hover:bg-muted hover:text-muted-foreground"
                >
                  {t("auth.logoutAdmin")}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleLogin}
                  className="hover:bg-muted hover:text-muted-foreground"
                >
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
