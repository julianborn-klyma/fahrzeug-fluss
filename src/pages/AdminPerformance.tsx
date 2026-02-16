import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import ReviewTable from '@/components/performance/ReviewTable';
import ReviewForm from '@/components/performance/ReviewForm';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, subMonths, startOfMonth } from 'date-fns';
import { de } from 'date-fns/locale';

const AdminPerformance = () => {
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole('admin');
  const isTeamleiter = hasRole('teamleiter');
  const isOffice = hasRole('office') && !isAdmin && !isTeamleiter;

  // Generate last 12 months
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = startOfMonth(subMonths(new Date(), i + 1));
    return { value: format(d, 'yyyy-MM-dd'), label: format(d, 'MMMM yyyy', { locale: de }) };
  });

  const [selectedMonth, setSelectedMonth] = useState(months[0].value);
  const [monteurs, setMonteurs] = useState<{ id: string; name: string }[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [monteurTeamleiterMap, setMonteurTeamleiterMap] = useState<Record<string, string>>({});
  const [formOpen, setFormOpen] = useState(false);
  const [editMonteurId, setEditMonteurId] = useState('');
  const [editMonteurName, setEditMonteurName] = useState('');
  const [editReview, setEditReview] = useState<any>(undefined);

  const fetchData = useCallback(async () => {
    if (isOffice) return;
    let monteurIds: string[] = [];

    if (isTeamleiter && !isAdmin && user) {
      const { data: assigns } = await supabase
        .from('teamleiter_monteur_assignments')
        .select('monteur_id')
        .eq('teamleiter_id', user.id);
      monteurIds = (assigns || []).map(a => a.monteur_id);
    }

    const { data: roles } = await supabase.from('user_roles').select('user_id').eq('role', 'monteur');
    const allMonteurIds = (roles || []).map(r => r.user_id);
    const filteredIds = monteurIds.length > 0 ? allMonteurIds.filter(id => monteurIds.includes(id)) : allMonteurIds;

    if (filteredIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('user_id, name').in('user_id', filteredIds);
      setMonteurs((profiles || []).map(p => ({ id: p.user_id, name: p.name || '(Kein Name)' })));
    } else {
      setMonteurs([]);
    }

    const { data: revs } = await supabase
      .from('performance_reviews')
      .select('*')
      .eq('review_month', selectedMonth);
    setReviews(revs || []);

    // Build monteur -> teamleiter name map from assignments
    const { data: allAssigns } = await supabase.from('teamleiter_monteur_assignments').select('monteur_id, teamleiter_id');
    const tlIds = [...new Set((allAssigns || []).map(a => a.teamleiter_id).filter(Boolean))];
    if (tlIds.length > 0) {
      const { data: tlProfiles } = await supabase.from('profiles').select('user_id, name').in('user_id', tlIds);
      const tlNameMap = Object.fromEntries((tlProfiles || []).map(p => [p.user_id, p.name || '']));
      const monteurTlMap: Record<string, string> = {};
      (allAssigns || []).forEach(a => {
        monteurTlMap[a.monteur_id] = tlNameMap[a.teamleiter_id] || '';
      });
      setMonteurTeamleiterMap(monteurTlMap);
    } else {
      setMonteurTeamleiterMap({});
    }
  }, [selectedMonth, user, isAdmin, isTeamleiter, isOffice]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Office users cannot access performance
  if (isOffice) {
    return (
      <AdminLayout>
        <div className="flex h-[calc(100vh-53px)] items-center justify-center">
          <p className="text-muted-foreground">Kein Zugriff auf den Performance-Bereich.</p>
        </div>
      </AdminLayout>
    );
  }

  const rows = monteurs.map(m => {
    const review = reviews.find(r => r.monteur_id === m.id);
    return {
      monteur_id: m.id,
      monteur_name: m.name,
      reviewer_name: monteurTeamleiterMap[m.id] || undefined,
      review,
    };
  });

  // Group rows by teamleiter name
  const groupMap = new Map<string, typeof rows>();
  rows.forEach(row => {
    const tl = row.reviewer_name || 'Nicht zugewiesen';
    if (!groupMap.has(tl)) groupMap.set(tl, []);
    groupMap.get(tl)!.push(row);
  });
  const sortedKeys = [...groupMap.keys()].sort((a, b) => {
    if (a === 'Nicht zugewiesen') return 1;
    if (b === 'Nicht zugewiesen') return -1;
    return a.localeCompare(b);
  });
  const grouped = sortedKeys.map(k => ({ teamleiter: k, rows: groupMap.get(k)! }));

  const handleEdit = (monteurId: string, monteurName: string, review?: any) => {
    setEditMonteurId(monteurId);
    setEditMonteurName(monteurName);
    setEditReview(review);
    setFormOpen(true);
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Performance-Bewertungen</h2>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map(m => (
                <SelectItem key={m.value} value={m.value} className="text-xs">{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {monteurs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            {isTeamleiter && !isAdmin
              ? 'Ihnen sind noch keine Monteure zugewiesen.'
              : 'Keine Monteure gefunden.'}
          </p>
        ) : (
          <div className="space-y-4">
            {grouped.map(group => (
              <div key={group.teamleiter} className="rounded-lg border bg-card">
                <div className="px-4 py-2 border-b bg-muted/30">
                  <span className="text-xs font-semibold text-muted-foreground">TL: {group.teamleiter}</span>
                </div>
                <ReviewTable rows={group.rows} onEdit={handleEdit} />
              </div>
            ))}
          </div>
        )}

        <ReviewForm
          open={formOpen}
          onOpenChange={setFormOpen}
          monteurId={editMonteurId}
          monteurName={editMonteurName}
          reviewMonth={selectedMonth}
          existingReview={editReview}
          onSaved={fetchData}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminPerformance;
