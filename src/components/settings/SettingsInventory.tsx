import { useState, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { MaterialCatalogItem } from '@/types/database';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { supabase } from '@/integrations/supabase/client';

interface SortableRowProps {
  mat: MaterialCatalogItem;
  vTypeName: string | undefined;
  onEdit: (mat: MaterialCatalogItem) => void;
  onDelete: (id: string) => void;
}

const SortableRow = ({ mat, vTypeName, onEdit, onDelete }: SortableRowProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: mat.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="w-8 px-1">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground">
          <GripVertical className="h-4 w-4" />
        </button>
      </TableCell>
      <TableCell className="font-medium text-foreground">{mat.name}</TableCell>
      <TableCell className="text-muted-foreground">{mat.article_number}</TableCell>
      <TableCell className="text-muted-foreground">{mat.category}</TableCell>
      <TableCell>
        <Badge variant="outline" className="font-normal">{vTypeName}</Badge>
      </TableCell>
      <TableCell>
        <Badge className={
          mat.item_type === 'Lager'
            ? 'bg-badge-lager text-badge-lager-text border-0'
            : 'bg-badge-bestellung text-badge-bestellung-text border-0'
        }>
          {mat.item_type}
        </Badge>
      </TableCell>
      <TableCell className="text-center">{mat.target_quantity}</TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(mat)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(mat.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

const SettingsInventory = () => {
  const { materialCatalog, vehicleTypes, addMaterial, updateMaterial, deleteMaterial, deleteMaterialsByCategory } = useData();

  const [filterTypeId, setFilterTypeId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<MaterialCatalogItem | null>(null);

  // Category management
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [deleteCategoryConfirm, setDeleteCategoryConfirm] = useState<string | null>(null);
  const [renameCategoryFrom, setRenameCategoryFrom] = useState<string | null>(null);
  const [renameCategoryTo, setRenameCategoryTo] = useState('');

  // Form state
  const [formName, setFormName] = useState('');
  const [formArticle, setFormArticle] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formItemType, setFormItemType] = useState<'Lager' | 'Bestellung'>('Lager');
  const [formTypeId, setFormTypeId] = useState('');
  const [formTargetQty, setFormTargetQty] = useState('1');

  const filteredMaterials = materialCatalog.filter(
    m => filterTypeId === 'all' || m.type_id === filterTypeId
  );

  const categories = [...new Set(filteredMaterials.map(m => m.category))].sort();

  const sortedDisplayed = useMemo(() => {
    const list = selectedCategory
      ? filteredMaterials.filter(m => m.category === selectedCategory)
      : filteredMaterials;
    return [...list].sort((a, b) => a.sort_order - b.sort_order);
  }, [filteredMaterials, selectedCategory]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortedDisplayed.findIndex(m => m.id === active.id);
    const newIndex = sortedDisplayed.findIndex(m => m.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(sortedDisplayed, oldIndex, newIndex);
    // Update sort_order for each item
    const updates = reordered.map((item, idx) => ({
      ...item,
      sort_order: idx + 1,
    }));

    // Optimistically update local state
    for (const u of updates) {
      updateMaterial(u);
    }

    // Persist to DB
    for (const u of updates) {
      await supabase.from('material_catalog').update({ sort_order: u.sort_order } as any).eq('id', u.id);
    }
  };

  const openAdd = () => {
    setEditItem(null);
    setFormName('');
    setFormArticle('');
    setFormCategory('');
    setFormItemType('Lager');
    setFormTypeId(filterTypeId !== 'all' ? filterTypeId : vehicleTypes[0]?.id || '');
    setFormTargetQty('1');
    setDialogOpen(true);
  };

  const openEdit = (mat: MaterialCatalogItem) => {
    setEditItem(mat);
    setFormName(mat.name);
    setFormArticle(mat.article_number);
    setFormCategory(mat.category);
    setFormItemType(mat.item_type);
    setFormTypeId(mat.type_id);
    setFormTargetQty(String(mat.target_quantity));
    setDialogOpen(true);
  };

  const handleSave = () => {
    const item: MaterialCatalogItem = {
      id: editItem?.id || '',
      name: formName.trim(),
      article_number: formArticle.trim(),
      category: formCategory.trim(),
      item_type: formItemType,
      type_id: formTypeId,
      target_quantity: Math.max(0, parseInt(formTargetQty) || 0),
      sort_order: editItem?.sort_order ?? 999,
    };
    if (editItem) {
      updateMaterial(item);
    } else {
      addMaterial(item);
    }
    setDialogOpen(false);
  };

  const isFormValid = formName.trim() && formArticle.trim() && formCategory.trim() && formTypeId;

  const handleRenameCategory = async () => {
    if (!renameCategoryFrom || !renameCategoryTo.trim()) return;
    const newName = renameCategoryTo.trim();
    const toUpdate = materialCatalog.filter(
      m => m.category === renameCategoryFrom && (filterTypeId === 'all' || m.type_id === filterTypeId)
    );
    for (const mat of toUpdate) {
      await updateMaterial({ ...mat, category: newName });
    }
    if (selectedCategory === renameCategoryFrom) setSelectedCategory(newName);
    setRenameCategoryFrom(null);
  };

  return (
    <>
    <div className="flex gap-6 h-[calc(100vh-160px)]">
      {/* Left: Categories */}
      <div className="w-64 shrink-0 space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fahrzeugart</Label>
          <Select value={filterTypeId} onValueChange={(v) => { setFilterTypeId(v); setSelectedCategory(null); }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              {vehicleTypes.map(vt => (
                <SelectItem key={vt.id} value={vt.id}>{vt.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-foreground">Kategorien</h3>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setNewCategoryName(''); setCategoryDialogOpen(true); }}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="space-y-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`w-full rounded-md px-3 py-1.5 text-left text-xs transition-colors ${
                selectedCategory === null
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              Alle ({filteredMaterials.length})
            </button>
            {categories.map(cat => {
              const count = filteredMaterials.filter(m => m.category === cat).length;
              return (
                <div key={cat} className="group flex items-center">
                  <button
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex-1 rounded-md px-3 py-1.5 text-left text-xs transition-colors ${
                      selectedCategory === cat
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                  <button
                    onClick={() => { setRenameCategoryFrom(cat); setRenameCategoryTo(cat); }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground transition-opacity"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => setDeleteCategoryConfirm(cat)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right: Items Table */}
      <div className="flex-1 overflow-auto rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <h3 className="text-sm font-semibold text-foreground">
            Materialien {selectedCategory && `— ${selectedCategory}`}
          </h3>
          <Button size="sm" onClick={openAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Hinzufügen
          </Button>
        </div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Bezeichnung</TableHead>
                <TableHead>Art.-Nr.</TableHead>
                <TableHead>Kategorie</TableHead>
                <TableHead>Fahrzeugart</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead className="text-center">Soll</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <SortableContext items={sortedDisplayed.map(m => m.id)} strategy={verticalListSortingStrategy}>
                {sortedDisplayed.map(mat => {
                  const vt = vehicleTypes.find(v => v.id === mat.type_id);
                  return (
                    <SortableRow
                      key={mat.id}
                      mat={mat}
                      vTypeName={vt?.name}
                      onEdit={openEdit}
                      onDelete={deleteMaterial}
                    />
                  );
                })}
              </SortableContext>
            </TableBody>
          </Table>
        </DndContext>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? 'Material bearbeiten' : 'Material hinzufügen'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Bezeichnung</Label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="z.B. Kupferrohr 15mm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Artikelnummer</Label>
                <Input value={formArticle} onChange={e => setFormArticle(e.target.value)} placeholder="z.B. SHK-001" />
              </div>
              <div className="grid gap-2">
                <Label>Kategorie</Label>
                <Input value={formCategory} onChange={e => setFormCategory(e.target.value)} placeholder="z.B. Bauteile" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Fahrzeugart</Label>
                <Select value={formTypeId} onValueChange={setFormTypeId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {vehicleTypes.map(vt => (
                      <SelectItem key={vt.id} value={vt.id}>{vt.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Materialtyp</Label>
                <Select value={formItemType} onValueChange={(v) => setFormItemType(v as 'Lager' | 'Bestellung')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lager">Lager</SelectItem>
                    <SelectItem value="Bestellung">Bestellung</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Soll-Bestand</Label>
                <Input type="number" min={0} value={formTargetQty} onChange={e => setFormTargetQty(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleSave} disabled={!isFormValid}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>

      {/* Add Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kategorie hinzufügen</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Kategoriename</Label>
              <Input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="z.B. Werkzeug" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>Abbrechen</Button>
            <Button
              disabled={!newCategoryName.trim() || categories.includes(newCategoryName.trim())}
              onClick={() => {
                const typeId = filterTypeId !== 'all' ? filterTypeId : vehicleTypes[0]?.id || '';
                addMaterial({
                  id: '',
                  name: 'Neues Material',
                  article_number: '',
                  category: newCategoryName.trim(),
                  item_type: 'Lager',
                  type_id: typeId,
                  target_quantity: 0,
                  sort_order: 999,
                });
                setSelectedCategory(newCategoryName.trim());
                setCategoryDialogOpen(false);
              }}
            >
              Hinzufügen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteCategoryConfirm} onOpenChange={(open) => { if (!open) setDeleteCategoryConfirm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kategorie löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Die Kategorie „{deleteCategoryConfirm}" und alle {filteredMaterials.filter(m => m.category === deleteCategoryConfirm).length} darin enthaltenen Materialien werden unwiderruflich gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteCategoryConfirm) {
                  deleteMaterialsByCategory(deleteCategoryConfirm, filterTypeId);
                  if (selectedCategory === deleteCategoryConfirm) setSelectedCategory(null);
                  setDeleteCategoryConfirm(null);
                }
              }}
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Category Dialog */}
      <Dialog open={!!renameCategoryFrom} onOpenChange={(open) => { if (!open) setRenameCategoryFrom(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kategorie umbenennen</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>Neuer Name</Label>
            <Input
              className="mt-1"
              value={renameCategoryTo}
              onChange={e => setRenameCategoryTo(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && renameCategoryTo.trim() && renameCategoryTo.trim() !== renameCategoryFrom && handleRenameCategory()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameCategoryFrom(null)}>Abbrechen</Button>
            <Button
              disabled={!renameCategoryTo.trim() || renameCategoryTo.trim() === renameCategoryFrom}
              onClick={handleRenameCategory}
            >
              Umbenennen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SettingsInventory;
