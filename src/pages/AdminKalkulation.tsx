import { useState, useMemo } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Package, ShoppingCart } from 'lucide-react';
import { usePriceBooks } from '@/hooks/useKalkulation';
import KalkulationPricebooks from '@/components/kalkulation/KalkulationPricebooks';
import KalkulationProducts from '@/components/kalkulation/KalkulationProducts';
import KalkulationPackages from '@/components/kalkulation/KalkulationPackages';

const AdminKalkulation = () => {
  const { data: pricebooks = [] } = usePriceBooks();
  const [selectedPbId, setSelectedPbId] = useState<string | null>(null);

  // Auto-select active pricebook or first
  const activePb = useMemo(() => {
    if (selectedPbId) return selectedPbId;
    const active = pricebooks.find((p: any) => p.is_active);
    return active?.id || pricebooks[0]?.id || null;
  }, [pricebooks, selectedPbId]);

  return (
    <AdminLayout>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Kalkulation</h2>
          {pricebooks.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Preisbuch:</span>
              <Select value={activePb || ''} onValueChange={setSelectedPbId}>
                <SelectTrigger className="w-[260px]">
                  <SelectValue placeholder="Preisbuch wählen" />
                </SelectTrigger>
                <SelectContent className="z-[200] bg-popover">
                  {pricebooks.map((pb: any) => (
                    <SelectItem key={pb.id} value={pb.id}>
                      {pb.name} {pb.is_active ? '(aktiv)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <Tabs defaultValue="products" className="space-y-4">
          <TabsList>
            <TabsTrigger value="products" className="gap-2">
              <Package className="h-4 w-4" />
              Produkte
            </TabsTrigger>
            <TabsTrigger value="packages" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Pakete
            </TabsTrigger>
            <TabsTrigger value="pricebooks" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Preisbücher
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <KalkulationProducts pricebookId={activePb} />
          </TabsContent>
          <TabsContent value="packages">
            <KalkulationPackages pricebookId={activePb} />
          </TabsContent>
          <TabsContent value="pricebooks">
            <KalkulationPricebooks />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminKalkulation;
