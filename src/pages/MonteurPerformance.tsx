import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useBonusSettings } from '@/context/BonusSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import MonteurBottomNav from '@/components/MonteurBottomNav';
import MonteurBonusCard from '@/components/performance/MonteurBonusCard';
import MonteurReviewHistory from '@/components/performance/MonteurReviewHistory';
import { LogOut, ArrowRightLeft } from 'lucide-react';

const MonteurPerformance = () => {
  const { user, signOut, hasRole } = useAuth();
  const { getResult } = useBonusSettings();
  const navigate = useNavigate();

  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('performance_reviews')
        .select('*')
        .eq('monteur_id', user.id)
        .eq('status', 'approved')
        .order('review_month', { ascending: false });
      setReviews(data || []);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  // Assign each review_month to a period
  const getPeriodForMonth = (reviewMonth: string): { label: string; sortKey: string } => {
    const d = new Date(reviewMonth);
    const month = d.getMonth(); // 0=Jan, 11=Dec
    const year = d.getFullYear();
    if (month === 11) {
      // December -> 1. Halbjahr next year
      return { label: `1. Halbjahr ${year + 1}`, sortKey: `${year + 1}-1` };
    } else if (month <= 4) {
      // Jan-May -> 1. Halbjahr current year
      return { label: `1. Halbjahr ${year}`, sortKey: `${year}-1` };
    } else {
      // Jun-Nov -> 2. Halbjahr current year
      return { label: `2. Halbjahr ${year}`, sortKey: `${year}-2` };
    }
  };

  // Group reviews by period
  const periodMap = new Map<string, { label: string; sortKey: string; total: number }>();
  reviews.forEach(r => {
    const { label, sortKey } = getPeriodForMonth(r.review_month);
    const existing = periodMap.get(sortKey);
    if (existing) {
      existing.total += Number(r.monthly_bonus);
    } else {
      periodMap.set(sortKey, { label, sortKey, total: Number(r.monthly_bonus) });
    }
  });

  // Sort periods descending (newest first)
  const allPeriods = Array.from(periodMap.values()).sort((a, b) => b.sortKey.localeCompare(a.sortKey));

  const currentPeriod = allPeriods[0];
  const pastPeriods = allPeriods.slice(1);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen flex-col bg-background pb-16">
      <header className="sticky top-0 z-10 border-b bg-card px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Performance</h1>
            <p className="text-sm text-muted-foreground">Hallo, {user?.name || user?.email}</p>
          </div>
          <div className="flex items-center gap-1">
            {(hasRole('admin') || hasRole('teamleiter')) && hasRole('monteur') && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
                    <ArrowRightLeft className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zur Admin-App</TooltipContent>
              </Tooltip>
            )}
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            <MonteurBonusCard
              totalBonus={Math.abs(currentPeriod?.total ?? 0)}
              periodLabel={currentPeriod?.label ?? ''}
            />
            {pastPeriods.length > 0 && (
              <>
                <h2 className="text-sm font-semibold">Vergangene Boni</h2>
                <div className="space-y-2">
                  {pastPeriods.map(p => (
                    <div key={p.sortKey} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
                      <span className="text-sm text-muted-foreground">{p.label}</span>
                      <span className="text-sm font-semibold">{Math.abs(p.total).toFixed(0)} €</span>
                    </div>
                  ))}
                </div>
              </>
            )}
            <h2 className="text-sm font-semibold">Bewertungshistorie</h2>
            <MonteurReviewHistory reviews={reviews} getResult={getResult} />
          </>
        )}
      </main>

      <MonteurBottomNav active="performance" />
    </div>
  );
};

export default MonteurPerformance;
