import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Plus, Trash2, Search, Package, Box } from 'lucide-react';
import { useAppointmentItems } from '@/hooks/useAppointmentItems';
import { useProducts, usePackages, useProductPrices, usePackagePrices, useAllPackageItems } from '@/hooks/useKalkulation';
import { calcEK, fmtEur } from '@/lib/kalkulation';
import { toast } from 'sonner';
import StepperInput from '@/components/StepperInput';

interface AppointmentProductsTabProps {
  appointmentId: string;
  pricebookId: string | null;
  readonly?: boolean;
}

const VAT_OPTIONS = [
  { value: '0', label: '0%' },
  { value: '7', label: '7%' },
  { value: '19', label: '19%' },
];

const AppointmentProductsTab = ({ appointmentId, pricebookId, readonly }: AppointmentProductsTabProps) => {
  const { items, addItem, updateItem, deleteItem } = useAppointmentItems(appointmentId);
  const { data: products } = useProducts();
  const { data: packages } = usePackages();
  const { data: productPrices } = useProductPrices(pricebookId);
  const { data: packagePrices } = usePackagePrices(pricebookId);
  const { data: allPackageItems } = useAllPackageItems();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addTab, setAddTab] = useState<'products' | 'packages'>('products');
  const [search, setSearch] = useState('');

  // Build price lookups
  const productPriceMap = useMemo(() => {
    const map: Record<string, any> = {};
    (productPrices || []).forEach((pp: any) => { map[pp.product_id] = pp; });
    return map;
  }, [productPrices]);

  const packagePriceMap = useMemo(() => {
    const map: Record<string, any> = {};
    (packagePrices || []).forEach((pp: any) => { map[pp.package_id] = pp; });
    return map;
  }, [packagePrices]);

  const productMap = useMemo(() => {
    const map: Record<string, any> = {};
    (products || []).forEach((p: any) => { map[p.id] = p; });
    return map;
  }, [products]);

  const packageMap = useMemo(() => {
    const map: Record<string, any> = {};
    (packages || []).forEach((p: any) => { map[p.id] = p; });
    return map;
  }, [packages]);

  // Calculate EK/VK for a single item
  const getItemPrices = (item: any) => {
    if (item.item_type === 'product') {
      const pp = productPriceMap[item.item_id];
      if (!pp) return { ek: 0, vk: 0 };
      const ek = calcEK(pp.material_cost, pp.hourly_rate, pp.time_budget);
      const vk = item.override_vk != null ? item.override_vk : pp.final_vk;
      return { ek, vk };
    } else {
      // Package: sum of product EKs weighted by package item quantities
      const pkgItems = (allPackageItems || []).filter((pi: any) => pi.package_id === item.item_id);
      let ekSum = 0;
      let vkSum = 0;
      for (const pi of pkgItems) {
        const pp = productPriceMap[pi.product_id];
        if (pp) {
          ekSum += calcEK(pp.material_cost, pp.hourly_rate, pp.time_budget) * pi.quantity;
          vkSum += pp.final_vk * pi.quantity;
        }
      }
      const pkgPrice = packagePriceMap[item.item_id];
      const vk = item.override_vk != null ? item.override_vk : (pkgPrice?.custom_override_vk != null ? pkgPrice.custom_override_vk : vkSum);
      return { ek: ekSum, vk };
    }
  };

  // Totals
  const totals = useMemo(() => {
    let totalEk = 0, totalVkNetto = 0, totalMwst = 0;
    for (const item of items) {
      const { ek, vk } = getItemPrices(item);
      totalEk += ek * item.quantity;
      totalVkNetto += vk * item.quantity;
      totalMwst += vk * item.quantity * (item.vat_rate / 100);
    }
    return { totalEk, totalVkNetto, totalMwst, brutto: totalVkNetto + totalMwst };
  }, [items, productPriceMap, packagePriceMap, allPackageItems]);

  const handleAddItem = async (itemType: 'product' | 'package', itemId: string) => {
    try {
      await addItem.mutateAsync({ job_appointment_id: appointmentId, item_type: itemType, item_id: itemId });
      toast.success('Hinzugefügt.');
    } catch { toast.error('Fehler.'); }
  };

  // Filtered lists for add dialog
  const filteredProducts = useMemo(() => {
    const s = search.toLowerCase();
    return (products || []).filter((p: any) =>
      p.name.toLowerCase().includes(s) || p.article_number.toLowerCase().includes(s)
    );
  }, [products, search]);

  const filteredPackages = useMemo(() => {
    const s = search.toLowerCase();
    return (packages || []).filter((p: any) =>
      p.name.toLowerCase().includes(s) || p.article_number.toLowerCase().includes(s)
    );
  }, [packages, search]);

  if (!pricebookId) {
    return (
      <div className="py-6 text-center">
        <p className="text-sm text-muted-foreground">Bitte zuerst ein Preisbuch dem Auftrag zuordnen, um Produkte hinzufügen zu können.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-3">
      {!readonly && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" className="gap-1 h-7 text-xs" onClick={() => { setShowAddDialog(true); setSearch(''); }}>
            <Plus className="h-3 w-3" /> Produkt/Paket hinzufügen
          </Button>
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground italic text-center py-4">Keine Produkte zugeordnet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Typ</TableHead>
              <TableHead className="text-xs">Name</TableHead>
              <TableHead className="text-xs text-right">Menge</TableHead>
              <TableHead className="text-xs text-right">EK</TableHead>
              <TableHead className="text-xs text-right">VK</TableHead>
              <TableHead className="text-xs text-right">MwSt</TableHead>
              {!readonly && <TableHead className="text-xs w-8"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const { ek, vk } = getItemPrices(item);
              const name = item.item_type === 'product'
                ? productMap[item.item_id]?.name || '?'
                : packageMap[item.item_id]?.name || '?';
              return (
                <TableRow key={item.id}>
                  <TableCell className="text-xs">
                    <Badge variant="outline" className="text-[10px]">
                      {item.item_type === 'product' ? <><Box className="h-2.5 w-2.5 mr-0.5" />Produkt</> : <><Package className="h-2.5 w-2.5 mr-0.5" />Paket</>}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-medium">{name}</TableCell>
                  <TableCell className="text-right">
                    {readonly ? (
                      <span className="text-xs">{item.quantity}</span>
                    ) : (
                      <StepperInput
                        value={item.quantity}
                        min={1}
                        onChange={(val) => updateItem.mutate({ id: item.id, quantity: val })}
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-right">{fmtEur(ek * item.quantity)} €</TableCell>
                  <TableCell className="text-xs text-right">{fmtEur(vk * item.quantity)} €</TableCell>
                  <TableCell className="text-right">
                    {readonly ? (
                      <span className="text-xs">{item.vat_rate}%</span>
                    ) : (
                      <Select
                        value={String(item.vat_rate)}
                        onValueChange={(val) => updateItem.mutate({ id: item.id, vat_rate: Number(val) })}
                      >
                        <SelectTrigger className="h-6 text-[10px] w-16">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {VAT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  {!readonly && (
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteItem.mutate(item.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3} className="text-xs font-semibold">Gesamt</TableCell>
              <TableCell className="text-xs text-right font-semibold">{fmtEur(totals.totalEk)} €</TableCell>
              <TableCell className="text-xs text-right font-semibold">{fmtEur(totals.totalVkNetto)} €</TableCell>
              <TableCell className="text-xs text-right font-semibold">{fmtEur(totals.totalMwst)} €</TableCell>
              {!readonly && <TableCell />}
            </TableRow>
            <TableRow>
              <TableCell colSpan={3} className="text-xs font-bold">Brutto VK</TableCell>
              <TableCell colSpan={readonly ? 3 : 4} className="text-xs text-right font-bold">{fmtEur(totals.brutto)} €</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      )}

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Produkt / Paket hinzufügen</DialogTitle>
          </DialogHeader>
          <Tabs value={addTab} onValueChange={(v) => setAddTab(v as any)}>
            <TabsList className="w-full">
              <TabsTrigger value="products" className="flex-1 gap-1"><Box className="h-3 w-3" /> Produkte</TabsTrigger>
              <TabsTrigger value="packages" className="flex-1 gap-1"><Package className="h-3 w-3" /> Pakete</TabsTrigger>
            </TabsList>

            <div className="relative mt-2">
              <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Suchen…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-7 h-8 text-xs" />
            </div>

            <TabsContent value="products" className="mt-2 space-y-1">
              {filteredProducts.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Keine Produkte gefunden.</p>
              ) : (
                filteredProducts.map((p: any) => {
                  const pp = productPriceMap[p.id];
                  const ek = pp ? calcEK(pp.material_cost, pp.hourly_rate, pp.time_budget) : 0;
                  const vk = pp?.final_vk || 0;
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleAddItem('product', p.id)}
                    >
                      <div>
                        <span className="text-xs font-medium">{p.name}</span>
                        <span className="text-[10px] text-muted-foreground ml-2">{p.article_number}</span>
                      </div>
                      <div className="flex gap-3 text-[10px] text-muted-foreground">
                        <span>EK {fmtEur(ek)} €</span>
                        <span>VK {fmtEur(vk)} €</span>
                      </div>
                    </div>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="packages" className="mt-2 space-y-1">
              {filteredPackages.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Keine Pakete gefunden.</p>
              ) : (
                filteredPackages.map((p: any) => {
                  // Calculate package EK/VK
                  const pkgItems = (allPackageItems || []).filter((pi: any) => pi.package_id === p.id);
                  let ekSum = 0, vkSum = 0;
                  for (const pi of pkgItems) {
                    const pp = productPriceMap[pi.product_id];
                    if (pp) {
                      ekSum += calcEK(pp.material_cost, pp.hourly_rate, pp.time_budget) * pi.quantity;
                      vkSum += pp.final_vk * pi.quantity;
                    }
                  }
                  const pkgPrice = packagePriceMap[p.id];
                  const vk = pkgPrice?.custom_override_vk != null ? pkgPrice.custom_override_vk : vkSum;
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleAddItem('package', p.id)}
                    >
                      <div>
                        <span className="text-xs font-medium">{p.name}</span>
                        <span className="text-[10px] text-muted-foreground ml-2">{p.article_number}</span>
                      </div>
                      <div className="flex gap-3 text-[10px] text-muted-foreground">
                        <span>EK {fmtEur(ekSum)} €</span>
                        <span>VK {fmtEur(vk)} €</span>
                      </div>
                    </div>
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppointmentProductsTab;
