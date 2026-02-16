import { useNavigate } from 'react-router-dom';
import { useBonusSettings } from '@/context/BonusSettingsContext';
import { Truck, Trophy } from 'lucide-react';

interface MonteurBottomNavProps {
  active: 'vehicles' | 'performance';
}

const MonteurBottomNav: React.FC<MonteurBottomNavProps> = ({ active }) => {
  const navigate = useNavigate();
  const { settings } = useBonusSettings();
  const perfEnabled = settings?.module_performance_enabled ?? true;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 border-t bg-card">
      <div className="flex">
        <button
          onClick={() => navigate('/vehicles')}
          className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors ${
            active === 'vehicles'
              ? 'text-primary font-medium'
              : 'text-muted-foreground'
          }`}
        >
          <Truck className="h-5 w-5" />
          Fahrzeug
        </button>
        {perfEnabled && (
          <button
            onClick={() => navigate('/performance')}
            className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors ${
              active === 'performance'
                ? 'text-primary font-medium'
                : 'text-muted-foreground'
            }`}
          >
            <Trophy className="h-5 w-5" />
            Performance
          </button>
        )}
      </div>
    </nav>
  );
};

export default MonteurBottomNav;
