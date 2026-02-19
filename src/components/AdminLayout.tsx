import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useBonusSettings } from '@/context/BonusSettingsContext';
import { Button } from '@/components/ui/button';
import { LogOut, Warehouse, Settings, ArrowRightLeft, Trophy, Briefcase, Calculator } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useMyModuleAccess } from '@/hooks/useModuleAccess';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, signOut, hasRole } = useAuth();
  const { settings } = useBonusSettings();
  const { data: myModules = [] } = useMyModuleAccess();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = hasRole('admin');
  const isOffice = hasRole('office') && !isAdmin && !hasRole('teamleiter');

  // Module visible = globally enabled AND (user is admin OR user has explicit access)
  const canSee = (moduleKey: string, globalEnabled: boolean) => {
    if (!globalEnabled) return false;
    if (isAdmin) return true;
    return myModules.includes(moduleKey);
  };

  const perfEnabled = !isOffice && canSee('module_performance_enabled', settings?.module_performance_enabled ?? true);
  const lagerEnabled = canSee('module_fahrzeuglager_enabled', settings?.module_fahrzeuglager_enabled ?? true);
  const montageEnabled = !isOffice && canSee('module_klyma_os_enabled', settings?.module_klyma_os_enabled ?? true);
  const kalkulationEnabled = canSee('module_kalkulation_enabled', settings?.module_kalkulation_enabled ?? true);
  const isSettings = location.pathname.startsWith('/admin/settings');
  const isPerformance = location.pathname.startsWith('/admin/performance');
  const isMontage = location.pathname.startsWith('/admin/montage');
  const isKalkulation = location.pathname.startsWith('/admin/kalkulation');
  const isDashboard = !isSettings && !isPerformance && !isMontage && !isKalkulation;

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-8">
            <h1 className="text-lg font-bold text-foreground tracking-tight">KLYMA</h1>
            <nav className="flex items-center gap-1">
              {montageEnabled && (
                <Button
                  variant={isMontage ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => navigate('/admin/montage')}
                  className="gap-2"
                >
                  <Briefcase className="h-4 w-4" />
                  Montage
                </Button>
              )}
              {kalkulationEnabled && (
                <Button
                  variant={isKalkulation ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => navigate('/admin/kalkulation')}
                  className="gap-2"
                >
                  <Calculator className="h-4 w-4" />
                  Kalkulation
                </Button>
              )}
              {lagerEnabled && (
                <Button
                  variant={isDashboard ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => navigate('/admin')}
                  className="gap-2"
                >
                  <Warehouse className="h-4 w-4" />
                  Fahrzeuglager
                </Button>
              )}
              {perfEnabled && (
                <Button
                  variant={isPerformance ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => navigate('/admin/performance')}
                  className="gap-2"
                >
                  <Trophy className="h-4 w-4" />
                  Performance
                </Button>
              )}
              <Button
                variant={isSettings ? 'default' : 'ghost'}
                size="sm"
                onClick={() => navigate('/admin/settings')}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                Einstellungen
              </Button>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{user?.name || user?.email}</span>
            {(hasRole('admin') || hasRole('teamleiter') || hasRole('office')) && hasRole('monteur') && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => navigate('/vehicles')}>
                    <ArrowRightLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zur Monteur-App</TooltipContent>
              </Tooltip>
            )}
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
};

export default AdminLayout;
