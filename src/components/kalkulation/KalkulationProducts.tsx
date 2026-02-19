import { useState, useMemo } from 'react';
import { useProducts, useUpsertProduct, useDeleteProduct, useProductPrices, useUpsertProductPrice, useCategories } from '@/hooks/useKalkulation';
import { calcEK, calcVKFromFactor, calcFactorFromVK, fmtEur } from '@/lib/kalkulation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props { pricebookId: string | null; }

const KalkulationProducts = ({ pricebookId }: Props) => {
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();
  const { data: prices = [] } = useProductPrices(pricebookId);
  const upsertProduct = useUpsertProduct();
  const deleteProduct = useDeleteProduct();
  const upsertPrice = useUpsertProductPrice();

  const [dialog, setDialog] = useState<{ open: boolean; product?: any }>({ open: false });
  // Form state
  const [form, setForm] = useState({ name: '', article_number: '', description: '', category_id: '' });
  const [priceForm, setPriceForm] = useState({ material_cost: 0, hourly_rate: 0, time_budget: 0, calculation_factor: 1, final_vk: 0 });

  const priceMap = useMemo(() => {
    const m: Record<string, any> = {};
    prices.forEach((p: any) => { m[p.product_id] = p; });
    return m;
  }, [prices]);

  const catMap = useMemo(() => {
    const m: Record<string, string> = {};
    categories.forEach((c: any) => { m[c.id] = c.name; });
    return m;
  }, [categories]);

  const openNew = () => {
    setForm({ name: '', article_number: '', description: '', category_id: '' });
    setPriceForm({ material_cost: 0, hourly_rate: 0, time_budget: 0, calculation_factor: 1, final_vk: 0 });
    setDialog({ open: true });
  };

  const openEdit = (product: any) => {
    setForm({ name: product.name, article_number: product.article_number, description: product.description, category_id: product.category_id || '' });
    const pp = priceMap[product.id];
    if (pp) {
      setPriceForm({ material_cost: Number(pp.material_cost), hourly_rate: Number(pp.hourly_rate), time_budget: Number(pp.time_budget), calculation_factor: Number(pp.calculation_factor), final_vk: Number(pp.final_vk) });
    } else {
      setPriceForm({ material_cost: 0, hourly_rate: 0, time_budget: 0, calculation_factor: 1, final_vk: 0 });
    }
    setDialog({ open: true, product });
  };

  const ek = calcEK(priceForm.material_cost, priceForm.hourly_rate, priceForm.time_budget);

  const handleFactorChange = (factor: number) => {
    setPriceForm(p => ({ ...p, calculation_factor: factor, final_vk: calcVKFromFactor(calcEK(p.material_cost, p.hourly_rate, p.time_budget), factor) }));
  };
  const handleVKChange = (vk: number) => {
    setPriceForm(p => ({ ...p, final_vk: vk, calculation_factor: calcFactorFromVK(calcEK(p.material_cost, p.hourly_rate, p.time_budget), vk) }));
  };
  const handleCostChange = (field: 'material_cost' | 'hourly_rate' | 'time_budget', val: number) => {
    setPriceForm(p => {
      const next = { ...p, [field]: val };
      const newEk = calcEK(next.material_cost, next.hourly_rate, next.time_budget);
      return { ...next, final_vk: calcVKFromFactor(newEk, next.calculation_factor) };
    });
  };

  const save = async () => {
    if (!form.name.trim()) return;
    try {
      let productId = dialog.product?.id;
      if (productId) {
        await upsertProduct.mutateAsync({ id: productId, ...form, category_id: form.category_id || null });
      } else {
        // Insert and get id
        const { data, error } = await (await import('@/integrations/supabase/client')).supabase.from('kalkulation_products' as any).insert({ article_number: form.article_number, name: form.name, description: form.description, category_id: form.category_id || null }).select('id').single();
        if (error) throw error;
        productId = (data as any).id;
      }
      if (pricebookId && productId) {
        const existingPrice = priceMap[productId];
        await upsertPrice.mutateAsync({
          id: existingPrice?.id,
          product_id: productId,
          pricebook_id: pricebookId,
          ...priceForm,
        });
      }
      toast.success('Produkt gespeichert');
      setDialog({ open: false });
    } catch (e: any) { toast.error(e.message || 'Fehler'); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteProduct.mutateAsync(id); toast.success('Gelöscht'); } catch { toast.error('Fehler'); }
  };

  if (!pricebookId) {
    return <Card><CardContent className="py-8 text-center text-muted-foreground">Bitte zuerst ein Preisbuch erstellen.</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between px-4 py-3">
        <CardTitle className="text-sm">Produkte</CardTitle>
        <Button size="sm" onClick={openNew} className="gap-1"><Plus className="h-4 w-4" />Neu</Button>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Art.-Nr.</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Kategorie</TableHead>
              <TableHead className="text-right">Material</TableHead>
              <TableHead className="text-right">Lohn</TableHead>
              <TableHead className="text-right">EK</TableHead>
              <TableHead className="text-right">Faktor</TableHead>
              <TableHead className="text-right">VK</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 && (
              <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">Keine Produkte</TableCell></TableRow>
            )}
            {products.map((p: any) => {
              const pp = priceMap[p.id];
              const mc = Number(pp?.material_cost || 0);
              const hr = Number(pp?.hourly_rate || 0);
              const tb = Number(pp?.time_budget || 0);
              const productEk = calcEK(mc, hr, tb);
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.article_number || '–'}</TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{catMap[p.category_id] || '–'}</TableCell>
                  <TableCell className="text-right">{fmtEur(mc)} €</TableCell>
                  <TableCell className="text-right">{fmtEur(hr * tb)} €</TableCell>
                  <TableCell className="text-right font-medium">{fmtEur(productEk)} €</TableCell>
                  <TableCell className="text-right">{Number(pp?.calculation_factor || 0).toFixed(2)}</TableCell>
                  <TableCell className="text-right font-medium">{fmtEur(Number(pp?.final_vk || 0))} €</TableCell>
                  <TableCell className="flex gap-1 justify-end">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={dialog.open} onOpenChange={(o) => setDialog({ open: o })}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{dialog.product ? 'Produkt bearbeiten' : 'Neues Produkt'}</DialogTitle></DialogHeader>
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Kategorie</label>
                <Select value={form.category_id || '__none__'} onValueChange={v => setForm(f => ({ ...f, category_id: v === '__none__' ? '' : v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="z-[200] bg-popover">
                    <SelectItem value="__none__">Keine</SelectItem>
                    {categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Beschreibung</label>
                <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
            </div>

            <div className="border-t pt-4 space-y-3">
              <p className="text-sm font-semibold text-foreground">Preisdaten (aktives Preisbuch)</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Materialkosten (€)</label>
                  <Input type="number" step="0.01" value={priceForm.material_cost} onChange={e => handleCostChange('material_cost', Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Lohnkosten/h (€)</label>
                  <Input type="number" step="0.01" value={priceForm.hourly_rate} onChange={e => handleCostChange('hourly_rate', Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Zeitbudget (h)</label>
                  <Input type="number" step="0.01" value={priceForm.time_budget} onChange={e => handleCostChange('time_budget', Number(e.target.value))} />
                </div>
              </div>
              <div className="rounded-md bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Berechneter EK</p>
                <p className="text-lg font-bold text-foreground">{fmtEur(ek)} €</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Faktor</label>
                  <Input type="number" step="0.01" value={priceForm.calculation_factor} onChange={e => handleFactorChange(Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Verkaufspreis VK (€)</label>
                  <Input type="number" step="0.01" value={priceForm.final_vk} onChange={e => handleVKChange(Number(e.target.value))} />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog({ open: false })}>Abbrechen</Button>
            <Button onClick={save} disabled={upsertProduct.isPending}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default KalkulationProducts;
