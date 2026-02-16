import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Smartphone, Share, PlusSquare, MoreVertical, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DownloadPage = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">App installieren</h1>
        </div>

        {isInstalled ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-lg font-medium text-foreground">
                BERT by Klyma ist bereits installiert!
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Du kannst die App direkt von deinem Homescreen starten.
              </p>
            </CardContent>
          </Card>
        ) : deferredPrompt ? (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Download className="h-5 w-5 text-primary" />
                Jetzt installieren
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Installiere BERT by Klyma als App auf deinem Gerät für schnelleren Zugriff.
              </p>
              <Button onClick={handleInstall} className="w-full" size="lg">
                <Download className="mr-2 h-5 w-5" />
                App installieren
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Smartphone className="h-5 w-5 text-primary" />
                App installieren
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Du kannst BERT by Klyma wie eine normale App auf deinem Homescreen installieren – ohne App Store!
              </p>
            </CardContent>
          </Card>
        )}

        {isIOS && !isInstalled && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Anleitung für iPhone / iPad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Step number={1} icon={<Share className="h-4 w-4" />}>
                Tippe unten auf das <strong>Teilen-Symbol</strong> (Quadrat mit Pfeil nach oben)
              </Step>
              <Step number={2} icon={<PlusSquare className="h-4 w-4" />}>
                Scrolle nach unten und tippe auf <strong>„Zum Home-Bildschirm"</strong>
              </Step>
              <Step number={3}>
                Tippe auf <strong>„Hinzufügen"</strong> – fertig!
              </Step>
            </CardContent>
          </Card>
        )}

        {isAndroid && !isInstalled && !deferredPrompt && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Anleitung für Android</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Step number={1} icon={<MoreVertical className="h-4 w-4" />}>
                Tippe oben rechts auf das <strong>Drei-Punkte-Menü</strong>
              </Step>
              <Step number={2} icon={<Download className="h-4 w-4" />}>
                Tippe auf <strong>„App installieren"</strong> oder <strong>„Zum Startbildschirm hinzufügen"</strong>
              </Step>
              <Step number={3}>
                Bestätige mit <strong>„Installieren"</strong> – fertig!
              </Step>
            </CardContent>
          </Card>
        )}

        {!isIOS && !isAndroid && !isInstalled && !deferredPrompt && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Anleitung für Desktop</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Step number={1}>
                Klicke auf das <strong>Installations-Symbol</strong> in der Adressleiste deines Browsers
              </Step>
              <Step number={2}>
                Bestätige mit <strong>„Installieren"</strong>
              </Step>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

const Step = ({
  number,
  icon,
  children,
}: {
  number: number;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="flex gap-3 items-start">
    <div className="flex-shrink-0 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
      {number}
    </div>
    <div className="text-sm text-foreground flex items-center gap-1.5 pt-0.5">
      {icon} <span>{children}</span>
    </div>
  </div>
);

export default DownloadPage;
