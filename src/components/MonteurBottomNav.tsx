import { useNavigate } from 'react-router-dom';
import { useBonusSettings } from '@/context/BonusSettingsContext';
import { Truck, Trophy, Briefcase } from 'lucide-react';

interface MonteurBottomNavProps {
  active: 'vehicles' | 'performance' | 'montage';
}

const MonteurBottomNav: React.FC<MonteurBottomNavProps> = ({ active }) => {
  const navigate = useNavigate();
  const { settings } = useBonusSettings();
  const perfEnabled = settings?.module_performance_enabled ?? true;
  const montageEnabled = settings?.module_klyma_os_enabled ?? true;
  const lagerEnabled = settings?.module_fahrzeuglager_enabled ?? true;

  const btn = (key: string, label: string, icon: React.ReactNode, path: string) => (
    <button
      key={key}
      onClick={() => navigate(path)}
      className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors ${
        active === key ? 'text-primary font-medium' : 'text-muted-foreground'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 border-t bg-card">
      <div className="flex">
        {montageEnabled && btn('montage', 'Montage', <Briefcase className="h-5 w-5" />, '/montage')}
        {lagerEnabled && btn('vehicles', 'Fahrzeug', <Truck className="h-5 w-5" />, '/vehicles')}
        {perfEnabled && btn('performance', 'Performance', <Trophy className="h-5 w-5" />, '/performance')}
      </div>
    </nav>
  );
};

export default MonteurBottomNav;
