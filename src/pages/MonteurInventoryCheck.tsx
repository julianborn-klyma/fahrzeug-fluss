import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useInventory } from '@/context/InventoryContext';
import { useData } from '@/context/DataContext';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import SyncStatusBar from '@/components/SyncStatusBar';
import StepperInput from '@/components/StepperInput';
import { ArrowLeft, Check, X } from 'lucide-react';

const MonteurInventoryCheck = () => {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const { user } = useAuth();
  const { inventory, updateQuantity } = useInventory();
  const navigate = useNavigate();
  const { vehicles, vehicleTypes, materialCatalog } = useData();
  const { isOnline, pendingCount, lastSyncedAt, syncing, queueChange, doSync, markSynced } = useOfflineSync(async (changes) => {
    console.log('[Sync] Syncing changes:', changes);
  });

  const vehicle = vehicles.find(v => v.id === vehicleId);
  const vType = vehicleTypes.find(vt => vt.id === vehicle?.type_id);

  const materialsForType = materialCatalog.filter(m => m.type_id === vehicle?.type_id);
  const categories = [...new Set(materialsForType.map(m => m.category))];
  const [selectedCategory, setSelectedCategory] = useState(categories[0] || '');

  if (!user || !vehicle) {
    return null;
  }

  const filteredMaterials = materialsForType.filter(m => m.category === selectedCategory).sort((a, b) => a.sort_order - b.sort_order);

  const getQuantity = (materialId: string) => {
    const entry = inventory.find(
      i => i.vehicle_id === vehicleId && i.material_id === materialId
    );
    return entry?.current_quantity ?? 0;
  };

  const handleQuantityChange = (materialId: string, value: number) => {
    updateQuantity(vehicle.id, materialId, value);
    queueChange(vehicle.id, materialId, value);
  };

  const handleSync = () => {
    doSync();
    markSynced();
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/vehicles')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-semibold text-foreground">{vehicle.license_plate}</h1>
            <p className="text-xs text-muted-foreground">{vType?.name}</p>
          </div>
        </div>
      </header>

      <SyncStatusBar
        isOnline={isOnline}
        pendingCount={pendingCount}
        lastSyncedAt={lastSyncedAt}
        syncing={syncing}
        onSync={handleSync}
      />

      {/* Category Tabs */}
      <div className="sticky top-[57px] z-10 border-b bg-card px-4 py-2">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map(cat => (
            <Button
              key={cat}
              variant={cat === selectedCategory ? 'default' : 'outline'}
              size="sm"
              className="shrink-0 rounded-full text-xs"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Material List */}
      <main className="flex-1 p-4 space-y-3 pb-8">
        {filteredMaterials.map(mat => {
          const qty = getQuantity(mat.id);
          const isAtTarget = qty >= mat.target_quantity;
          return (
            <Card key={mat.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground text-sm leading-tight flex-1">
                      {mat.name}
                    </p>
                    {isAtTarget ? (
                      <Check className="h-5 w-5 shrink-0 text-emerald-500" strokeWidth={3} />
                    ) : (
                      <X className="h-5 w-5 shrink-0 text-destructive" strokeWidth={3} />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Soll: {mat.target_quantity}
                    </span>
                    <StepperInput
                      value={qty}
                      onChange={val => handleQuantityChange(mat.id, val)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </main>
    </div>
  );
};

export default MonteurInventoryCheck;
