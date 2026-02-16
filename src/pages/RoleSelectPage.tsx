import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Wrench, ChevronRight } from 'lucide-react';
import klymaLogo from '@/assets/klyma-logo.png';

const RoleSelectPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <img alt="Klyma Logo" className="h-8 w-8" src="/lovable-uploads/2ecf3242-ffa7-4d15-aa45-b28ea27685c1.png" />
            <h1 className="text-3xl font-bold tracking-tight text-foreground">BERT by Klyma </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Willkommen, {user?.name || user?.email}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Welchen Bereich möchtest du nutzen?
          </p>
        </div>

        <div className="space-y-3">
          <Card
            className="cursor-pointer transition-all hover:border-primary/40 hover:shadow-sm active:scale-[0.99]"
            onClick={() => navigate('/admin', { replace: true })}>

            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">Administration</p>
                <p className="text-sm text-muted-foreground">Dashboard & Einstellungen</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition-all hover:border-primary/40 hover:shadow-sm active:scale-[0.99]"
            onClick={() => navigate('/vehicles', { replace: true })}>

            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Wrench className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">Monteur</p>
                <p className="text-sm text-muted-foreground">Fahrzeugbestand prüfen</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>);

};

export default RoleSelectPage;