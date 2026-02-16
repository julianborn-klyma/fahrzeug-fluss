import { useState, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { useInventory } from '@/context/InventoryContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AdminLayout from '@/components/AdminLayout';
import { Truck, AlertTriangle, Download, RotateCcw, FileText, FileSpreadsheet, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { getMissingItems, exportCSV, exportPDF } from '@/lib/exports';
import ExportAddressDialog from '@/components/ExportAddressDialog';

type SortDir = 'asc' | 'desc';

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
  return dir === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />;
}

function useSort<K extends string>(defaultKey: K) {
  const [sortKey, setSortKey] = useState<K>(defaultKey);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const toggle = (key: K) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };
  return { sortKey, sortDir, toggle };
}

const AdminDashboard = () => {
  const { vehicles, vehicleTypes, materialCatalog, assignments, users, teams } = useData();
  const { inventory, setToTarget, updateQuantity } = useInventory();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [pendingExportType, setPendingExportType] = useState<'Lager' | 'Bestellung' | 'all'>('Lager');
  const [confirmTargetOpen, setConfirmTargetOpen] = useState(false);

  // Sort state for vehicle list
  type VehicleSortKey = 'plate' | 'type' | 'assigned' | 'teams' | 'missing';
  const vSort = useSort<VehicleSortKey>('plate');

  // Sort state for material detail table
  type MatSortKey = 'name' | 'article' | 'category' | 'type' | 'target' | 'actual' | 'diff';
  const mSort = useSort<MatSortKey>('name');

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
  const selectedVType = vehicleTypes.find(vt => vt.id === selectedVehicle?.type_id);

  const getQuantity = (materialId: string) => {
    const entry = inventory.find(
      i => i.vehicle_id === selectedVehicleId && i.material_id === materialId
    );
    return entry?.current_quantity ?? 0;
  };

  const materialsForSelected = selectedVehicle
    ? materialCatalog.filter(m => m.type_id === selectedVehicle.type_id).sort((a, b) => a.sort_order - b.sort_order)
    : [];

  const getAssignedUsers = (vehicleId: string) => {
    const userIds = assignments.filter(a => a.vehicle_id === vehicleId).map(a => a.user_id);
    return users.filter(u => userIds.includes(u.id)).map(u => u.name).join(', ') || '—';
  };

  const getAssignedTeams = (vehicleId: string) => {
    const userIds = assignments.filter(a => a.vehicle_id === vehicleId).map(a => a.user_id);
    const teamIds = new Set(
      users.filter(u => userIds.includes(u.id) && u.team_id).map(u => u.team_id!)
    );
    return teams.filter(t => teamIds.has(t.id));
  };

  const startEdit = (materialId: string, currentQty: number) => {
    setEditingCell(materialId);
    setEditValue(String(currentQty));
  };

  const openPdfExport = (type: 'Lager' | 'Bestellung' | 'all') => {
    setPendingExportType(type);
    setAddressDialogOpen(true);
  };

  const handlePdfExport = (address: string) => {
    if (!selectedVehicle) return;
    setAddressDialogOpen(false);
    exportPDF(selectedVehicle.id, selectedVehicle.license_plate, inventory, pendingExportType, materialCatalog, {
      customerAddress: address,
      assignedTo: getAssignedUsers(selectedVehicle.id),
      vehicleName: selectedVType?.name,
      typeId: selectedVehicle.type_id,
    });
  };

  const commitEdit = (materialId: string) => {
    if (selectedVehicleId) {
      const val = Math.max(0, parseInt(editValue) || 0);
      updateQuantity(selectedVehicleId, materialId, val);
    }
    setEditingCell(null);
  };

  // Sorted vehicles
  const sortedVehicles = useMemo(() => {
    const list = [...vehicles];
    list.sort((a, b) => {
      let cmp = 0;
      if (vSort.sortKey === 'plate') cmp = a.license_plate.localeCompare(b.license_plate);
      else if (vSort.sortKey === 'type') {
        const ta = vehicleTypes.find(vt => vt.id === a.type_id)?.name || '';
        const tb = vehicleTypes.find(vt => vt.id === b.type_id)?.name || '';
        cmp = ta.localeCompare(tb);
      } else if (vSort.sortKey === 'assigned') cmp = getAssignedUsers(a.id).localeCompare(getAssignedUsers(b.id));
      else if (vSort.sortKey === 'teams') {
        const aTeams = getAssignedTeams(a.id).map(t => t.name).join(',');
        const bTeams = getAssignedTeams(b.id).map(t => t.name).join(',');
        cmp = aTeams.localeCompare(bTeams);
      } else if (vSort.sortKey === 'missing') {
        cmp = getMissingItems(a.id, inventory, materialCatalog, a.type_id).length - getMissingItems(b.id, inventory, materialCatalog, b.type_id).length;
      }
      return vSort.sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [vehicles, vehicleTypes, assignments, users, teams, inventory, materialCatalog, vSort.sortKey, vSort.sortDir]);

  // Sorted materials
  const sortedMaterials = useMemo(() => {
    const list = [...materialsForSelected];
    list.sort((a, b) => {
      let cmp = 0;
      if (mSort.sortKey === 'name') cmp = a.name.localeCompare(b.name);
      else if (mSort.sortKey === 'article') cmp = (a.article_number || '').localeCompare(b.article_number || '');
      else if (mSort.sortKey === 'category') cmp = a.category.localeCompare(b.category);
      else if (mSort.sortKey === 'type') cmp = a.item_type.localeCompare(b.item_type);
      else if (mSort.sortKey === 'target') cmp = a.target_quantity - b.target_quantity;
      else if (mSort.sortKey === 'actual') cmp = getQuantity(a.id) - getQuantity(b.id);
      else if (mSort.sortKey === 'diff') cmp = (a.target_quantity - getQuantity(a.id)) - (b.target_quantity - getQuantity(b.id));
      return mSort.sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [materialsForSelected, inventory, selectedVehicleId, mSort.sortKey, mSort.sortDir]);

  const SortHead = ({ label, col, sort }: { label: string; col: string; sort: ReturnType<typeof useSort> }) => (
    <TableHead
      className="text-xs cursor-pointer select-none"
      onClick={() => sort.toggle(col as any)}
    >
      <span className="inline-flex items-center">
        {label}
        <SortIcon active={sort.sortKey === col} dir={sort.sortDir} />
      </span>
    </TableHead>
  );

  return (
    <AdminLayout>
      <div className="h-[calc(100vh-53px)]">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={45} minSize={20} maxSize={60}>
            {/* Left: Vehicle List */}
            <div className="h-full overflow-auto">
          <div className="px-4 py-3 border-b">
            <h2 className="text-sm font-semibold text-foreground">Fahrzeuge</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <SortHead label="Kennzeichen" col="plate" sort={vSort} />
                <SortHead label="Typ" col="type" sort={vSort} />
                <SortHead label="Zugewiesen" col="assigned" sort={vSort} />
                <SortHead label="Teams" col="teams" sort={vSort} />
                <SortHead label="Fehl." col="missing" sort={vSort} />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedVehicles.map(vehicle => {
                const vType = vehicleTypes.find(vt => vt.id === vehicle.type_id);
                const missingItems = getMissingItems(vehicle.id, inventory, materialCatalog, vehicle.type_id);
                const isSelected = vehicle.id === selectedVehicleId;
                const vehicleTeams = getAssignedTeams(vehicle.id);

                return (
                  <TableRow
                    key={vehicle.id}
                    className={`cursor-pointer transition-colors ${isSelected ? 'bg-primary/5' : 'hover:bg-muted/50'}`}
                    onClick={() => setSelectedVehicleId(vehicle.id)}
                  >
                    <TableCell className="text-xs font-medium text-foreground py-2">
                      {vehicle.license_plate}
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge variant="outline" className="text-[10px] font-normal px-1.5 py-0">
                        {vType?.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground py-2 max-w-[120px] truncate">
                      {getAssignedUsers(vehicle.id)}
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex flex-wrap gap-0.5">
                        {vehicleTeams.length > 0 ? vehicleTeams.map(t => (
                          <Badge key={t.id} variant="outline" className="text-[10px] font-normal px-1.5 py-0">
                            {t.name}
                          </Badge>
                        )) : (
                          <span className="text-[10px] text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-2">
                      {missingItems.length > 0 ? (
                        <Badge variant="destructive" className="gap-0.5 text-[10px] px-1.5 py-0">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          {missingItems.length}
                        </Badge>
                      ) : (
                        <Badge className="bg-badge-bestellung text-badge-bestellung-text border-0 text-[10px] px-1.5 py-0">
                          OK
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
           </Table>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={55} minSize={30}>
            {/* Right: Vehicle Detail */}
            <div className="h-full overflow-auto">
          {selectedVehicle ? (
            <>
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div>
                  <h2 className="text-base font-bold text-foreground">
                    {selectedVehicle.license_plate}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {selectedVType?.name} · {getAssignedUsers(selectedVehicle.id)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => setConfirmTargetOpen(true)}
                  >
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                    Auf Soll setzen
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" className="text-xs h-8">
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => exportCSV(selectedVehicle.id, selectedVehicle.license_plate, inventory, 'Lager', materialCatalog, selectedVehicle.type_id)}>
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        CSV — Lager
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => exportCSV(selectedVehicle.id, selectedVehicle.license_plate, inventory, 'Bestellung', materialCatalog, selectedVehicle.type_id)}>
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        CSV — Bestellung
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => openPdfExport('Lager')}>
                        <FileText className="mr-2 h-4 w-4" />
                        PDF — Lager
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openPdfExport('Bestellung')}>
                        <FileText className="mr-2 h-4 w-4" />
                        PDF — Bestellung
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openPdfExport('all')}>
                        <FileText className="mr-2 h-4 w-4" />
                        PDF — Alle fehlenden
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <SortHead label="Bezeichnung" col="name" sort={mSort} />
                    <SortHead label="Art.-Nr." col="article" sort={mSort} />
                    <SortHead label="Kategorie" col="category" sort={mSort} />
                    <SortHead label="Typ" col="type" sort={mSort} />
                    <SortHead label="Soll" col="target" sort={mSort} />
                    <SortHead label="Ist" col="actual" sort={mSort} />
                    <SortHead label="Diff." col="diff" sort={mSort} />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedMaterials.map(mat => {
                    const qty = getQuantity(mat.id);
                    const diff = mat.target_quantity - qty;
                    const isEditing = editingCell === mat.id;
                    return (
                      <TableRow key={mat.id}>
                        <TableCell className="text-xs font-medium text-foreground py-2">{mat.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground py-2">{mat.article_number}</TableCell>
                        <TableCell className="text-xs text-muted-foreground py-2">{mat.category}</TableCell>
                        <TableCell className="py-2">
                          <Badge
                            className={`text-[10px] px-1.5 py-0 ${
                              mat.item_type === 'Lager'
                                ? 'bg-badge-lager text-badge-lager-text border-0'
                                : 'bg-badge-bestellung text-badge-bestellung-text border-0'
                            }`}
                          >
                            {mat.item_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-center text-muted-foreground py-2">
                          {mat.target_quantity}
                        </TableCell>
                        <TableCell className="text-center py-1">
                          {isEditing ? (
                            <Input
                              type="number"
                              min={0}
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onBlur={() => commitEdit(mat.id)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') commitEdit(mat.id);
                                if (e.key === 'Escape') setEditingCell(null);
                              }}
                              className="h-7 w-16 text-xs text-center mx-auto"
                              autoFocus
                            />
                          ) : (
                            <button
                              onClick={() => startEdit(mat.id, qty)}
                              className="inline-flex items-center justify-center rounded px-2 py-0.5 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-text min-w-[2rem]"
                            >
                              {qty}
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-center py-2">
                          {diff > 0 ? (
                            <span className="font-semibold text-destructive">-{diff}</span>
                          ) : (
                            <span className="text-success font-medium">✓</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <Truck className="mx-auto h-12 w-12 text-muted-foreground/30" />
                <p className="mt-4 text-sm text-muted-foreground">
                  Fahrzeug auswählen, um Details anzuzeigen
                </p>
              </div>
            </div>
          )}
        </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <ExportAddressDialog
        open={addressDialogOpen}
        onOpenChange={setAddressDialogOpen}
        onConfirm={handlePdfExport}
        exportLabel={`PDF exportieren (${pendingExportType === 'all' ? 'Alle' : pendingExportType})`}
      />

      <AlertDialog open={confirmTargetOpen} onOpenChange={setConfirmTargetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fahrzeug auffüllen</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie das ausgewählte Fahrzeug ({selectedVehicle?.license_plate}) vollständig auffüllen wollen? Alle Ist-Werte werden auf die Soll-Werte gesetzt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (selectedVehicle) {
                setToTarget(selectedVehicle.id, selectedVehicle.type_id);
              }
            }}>
              Bestätigen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminDashboard;
