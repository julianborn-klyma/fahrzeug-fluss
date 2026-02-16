import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CATEGORIES, SCORE_LABELS } from './scoreDescriptions';

interface Review {
  id: string;
  review_month: string;
  score_speed: number;
  score_quality: number;
  score_reliability: number;
  score_team: number;
  score_cleanliness: number;
  total_score: number;
  monthly_bonus: number;
}

interface MonteurReviewHistoryProps {
  reviews: Review[];
  getResult: (score: number) => 'bonus' | 'neutral' | 'improvement';
}

const scoreFields = ['score_speed', 'score_quality', 'score_reliability', 'score_team', 'score_cleanliness'] as const;

const MonteurReviewHistory: React.FC<MonteurReviewHistoryProps> = ({ reviews, getResult }) => {
  if (reviews.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">Noch keine freigegebenen Bewertungen.</p>;
  }

  return (
    <div className="space-y-3">
      {reviews.map(r => {
        const result = getResult(r.total_score);
        return (
          <Card key={r.id}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">
                  {new Date(r.review_month).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
                </span>
                <Badge
                  variant={result === 'bonus' ? 'default' : result === 'neutral' ? 'secondary' : 'destructive'}
                  className="text-[10px]"
                >
                  {result === 'bonus' ? 'Bonus erreicht' : result === 'neutral' ? 'Kein Bonus' : 'Verbesserung notwendig'}
                </Badge>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {CATEGORIES.map((cat, i) => {
                  const val = r[scoreFields[i]];
                  return (
                    <div key={cat.key} className="text-center">
                      <p className="text-[10px] text-muted-foreground">{cat.label.split(' ')[0]}</p>
                      <p className="text-xs font-semibold">{val > 0 ? `+${val}` : val}</p>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between pt-1 border-t">
                <span className="text-xs text-muted-foreground">Gesamt: <span className="font-semibold text-foreground">{r.total_score.toFixed(2)}</span></span>
                <span className="text-xs font-semibold">{Number(r.monthly_bonus).toFixed(0)} €</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default MonteurReviewHistory;
