import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import SyncStatusBar from '@/components/SyncStatusBar';
import MonteurBottomNav from '@/components/MonteurBottomNav';
import { Truck, LogOut, ChevronRight, ArrowRightLeft } from 'lucide-react';

const MonteurVehicleSelect = () => {
  const { user, signOut, hasRole } = useAuth();
  const navigate = useNavigate();
  const { vehicles, assignments: userVehicleAssignments, vehicleTypes } = useData();
  const { isOnline, pendingCount, lastSyncedAt, syncing, doSync, markSynced } = useOfflineSync(async (changes) => {
    console.log('[Sync] Syncing changes:', changes);
  });

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const assignedVehicleIds = userVehicleAssignments.map(a => a.vehicle_id);
  const assignedVehicles = vehicles.filter(v => assignedVehicleIds.includes(v.id));
  const uniqueVehicles = [...new Map(assignedVehicles.map(v => [v.id, v])).values()];

  const handleSync = () => {
    doSync();
    markSynced();
  };

  return (
    <div className="flex min-h-screen flex-col bg-background pb-16">
      <header className="sticky top-0 z-10 border-b bg-card px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Meine Fahrzeuge</h1>
            <p className="text-sm text-muted-foreground">Hallo, {user?.name || user?.email}</p>
          </div>
          <div className="flex items-center gap-1">
            {hasRole('admin') && hasRole('monteur') && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
                    <ArrowRightLeft className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zur Admin-App</TooltipContent>
              </Tooltip>
            )}
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
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

      <main className="flex-1 p-4 space-y-3">
        {uniqueVehicles.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            Keine Fahrzeuge zugewiesen.
          </p>
        ) : (
          uniqueVehicles.map(vehicle => {
            const vType = vehicleTypes.find(vt => vt.id === vehicle.type_id);
            return (
              <Card
                key={vehicle.id}
                className="cursor-pointer transition-all hover:border-primary/40 hover:shadow-sm active:scale-[0.99]"
                onClick={() => navigate(`/inventory/${vehicle.id}`)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Truck className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{vehicle.license_plate}</p>
                    <p className="text-sm text-muted-foreground">{vType?.name || ''}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            );
          })
        )}
      </main>

      <MonteurBottomNav active="vehicles" />
    </div>
  );
};

export default MonteurVehicleSelect;
