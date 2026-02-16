import { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Plus, Pencil, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

interface Team {
  id: string;
  name: string;
}

interface UserWithRoles {
  user_id: string;
  name: string;
  email: string;
  roles: string[];
  team_id: string | null;
}

type SortKey = 'name' | 'email' | 'roles' | 'team';
type SortDir = 'asc' | 'desc';

const SettingsUsers = () => {
  const { vehicles, assignments, addAssignment, removeAssignment } = useData();
  const { toast } = useToast();
  const { hasRole: currentUserHasRole } = useAuth();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Role editing
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRoles | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<{ admin: boolean; monteur: boolean; teamleiter: boolean; office: boolean }>({ admin: false, monteur: false, teamleiter: false, office: false });
  const isOfficeOnly = currentUserHasRole('office') && !currentUserHasRole('admin') && !currentUserHasRole('teamleiter');
  const [editName, setEditName] = useState('');
  const [editTeamId, setEditTeamId] = useState<string>('');
  const [teams, setTeams] = useState<Team[]>([]);

  // Monteur assignment to teamleiter
  const [teamleiterAssignDialogOpen, setTeamleiterAssignDialogOpen] = useState(false);
  const [assignTeamleiterId, setAssignTeamleiterId] = useState('');
  const [selectedMonteurIds, setSelectedMonteurIds] = useState<string[]>([]);
  const [teamleiterAssignments, setTeamleiterAssignments] = useState<{ id: string; teamleiter_id: string; monteur_id: string }[]>([]);

  // Assignment dialog
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignUserId, setAssignUserId] = useState('');
  const [assignVehicleId, setAssignVehicleId] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from('profiles').select('user_id, name, email, team_id');
    const { data: roles } = await supabase.from('user_roles').select('user_id, role');

    if (profiles) {
      const userMap = new Map<string, UserWithRoles>();
      for (const p of profiles) {
        userMap.set(p.user_id, { user_id: p.user_id, name: p.name || '', email: p.email || '', roles: [], team_id: (p as any).team_id || null });
      }
      if (roles) {
        for (const r of roles) {
          const u = userMap.get(r.user_id);
          if (u) u.roles.push(r.role);
        }
      }
      setUsers(Array.from(userMap.values()));
    }

    // Fetch teamleiter assignments
    const { data: tAssigns } = await supabase.from('teamleiter_monteur_assignments').select('id, teamleiter_id, monteur_id');
    setTeamleiterAssignments(tAssigns || []);

    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const fetchTeams = async () => {
    const { data } = await supabase.from('teams').select('id, name').order('name');
    setTeams(data || []);
  };
  useEffect(() => { fetchTeams(); }, []);

  const openRoleEdit = (user: UserWithRoles) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditTeamId(user.team_id || '__none__');
    setSelectedRoles({
      admin: user.roles.includes('admin'),
      monteur: user.roles.includes('monteur'),
      teamleiter: user.roles.includes('teamleiter'),
      office: user.roles.includes('office'),
    });
    setRoleDialogOpen(true);
  };

  const saveRoles = async () => {
    if (!editingUser) return;
    const userId = editingUser.user_id;
    const currentRoles = editingUser.roles;
    const newRoles: string[] = [];
    if (selectedRoles.admin) newRoles.push('admin');
    if (selectedRoles.monteur) newRoles.push('monteur');
    if (selectedRoles.teamleiter) newRoles.push('teamleiter');
    if (selectedRoles.office) newRoles.push('office');

    // Update name and team if changed
    const trimmedName = editName.trim();
    const newTeamId = editTeamId === '__none__' ? null : editTeamId;
    const updates: Record<string, any> = {};
    if (trimmedName && trimmedName !== editingUser.name) updates.name = trimmedName;
    if (newTeamId !== editingUser.team_id) updates.team_id = newTeamId;
    if (Object.keys(updates).length > 0) {
      await supabase.from('profiles').update(updates).eq('user_id', userId);
    }

    // Remove roles that were removed
    for (const r of currentRoles) {
      if (!newRoles.includes(r)) {
        await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', r as any);
      }
    }
    // Add roles that are new
    for (const r of newRoles) {
      if (!currentRoles.includes(r)) {
        await supabase.from('user_roles').insert({ user_id: userId, role: r as any });
      }
    }

    toast({ title: 'Benutzer aktualisiert' });
    setRoleDialogOpen(false);
    fetchUsers();
  };

  const getAssignedVehicles = (userId: string) => {
    const vehicleIds = assignments.filter(a => a.user_id === userId).map(a => a.vehicle_id);
    return vehicles.filter(v => vehicleIds.includes(v.id));
  };

  const getAssignedMonteurs = (teamleiterId: string) => {
    return teamleiterAssignments
      .filter(a => a.teamleiter_id === teamleiterId)
      .map(a => {
        const u = users.find(u => u.user_id === a.monteur_id);
        return { assignId: a.id, monteurId: a.monteur_id, name: u?.name || '(Unbekannt)' };
      });
  };

  const removeMonteurAssignment = async (assignId: string) => {
    await supabase.from('teamleiter_monteur_assignments').delete().eq('id', assignId);
    fetchUsers();
  };

  const addMonteurAssignments = async () => {
    if (!assignTeamleiterId || selectedMonteurIds.length === 0) return;
    for (const monteurId of selectedMonteurIds) {
      await supabase.from('teamleiter_monteur_assignments').insert({
        teamleiter_id: assignTeamleiterId,
        monteur_id: monteurId,
      } as any);
    }
    setTeamleiterAssignDialogOpen(false);
    setSelectedMonteurIds([]);
    fetchUsers();
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDir === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  const filteredUsers = useMemo(() => {
    let list = users.filter(u => {
      if (!isOfficeOnly) return true;
      return u.roles.some(r => r === 'monteur' || r === 'office') || u.roles.length === 0;
    });
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') cmp = (a.name || '').localeCompare(b.name || '');
      else if (sortKey === 'email') cmp = (a.email || '').localeCompare(b.email || '');
      else if (sortKey === 'roles') cmp = a.roles.join(',').localeCompare(b.roles.join(','));
      else if (sortKey === 'team') {
        const aTeam = teams.find(t => t.id === a.team_id)?.name || '';
        const bTeam = teams.find(t => t.id === b.team_id)?.name || '';
        cmp = aTeam.localeCompare(bTeam);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [users, isOfficeOnly, sortKey, sortDir, teams]);

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h3 className="text-sm font-semibold text-foreground">Benutzer</h3>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Laden…</div>
      ) : users.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Noch keine Benutzer registriert.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('name')}>
                <span className="inline-flex items-center">Name<SortIcon col="name" /></span>
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('email')}>
                <span className="inline-flex items-center">E-Mail<SortIcon col="email" /></span>
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('roles')}>
                <span className="inline-flex items-center">Rollen<SortIcon col="roles" /></span>
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('team')}>
                <span className="inline-flex items-center">Team<SortIcon col="team" /></span>
              </TableHead>
              <TableHead>Zugewiesene Fahrzeuge</TableHead>
              <TableHead>Zugewiesene Monteure</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map(user => {
              const assignedVehicles = getAssignedVehicles(user.user_id);
              const isTeamleiter = user.roles.includes('teamleiter');
              const assignedMonteurs = isTeamleiter ? getAssignedMonteurs(user.user_id) : [];
              return (
                <TableRow key={user.user_id}>
                  <TableCell className="font-medium text-foreground">{user.name || '(Kein Name)'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{user.email || '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {user.roles.length === 0 && (
                        <Badge variant="outline" className="text-muted-foreground">Keine Rolle</Badge>
                      )}
                      {user.roles.includes('admin') && <Badge variant="default">Admin</Badge>}
                      {user.roles.includes('teamleiter') && <Badge className="bg-badge-teamleiter text-badge-teamleiter-text border-transparent">Teamleiter</Badge>}
                      {user.roles.includes('office') && <Badge className="bg-badge-office text-badge-office-text border-transparent">Office</Badge>}
                      {user.roles.includes('monteur') && <Badge className="bg-badge-monteur text-badge-monteur-text border-transparent">Monteur</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {teams.find(t => t.id === user.team_id)?.name || '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {assignedVehicles.map(v => (
                        <Badge key={v.id} variant="secondary" className="gap-1">
                          {v.license_plate}
                          <button
                            className="ml-1 text-muted-foreground hover:text-destructive"
                            onClick={() => removeAssignment(user.user_id, v.id)}
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => {
                          setAssignUserId(user.user_id);
                          setAssignVehicleId('');
                          setAssignDialogOpen(true);
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Zuweisen
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {isTeamleiter ? (
                      <div className="flex flex-wrap gap-1">
                        {assignedMonteurs.map(m => (
                          <Badge key={m.assignId} variant="secondary" className="gap-1">
                            {m.name}
                            <button
                              className="ml-1 text-muted-foreground hover:text-destructive"
                              onClick={() => removeMonteurAssignment(m.assignId)}
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => {
                            setAssignTeamleiterId(user.user_id);
                            setSelectedMonteurIds([]);
                            setTeamleiterAssignDialogOpen(true);
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Monteur
                        </Button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openRoleEdit(user)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Role Edit Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Benutzer bearbeiten — {editingUser?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label htmlFor="edit-name" className="text-sm font-medium">Name</label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label htmlFor="edit-team" className="text-sm font-medium">Team</label>
              <Select value={editTeamId} onValueChange={setEditTeamId}>
                <SelectTrigger className="mt-1" id="edit-team">
                  <SelectValue placeholder="Kein Team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Kein Team</SelectItem>
                  {teams.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <h4 className="text-sm font-medium text-muted-foreground pt-2">Rollen</h4>
            {!isOfficeOnly && (
              <div className="flex items-center gap-3">
                <Checkbox
                  id="role-admin"
                  checked={selectedRoles.admin}
                  onCheckedChange={(c) => setSelectedRoles(prev => ({ ...prev, admin: !!c }))}
                />
                <label htmlFor="role-admin" className="text-sm font-medium">Admin</label>
              </div>
            )}
            {!isOfficeOnly && (
              <div className="flex items-center gap-3">
                <Checkbox
                  id="role-teamleiter"
                  checked={selectedRoles.teamleiter}
                  onCheckedChange={(c) => setSelectedRoles(prev => ({ ...prev, teamleiter: !!c }))}
                />
                <label htmlFor="role-teamleiter" className="text-sm font-medium">Teamleiter</label>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Checkbox
                id="role-office"
                checked={selectedRoles.office}
                onCheckedChange={(c) => setSelectedRoles(prev => ({ ...prev, office: !!c }))}
              />
              <label htmlFor="role-office" className="text-sm font-medium">Office</label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id="role-monteur"
                checked={selectedRoles.monteur}
                onCheckedChange={(c) => setSelectedRoles(prev => ({ ...prev, monteur: !!c }))}
              />
              <label htmlFor="role-monteur" className="text-sm font-medium">Monteur</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={saveRoles}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Vehicle Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fahrzeug zuweisen</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Select value={assignVehicleId} onValueChange={setAssignVehicleId}>
              <SelectTrigger><SelectValue placeholder="Fahrzeug wählen" /></SelectTrigger>
              <SelectContent>
                {vehicles
                  .filter(v => !assignments.some(a => a.user_id === assignUserId && a.vehicle_id === v.id))
                  .map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.license_plate}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Abbrechen</Button>
            <Button
              onClick={() => {
                if (assignVehicleId) {
                  addAssignment({ user_id: assignUserId, vehicle_id: assignVehicleId });
                  setAssignDialogOpen(false);
                }
              }}
              disabled={!assignVehicleId}
            >
              Zuweisen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Monteurs to Teamleiter Dialog */}
      <Dialog open={teamleiterAssignDialogOpen} onOpenChange={setTeamleiterAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Monteure zuweisen</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2 max-h-[300px] overflow-y-auto">
            {users
              .filter(u => u.roles.includes('monteur') && !teamleiterAssignments.some(a => a.teamleiter_id === assignTeamleiterId && a.monteur_id === u.user_id))
              .map(u => (
                <div key={u.user_id} className="flex items-center gap-3 px-1 py-1.5 rounded hover:bg-muted/50">
                  <Checkbox
                    id={`monteur-${u.user_id}`}
                    checked={selectedMonteurIds.includes(u.user_id)}
                    onCheckedChange={(checked) => {
                      setSelectedMonteurIds(prev =>
                        checked
                          ? [...prev, u.user_id]
                          : prev.filter(id => id !== u.user_id)
                      );
                    }}
                  />
                  <label htmlFor={`monteur-${u.user_id}`} className="text-sm font-medium cursor-pointer flex-1">
                    {u.name || '(Kein Name)'}
                  </label>
                </div>
              ))}
            {users.filter(u => u.roles.includes('monteur') && !teamleiterAssignments.some(a => a.teamleiter_id === assignTeamleiterId && a.monteur_id === u.user_id)).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Keine weiteren Monteure verfügbar.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTeamleiterAssignDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={addMonteurAssignments} disabled={selectedMonteurIds.length === 0}>
              {selectedMonteurIds.length > 0 ? `${selectedMonteurIds.length} zuweisen` : 'Zuweisen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsUsers;
