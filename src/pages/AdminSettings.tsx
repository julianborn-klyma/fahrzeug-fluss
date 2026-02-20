import AdminLayout from '@/components/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Users, Truck, Tag, Trophy, ToggleRight, Warehouse, UsersRound, FolderKanban, Settings2 } from 'lucide-react';
import { useBonusSettings } from '@/context/BonusSettingsContext';
import SettingsInventory from '@/components/settings/SettingsInventory';
import SettingsUsers from '@/components/settings/SettingsUsers';
import SettingsTeams from '@/components/settings/SettingsTeams';
import SettingsVehicles from '@/components/settings/SettingsVehicles';
import SettingsVehicleTypes from '@/components/settings/SettingsVehicleTypes';
import SettingsBonusParams from '@/components/settings/SettingsBonusParams';
import SettingsModules from '@/components/settings/SettingsModules';
import SettingsOrderTypes from '@/components/settings/SettingsOrderTypes';
import SettingsBranding from '@/components/settings/SettingsBranding';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMyModuleAccess } from '@/hooks/useModuleAccess';

const AdminSettings = () => {
  const { hasRole } = useAuth();
  const { settings } = useBonusSettings();
  const { data: myModules = [] } = useMyModuleAccess();
  const isAdmin = hasRole('admin');
  const isOffice = hasRole('office') && !isAdmin && !hasRole('teamleiter');

  const canSee = (moduleKey: string, globalEnabled: boolean) => {
    if (!globalEnabled) return false;
    if (isAdmin) return true;
    return myModules.includes(moduleKey);
  };

  const perfEnabled = !isOffice && canSee('module_performance_enabled', settings?.module_performance_enabled ?? true);
  const lagerEnabled = canSee('module_fahrzeuglager_enabled', settings?.module_fahrzeuglager_enabled ?? true);
  const klymaOsEnabled = !isOffice && canSee('module_klyma_os_enabled', settings?.module_klyma_os_enabled ?? true);
  const [lagerSubTab, setLagerSubTab] = useState<'inventory' | 'vehicles' | 'vehicleTypes'>('inventory');
  const [userSubTab, setUserSubTab] = useState<'users' | 'teams' | 'branding'>('users');

  return (
    <AdminLayout>
      <div className="p-4">
        <Tabs defaultValue={isOffice ? "fahrzeuglager" : "modules"} className="space-y-6">
          <TabsList>
            {!isOffice && (
              <TabsTrigger value="modules" className="gap-2">
                <ToggleRight className="h-4 w-4" />
                Module
              </TabsTrigger>
            )}
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Benutzer
            </TabsTrigger>
            {klymaOsEnabled && (
              <TabsTrigger value="montage" className="gap-2">
                <FolderKanban className="h-4 w-4" />
                Montage
              </TabsTrigger>
            )}
            {lagerEnabled && (
              <TabsTrigger value="fahrzeuglager" className="gap-2">
                <Warehouse className="h-4 w-4" />
                Fahrzeuglager
              </TabsTrigger>
            )}
            {perfEnabled && (
              <TabsTrigger value="bonus" className="gap-2">
                <Trophy className="h-4 w-4" />
                Bonus-Parameter
              </TabsTrigger>
            )}
          </TabsList>

          {!isOffice && (
            <TabsContent value="modules">
              <SettingsModules />
            </TabsContent>
          )}
          <TabsContent value="users">
            <div className="space-y-4">
              <div className="flex gap-1 border-b">
                {[
                  { key: 'users' as const, label: 'Nutzerverwaltung', icon: Users },
                  { key: 'teams' as const, label: 'Teamverwaltung', icon: UsersRound },
                  { key: 'branding' as const, label: 'Weitere Einstellungen', icon: Settings2 },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setUserSubTab(key)}
                    className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                      userSubTab === key
                        ? 'border-primary text-foreground'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
              {userSubTab === 'users' && <SettingsUsers />}
              {userSubTab === 'teams' && <SettingsTeams />}
              {userSubTab === 'branding' && <SettingsBranding />}
            </div>
          </TabsContent>
          {klymaOsEnabled && (
            <TabsContent value="montage">
              <SettingsOrderTypes />
            </TabsContent>
          )}
          {lagerEnabled && (
            <TabsContent value="fahrzeuglager">
              <div className="space-y-4">
                <div className="flex gap-1 border-b">
                  {[
                    { key: 'inventory' as const, label: 'Inventar', icon: Package },
                    { key: 'vehicles' as const, label: 'Fahrzeuge', icon: Truck },
                    { key: 'vehicleTypes' as const, label: 'Fahrzeugarten', icon: Tag },
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setLagerSubTab(key)}
                      className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                        lagerSubTab === key
                          ? 'border-primary text-foreground'
                          : 'border-transparent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>
                {lagerSubTab === 'inventory' && <SettingsInventory />}
                {lagerSubTab === 'vehicles' && <SettingsVehicles />}
                {lagerSubTab === 'vehicleTypes' && <SettingsVehicleTypes />}
              </div>
            </TabsContent>
          )}
          {perfEnabled && (
            <TabsContent value="bonus">
              <SettingsBonusParams />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
