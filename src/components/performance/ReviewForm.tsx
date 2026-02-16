import { useState, useEffect } from 'react';
import { CATEGORIES, SCORE_OPTIONS, SCORE_LABELS, type ScoreValue } from './scoreDescriptions';
import { useBonusSettings } from '@/context/BonusSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Save, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ReviewFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  monteurId: string;
  monteurName: string;
  reviewMonth: string; // YYYY-MM-DD first of month
  existingReview?: any;
  onSaved: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  open, onOpenChange, monteurId, monteurName, reviewMonth, existingReview, onSaved,
}) => {
  const { user, hasRole } = useAuth();
  const { settings, calculateScore, getResult, getMonthlyBonus } = useBonusSettings();

  const [scores, setScores] = useState<Record<string, number | null>>({
    speed: null, quality: null, reliability: null, team: null, cleanliness: null,
  });
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingReview) {
      setScores({
        speed: existingReview.score_speed,
        quality: existingReview.score_quality,
        reliability: existingReview.score_reliability,
        team: existingReview.score_team,
        cleanliness: existingReview.score_cleanliness,
      });
      setComment(existingReview.comment || '');
    } else {
      setScores({ speed: null, quality: null, reliability: null, team: null, cleanliness: null });
      setComment('');
    }
  }, [existingReview, open]);

  const allScoresSet = Object.values(scores).every(v => v !== null);

  const totalScore = allScoresSet
    ? calculateScore({
        speed: scores.speed!,
        quality: scores.quality!,
        reliability: scores.reliability!,
        team: scores.team!,
        cleanliness: scores.cleanliness!,
      })
    : null;

  const result = totalScore !== null ? getResult(totalScore) : null;
  const bonus = totalScore !== null ? getMonthlyBonus(totalScore) : 0;

  const requireApproval = (settings as any)?.require_approval ?? true;
  const isAdmin = hasRole('admin');
  const status = requireApproval ? 'draft' : 'approved';

  const handleSave = async () => {
    if (!allScoresSet || !user) return;
    setSaving(true);
    const data = {
      monteur_id: monteurId,
      reviewer_id: user.id,
      review_month: reviewMonth,
      score_speed: scores.speed!,
      score_quality: scores.quality!,
      score_reliability: scores.reliability!,
      score_team: scores.team!,
      score_cleanliness: scores.cleanliness!,
      total_score: totalScore!,
      monthly_bonus: bonus,
      status: existingReview?.status === 'approved' ? 'approved' : status,
      comment: comment || null,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (existingReview) {
      ({ error } = await supabase.from('performance_reviews').update(data).eq('id', existingReview.id));
    } else {
      ({ error } = await supabase.from('performance_reviews').insert(data as any));
    }

    if (error) {
      toast.error('Fehler beim Speichern: ' + error.message);
    } else {
      toast.success('Bewertung gespeichert');
      onSaved();
      onOpenChange(false);
    }
    setSaving(false);
  };

  const handleApprove = async () => {
    if (!existingReview || !user) return;
    setSaving(true);
    const { error } = await supabase
      .from('performance_reviews')
      .update({
        status: 'approved',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingReview.id);

    if (error) {
      toast.error('Fehler: ' + error.message);
    } else {
      toast.success('Bewertung freigegeben');
      onSaved();
      onOpenChange(false);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">
            Bewertung — {monteurName}
            <span className="ml-2 text-xs text-muted-foreground font-normal">
              {new Date(reviewMonth).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {CATEGORIES.map(cat => {
            const val = scores[cat.key];
            return (
              <div key={cat.key} className="space-y-1.5">
                <Label className="text-xs font-medium">{cat.label}</Label>
                <Select
                  value={val !== null ? String(val) : ''}
                  onValueChange={v => setScores(prev => ({ ...prev, [cat.key]: Number(v) }))}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Bewertung wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {SCORE_OPTIONS.map(opt => (
                      <SelectItem key={opt} value={String(opt)} className="text-xs">
                        {opt > 0 ? `+${opt}` : opt} — {SCORE_LABELS[opt]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {val !== null && (
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    {cat.descriptions[val]}
                  </p>
                )}
              </div>
            );
          })}

          <div className="space-y-1.5">
            <Label className="text-xs">Kommentar (optional)</Label>
            <Textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Anmerkungen zur Bewertung…"
              className="text-xs min-h-[60px]"
            />
          </div>

          {allScoresSet && totalScore !== null && (
            <div className="rounded-md bg-muted p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Gesamtpunktzahl</span>
                <span className="text-sm font-bold">{totalScore.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Ergebnis</span>
                <Badge variant={result === 'bonus' ? 'default' : result === 'neutral' ? 'secondary' : 'destructive'} className="text-xs">
                  {result === 'bonus' ? 'Bonus erreicht' : result === 'neutral' ? 'Kein Bonus' : 'Verbesserung notwendig'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Monatsbonus</span>
                <span className="text-sm font-bold">{bonus.toFixed(0)} €</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {existingReview?.status === 'draft' && isAdmin && (
            <Button variant="outline" size="sm" onClick={handleApprove} disabled={saving} className="gap-1 text-xs">
              <CheckCircle className="h-3.5 w-3.5" /> Freigeben
            </Button>
          )}
          <Button size="sm" onClick={handleSave} disabled={saving || !allScoresSet} className="gap-1 text-xs">
            <Save className="h-3.5 w-3.5" /> {saving ? 'Speichere…' : 'Speichern'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewForm;
