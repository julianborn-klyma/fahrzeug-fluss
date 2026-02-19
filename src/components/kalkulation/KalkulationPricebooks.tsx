import { useState } from 'react';
import { usePriceBooks, useUpsertPriceBook, useDeletePriceBook } from '@/hooks/useKalkulation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const KalkulationPricebooks = () => {
  const { data: pricebooks = [], isLoading } = usePriceBooks();
  const upsert = useUpsertPriceBook();
  const remove = useDeletePriceBook();
  const [dialog, setDialog] = useState<{ open: boolean; pb?: any }>({ open: false });
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(false);

  const openNew = () => { setName(''); setIsActive(false); setDialog({ open: true }); };
  const openEdit = (pb: any) => { setName(pb.name); setIsActive(pb.is_active); setDialog({ open: true, pb }); };

  const save = async () => {
    if (!name.trim()) return;
    try {
      await upsert.mutateAsync({ id: dialog.pb?.id, name: name.trim(), is_active: isActive });
      toast.success(dialog.pb ? 'Preisbuch aktualisiert' : 'Preisbuch erstellt');
      setDialog({ open: false });
    } catch { toast.error('Fehler beim Speichern'); }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove.mutateAsync(id);
      toast.success('Preisbuch gelöscht');
    } catch { toast.error('Fehler beim Löschen'); }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between px-4 py-3">
        <CardTitle className="text-sm">Preisbücher</CardTitle>
        <Button size="sm" onClick={openNew} className="gap-1"><Plus className="h-4 w-4" />Neu</Button>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Laden…</TableCell></TableRow>}
            {!isLoading && pricebooks.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Keine Preisbücher vorhanden</TableCell></TableRow>}
            {pricebooks.map((pb: any) => (
              <TableRow key={pb.id}>
                <TableCell className="font-medium">{pb.name}</TableCell>
                <TableCell>{pb.is_active ? <Badge variant="default">Aktiv</Badge> : <Badge variant="secondary">Inaktiv</Badge>}</TableCell>
                <TableCell className="flex gap-1 justify-end">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(pb)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(pb.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={dialog.open} onOpenChange={(o) => setDialog({ open: o })}>
        <DialogContent>
          <DialogHeader><DialogTitle>{dialog.pb ? 'Preisbuch bearbeiten' : 'Neues Preisbuch'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="z.B. Preisupdate Januar 2026" />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Aktiv</label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog({ open: false })}>Abbrechen</Button>
            <Button onClick={save} disabled={upsert.isPending}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default KalkulationPricebooks;
