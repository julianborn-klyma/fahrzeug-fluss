import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClients } from '@/hooks/useClients';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, User } from 'lucide-react';
import CreateClientDialog from '@/components/montage/CreateClientDialog';

const AdminMontageKunden = () => {
  const { clients, loading } = useClients();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = clients.filter((c) => {
    const s = search.toLowerCase();
    const name = `${c.contact?.first_name || ''} ${c.contact?.last_name || ''} ${c.company_name || ''}`.toLowerCase();
    return name.includes(s) || (c.billing_city || '').toLowerCase().includes(s);
  });

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Kunden</h2>
        <Button size="sm" className="gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Neuer Kunde
        </Button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Suchen nach Name, Firma, Ort…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">Keine Kunden gefunden.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <Card key={c.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate(`/admin/montage/kunden/${c.id}`)}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm">{c.contact?.first_name} {c.contact?.last_name}</p>
                  {c.company_name && <p className="text-xs text-muted-foreground">{c.company_name}</p>}
                  {c.billing_city && <p className="text-xs text-muted-foreground">{c.billing_street}, {c.billing_postal_code} {c.billing_city}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <CreateClientDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
};

export default AdminMontageKunden;
