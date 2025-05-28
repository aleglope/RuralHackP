import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { signIn, isAuthenticated } from "@/services/authService";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import Waves from "@/ui/Waves";

const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      if (await isAuthenticated()) {
        navigate("/event-creation");
      }
    };
    checkAuth();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: signInError } = await signIn(email, password);
      if (signInError) throw signInError;
      navigate("/");
    } catch (err) {
      setError(t("auth.invalidCredentials"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-lg shadow-xl overflow-hidden border border-border bg-transparent">
        <div className="absolute inset-0 z-0 opacity-40 dark:opacity-30">
          <Waves
            lineColor="hsl(var(--primary))"
            waveSpeedX={0.02}
            waveSpeedY={0.01}
            waveAmpX={30}
            waveAmpY={15}
            friction={0.9}
            tension={0.01}
            maxCursorMove={100}
            xGap={15}
            yGap={40}
            className="!bg-card"
          />
        </div>

        <div className="relative z-10 p-6 space-y-6 bg-card/50 dark:bg-card/40 backdrop-blur-md">
          <div className="text-center pt-2">
            <h1 className="text-2xl font-bold tracking-tight text-card-foreground">
              {t("auth.login")}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t("auth.loginDescription")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="login-page-email"
                className="text-card-foreground"
              >
                {t("auth.email")}
              </Label>
              <Input
                id="login-page-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder={t("auth.emailPlaceholder") || "name@example.com"}
                className="bg-input/80 dark:bg-input/70 placeholder:text-muted-foreground/70 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="login-page-password"
                className="text-card-foreground"
              >
                {t("auth.password")}
              </Label>
              <Input
                id="login-page-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="bg-input/80 dark:bg-input/70 placeholder:text-muted-foreground/70 focus:ring-primary"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive text-center pt-1">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full !mt-6" disabled={loading}>
              {loading ? t("auth.loggingIn") : t("auth.login")}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
