import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, MapPin } from 'lucide-react';

const AdminMontageImmobilien = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['all-properties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*, client:clients(id, company_name, contact_id, contact:contacts(first_name, last_name))')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = properties.filter((p: any) => {
    const s = search.toLowerCase();
    const text = `${p.name} ${p.street_address} ${p.city} ${p.postal_code} ${p.client?.company_name || ''} ${p.client?.contact?.first_name || ''} ${p.client?.contact?.last_name || ''}`.toLowerCase();
    return text.includes(s);
  });

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold">Immobilien</h2>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Suchen nach Adresse, Kunde…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">Keine Immobilien gefunden.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((p: any) => (
            <Card key={p.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate(`/admin/montage/immobilien/${p.id}`)}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm">{p.street_address}, {p.postal_code} {p.city}</p>
                  {p.client && (
                    <p className="text-xs text-muted-foreground">
                      {p.client.contact?.first_name} {p.client.contact?.last_name}
                      {p.client.company_name ? ` · ${p.client.company_name}` : ''}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminMontageImmobilien;
