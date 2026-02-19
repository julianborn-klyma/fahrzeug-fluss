import { useState, useMemo, useEffect } from 'react';
import { usePackages, useUpsertPackage, useDeletePackage, usePackageItems, useSetPackageItems, usePackagePrices, useUpsertPackagePrice, useProducts, useProductPrices, useCategories, useAllPackageItems } from '@/hooks/useKalkulation';
import { calcEK, fmtEur } from '@/lib/kalkulation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Pencil, Trash2, X, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Props { pricebookId: string | null; }

interface ItemRow { product_id: string; quantity: number; }

const KalkulationPackages = ({ pricebookId }: Props) => {
  const { data: packages = [] } = usePackages();
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();
  const { data: productPrices = [] } = useProductPrices(pricebookId);
  const { data: packagePrices = [] } = usePackagePrices(pricebookId);
  const upsertPkg = useUpsertPackage();
  const deletePkg = useDeletePackage();
  const setItems = useSetPackageItems();
  const upsertPkgPrice = useUpsertPackagePrice();
  const { data: allPkgItems = [] } = useAllPackageItems();
  const [dialog, setDialog] = useState<{ open: boolean; pkg?: any }>({ open: false });
  const [form, setForm] = useState({ name: '', article_number: '', description: '', category_id: '' });
  const [items, setItemsState] = useState<ItemRow[]>([]);
  const [overrideVk, setOverrideVk] = useState<string>('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerFilter, setPickerFilter] = useState('');
  const [pickerCategory, setPickerCategory] = useState<string>('__all__');
  const [pickerSelected, setPickerSelected] = useState<Set<string>>(new Set());
  // For editing: load items
  const editPkgId = dialog.pkg?.id || null;
  const { data: existingItems = [] } = usePackageItems(editPkgId);

  useEffect(() => {
    if (dialog.open && dialog.pkg) {
      setItemsState((existingItems as any[]).map(i => ({ product_id: i.product_id, quantity: Number(i.quantity) })));
      const pp = packagePriceMap[dialog.pkg.id];
      setOverrideVk(pp?.custom_override_vk != null ? String(pp.custom_override_vk) : '');
    }
  }, [existingItems, dialog.open]);

  const productPriceMap = useMemo(() => {
    const m: Record<string, any> = {};
    productPrices.forEach((p: any) => { m[p.product_id] = p; });
    return m;
  }, [productPrices]);

  const packagePriceMap = useMemo(() => {
    const m: Record<string, any> = {};
    packagePrices.forEach((p: any) => { m[p.package_id] = p; });
    return m;
  }, [packagePrices]);

  const productMap = useMemo(() => {
    const m: Record<string, any> = {};
    products.forEach((p: any) => { m[p.id] = p; });
    return m;
  }, [products]);

  // Group all package items by package_id for table sums
  const allItemsByPkg = useMemo(() => {
    const m: Record<string, any[]> = {};
    allPkgItems.forEach((i: any) => {
      if (!m[i.package_id]) m[i.package_id] = [];
      m[i.package_id].push(i);
    });
    return m;
  }, [allPkgItems]);

  const getProductEK = (productId: string) => {
    const pp = productPriceMap[productId];
    if (!pp) return 0;
    return calcEK(Number(pp.material_cost), Number(pp.hourly_rate), Number(pp.time_budget));
  };
  const getProductVK = (productId: string) => {
    const pp = productPriceMap[productId];
    return Number(pp?.final_vk || 0);
  };

  // Live calculations for form
  const totalEK = items.reduce((s, i) => s + getProductEK(i.product_id) * i.quantity, 0);
  const totalVK = items.reduce((s, i) => s + getProductVK(i.product_id) * i.quantity, 0);
  const finalVK = overrideVk ? Number(overrideVk) : totalVK;

  // For table: calculate per package (need all items)
  // We'll show a simplified view using packagePrices and a computed approach

  const openNew = () => {
    setForm({ name: '', article_number: '', description: '', category_id: '' });
    setItemsState([]);
    setOverrideVk('');
    setDialog({ open: true });
  };
  const openEdit = (pkg: any) => {
    setForm({ name: pkg.name, article_number: pkg.article_number, description: pkg.description, category_id: pkg.category_id || '' });
    setDialog({ open: true, pkg });
  };

  const openPicker = () => {
    setPickerSelected(new Set(items.map(i => i.product_id).filter(Boolean)));
    setPickerFilter('');
    setPickerCategory('__all__');
    setPickerOpen(true);
  };

  const confirmPicker = () => {
    const existingMap = new Map(items.map(i => [i.product_id, i.quantity]));
    const newItems: ItemRow[] = [];
    pickerSelected.forEach(pid => {
      newItems.push({ product_id: pid, quantity: existingMap.get(pid) || 1 });
    });
    setItemsState(newItems);
    setPickerOpen(false);
  };

  const togglePickerProduct = (pid: string) => {
    setPickerSelected(prev => {
      const next = new Set(prev);
      if (next.has(pid)) next.delete(pid); else next.add(pid);
      return next;
    });
  };

  const filteredPickerProducts = useMemo(() => {
    return products.filter((p: any) => {
      if (pickerCategory !== '__all__' && p.category_id !== pickerCategory) return false;
      if (pickerFilter) {
        const q = pickerFilter.toLowerCase();
        return p.name.toLowerCase().includes(q) || (p.article_number || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [products, pickerCategory, pickerFilter]);

  const save = async () => {
    if (!form.name.trim()) return;
    try {
      let pkgId = dialog.pkg?.id;
      if (pkgId) {
        await upsertPkg.mutateAsync({ id: pkgId, ...form, category_id: form.category_id || null });
      } else {
        const { data, error } = await (await import('@/integrations/supabase/client')).supabase.from('kalkulation_packages' as any).insert({ article_number: form.article_number, name: form.name, description: form.description, category_id: form.category_id || null }).select('id').single();
        if (error) throw error;
        pkgId = (data as any).id;
      }
      // Save items
      const validItems = items.filter(i => i.product_id);
      await setItems.mutateAsync({ packageId: pkgId, items: validItems });
      // Save package price
      if (pricebookId) {
        const existing = packagePriceMap[pkgId];
        await upsertPkgPrice.mutateAsync({
          id: existing?.id,
          package_id: pkgId,
          pricebook_id: pricebookId,
          custom_override_vk: overrideVk ? Number(overrideVk) : null,
        });
      }
      toast.success('Paket gespeichert');
      setDialog({ open: false });
    } catch (e: any) { toast.error(e.message || 'Fehler'); }
  };

  const handleDelete = async (id: string) => {
    try { await deletePkg.mutateAsync(id); toast.success('Gelöscht'); } catch { toast.error('Fehler'); }
  };

  if (!pricebookId) {
    return <Card><CardContent className="py-8 text-center text-muted-foreground">Bitte zuerst ein Preisbuch erstellen.</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between px-4 py-3">
        <CardTitle className="text-sm">Pakete</CardTitle>
        <Button size="sm" onClick={openNew} className="gap-1"><Plus className="h-4 w-4" />Neu</Button>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Art.-Nr.</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">EK</TableHead>
              <TableHead className="text-right">VK (Summe)</TableHead>
              <TableHead className="text-right">VK (Final)</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {packages.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Keine Pakete</TableCell></TableRow>
            )}
            {packages.map((pkg: any) => {
              const pp = packagePriceMap[pkg.id];
              const pkgItems = allItemsByPkg[pkg.id] || [];
              const sumEK = pkgItems.reduce((s: number, i: any) => s + getProductEK(i.product_id) * Number(i.quantity), 0);
              const sumVK = pkgItems.reduce((s: number, i: any) => s + getProductVK(i.product_id) * Number(i.quantity), 0);
              const finalVK = pp?.custom_override_vk != null ? Number(pp.custom_override_vk) : sumVK;
              return (
                <TableRow key={pkg.id}>
                  <TableCell className="font-mono text-xs">{pkg.article_number || '–'}</TableCell>
                  <TableCell className="font-medium">{pkg.name}</TableCell>
                  <TableCell className="text-right">{fmtEur(sumEK)} €</TableCell>
                  <TableCell className="text-right">{fmtEur(sumVK)} €</TableCell>
                  <TableCell className="text-right font-medium">{fmtEur(finalVK)} €</TableCell>
                  <TableCell className="flex gap-1 justify-end">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(pkg)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(pkg.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={dialog.open} onOpenChange={(o) => setDialog({ open: o })}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{dialog.pkg ? 'Paket bearbeiten' : 'Neues Paket'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Name *</label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">Art.-Nr.</label>
                <Input value={form.article_number} onChange={e => setForm(f => ({ ...f, article_number: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Beschreibung</label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Produkte im Paket ({items.length})</p>
                <Button size="sm" variant="outline" onClick={openPicker} className="gap-1"><Plus className="h-3.5 w-3.5" />Produkte auswählen</Button>
              </div>
              {items.length > 0 && (
                <div className="space-y-2">
                  {items.map((item, idx) => {
                    const prod = productMap[item.product_id];
                    if (!prod) return null;
                    return (
                      <div key={item.product_id} className="flex items-center gap-2 rounded-md border p-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{prod.article_number ? `${prod.article_number} – ` : ''}{prod.name}</p>
                          <p className="text-xs text-muted-foreground">EK: {fmtEur(getProductEK(item.product_id))} € · VK: {fmtEur(getProductVK(item.product_id))} €</p>
                        </div>
                        <Input
                          type="number" min={1} step={1} className="w-20"
                          value={item.quantity}
                          onChange={e => setItemsState(prev => prev.map((it, i) => i === idx ? { ...it, quantity: Number(e.target.value) } : it))}
                        />
                        <Button variant="ghost" size="icon" onClick={() => setItemsState(prev => prev.filter((_, i) => i !== idx))}><X className="h-4 w-4" /></Button>
                      </div>
                    );
                  })}
                </div>
              )}
              {items.length === 0 && <p className="text-xs text-muted-foreground">Noch keine Produkte hinzugefügt.</p>}
            </div>

            <div className="rounded-md bg-muted/50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Summe EK</span>
                <span className="font-medium">{fmtEur(totalEK)} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Summe VK (Standard)</span>
                <span className="font-medium">{fmtEur(totalVK)} €</span>
              </div>
              <div className="border-t pt-2">
                <label className="text-xs text-muted-foreground">Übergeordneter Verkaufspreis (Optional)</label>
                <Input type="number" step="0.01" placeholder="Leer = Standardpreis" value={overrideVk} onChange={e => setOverrideVk(e.target.value)} />
              </div>
              <div className="flex justify-between text-sm font-bold pt-1">
                <span>Endpreis VK</span>
                <span>{fmtEur(finalVK)} €</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog({ open: false })}>Abbrechen</Button>
            <Button onClick={save} disabled={upsertPkg.isPending}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Picker Modal */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader><DialogTitle>Produkte auswählen</DialogTitle></DialogHeader>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Suchen…"
                value={pickerFilter}
                onChange={e => setPickerFilter(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={pickerCategory} onValueChange={setPickerCategory}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Kategorie" /></SelectTrigger>
              <SelectContent className="z-[300] bg-popover">
                <SelectItem value="__all__">Alle Kategorien</SelectItem>
                {categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <ScrollArea className="flex-1 border rounded-md">
            <div className="divide-y">
              {filteredPickerProducts.length === 0 && (
                <p className="p-4 text-sm text-muted-foreground text-center">Keine Produkte gefunden</p>
              )}
              {filteredPickerProducts.map((p: any) => (
                <label key={p.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 cursor-pointer">
                  <Checkbox
                    checked={pickerSelected.has(p.id)}
                    onCheckedChange={() => togglePickerProduct(p.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.article_number || '–'} · VK: {fmtEur(getProductVK(p.id))} €</p>
                  </div>
                </label>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <p className="text-sm text-muted-foreground">{pickerSelected.size} ausgewählt</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setPickerOpen(false)}>Abbrechen</Button>
              <Button onClick={confirmPicker}>Übernehmen</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default KalkulationPackages;
