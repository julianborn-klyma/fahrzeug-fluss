import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Rocket } from 'lucide-react';

interface MonteurBonusCardProps {
  totalBonus: number;
  periodLabel: string;
}

const MonteurBonusCard: React.FC<MonteurBonusCardProps> = ({ totalBonus, periodLabel }) => {
  const displayBonus = Math.abs(totalBonus);

  return (
    <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30">
      <CardHeader className="px-4 py-3">
        <CardTitle className="text-sm flex items-center gap-2 text-green-700 dark:text-green-400">
          <Rocket className="h-4 w-4" />
          Halbjahresbonus – {periodLabel}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <p className="text-2xl font-bold text-green-700 dark:text-green-400">{displayBonus.toFixed(0)} €</p>
      </CardContent>
    </Card>
  );
};

export default MonteurBonusCard;
