import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { useClients, type CreateClientInput } from '@/hooks/useClients';
import { useProperties } from '@/hooks/useProperties';
import { useJobs } from '@/hooks/useJobs';
import { useOrderTypes } from '@/hooks/useOrderTypes';
import { useJobAppointments } from '@/hooks/useJobAppointments';
import { supabase } from '@/integrations/supabase/client';
import type { Client, Property } from '@/types/montage';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Search } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedClient?: Client;
  preselectedProperty?: Property;
}

const CreateJobWizard: React.FC<Props> = ({ open, onOpenChange, preselectedClient, preselectedProperty }) => {
  const { clients, createClient } = useClients();
  const { jobs, createJob } = useJobs();
  const { orderTypes } = useOrderTypes();
  const { createDefaultAppointments } = useJobAppointments();
  const [step, setStep] = useState(1);

  // Step 1: Client
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClient, setNewClient] = useState<CreateClientInput>({ first_name: '', last_name: '', email: '', phone: '', billing_street: '', billing_city: '', billing_postal_code: '' });

  // Step 2: Property
  const { properties } = useProperties(selectedClient?.id);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [useBilling, setUseBilling] = useState(false);
  const [newPropStreet, setNewPropStreet] = useState('');
  const [newPropPlz, setNewPropPlz] = useState('');
  const [newPropCity, setNewPropCity] = useState('');
  const [showNewProp, setShowNewProp] = useState(false);

  // Step 3: Job details
  const [orderTypeId, setOrderTypeId] = useState('');
  const [description, setDescription] = useState('');
  const [generatedNumber, setGeneratedNumber] = useState('');
  const [plannerId, setPlannerId] = useState('');

  // Fetch profiles for planner selection
  const { data: allProfiles } = useQuery({
    queryKey: ['all-profiles'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').order('name');
      return data || [];
    },
  });

  // Preselect
  useEffect(() => {
    if (open) {
      if (preselectedClient) {
        setSelectedClient(preselectedClient);
        setStep(preselectedProperty ? 3 : 2);
        if (preselectedProperty) setSelectedProperty(preselectedProperty);
      } else {
        setStep(1);
        setSelectedClient(null);
        setSelectedProperty(null);
      }
      setOrderTypeId('');
      setDescription('');
      setPlannerId('');
      setShowNewClient(false);
      setShowNewProp(false);
    }
  }, [open, preselectedClient, preselectedProperty]);

  // Find selected order type
  const selectedOrderType = orderTypes.find(ot => ot.id === orderTypeId);
  const orderTypeShort = selectedOrderType?.name?.includes('Photovoltaik') ? 'PV'
    : selectedOrderType?.name?.includes('Installation PV') ? 'INST-PV'
    : selectedOrderType?.name?.includes('Installation WP') ? 'INST-WP'
    : selectedOrderType?.name?.includes('Wärmepumpe') ? 'WP'
    : selectedOrderType?.name?.substring(0, 4).toUpperCase() || '';

  // Auto-generate job number
  useEffect(() => {
    if (!orderTypeShort) { setGeneratedNumber(''); return; }
    const year = new Date().getFullYear();
    const prefix = `${orderTypeShort}-${year}-`;
    const existing = jobs.map((j) => j.job_number).filter((n) => n.startsWith(prefix))
      .map((n) => { const num = parseInt(n.replace(prefix, ''), 10); return isNaN(num) ? 0 : num; });
    const next = (existing.length > 0 ? Math.max(...existing) : 0) + 1;
    setGeneratedNumber(`${prefix}${String(next).padStart(3, '0')}`);
  }, [orderTypeShort, jobs]);

  const clientName = selectedClient?.contact
    ? `${selectedClient.contact.last_name}`
    : selectedClient?.company_name || '';
  const generatedTitle = orderTypeShort && clientName ? `${clientName}_${orderTypeShort}` : '';

  const filteredClients = clients.filter((c) => {
    const s = clientSearch.toLowerCase();
    const name = `${c.contact?.first_name || ''} ${c.contact?.last_name || ''} ${c.company_name || ''}`.toLowerCase();
    return name.includes(s);
  });

  const handleCreateNewClient = async () => {
    if (!newClient.first_name.trim() || !newClient.last_name.trim()) {
      toast.error('Vor- und Nachname sind Pflichtfelder.'); return;
    }
    try {
      const created = await createClient.mutateAsync(newClient);
      setSelectedClient({ ...created, contact: (created as any).contacts || undefined } as Client);
      setShowNewClient(false);
      setStep(2);
    } catch { toast.error('Fehler beim Erstellen.'); }
  };

  const handleCreateJob = async () => {
    if (!orderTypeId) { toast.error('Bitte Auftragsart wählen.'); return; }

    let propertyId = selectedProperty?.id;

    // Create property if new
    if (!propertyId && showNewProp) {
      const street = useBilling ? (selectedClient?.billing_street || '') : newPropStreet;
      const city = useBilling ? (selectedClient?.billing_city || '') : newPropCity;
      const plz = useBilling ? (selectedClient?.billing_postal_code || '') : newPropPlz;
      if (!street.trim() || !city.trim()) { toast.error('Straße und Ort sind Pflichtfelder.'); return; }
      const { data, error } = await (await import('@/integrations/supabase/client')).supabase
        .from('properties')
        .insert({
          client_id: selectedClient!.id,
          name: `${street}, ${plz} ${city}`,
          street_address: street,
          city,
          postal_code: plz,
        })
        .select().single();
      if (error) { toast.error('Fehler beim Erstellen der Immobilie.'); return; }
      propertyId = data.id;
    }

    try {
      const created = await createJob.mutateAsync({
        title: generatedTitle,
        job_number: generatedNumber,
        description: description.trim(),
        client_id: selectedClient!.id,
        property_id: propertyId || null,
        order_type_id: orderTypeId,
        contact_person_id: selectedClient!.contact_id || null,
        planner_id: plannerId || null,
      } as any);
      // Create default appointments
      if (created?.id) {
        await createDefaultAppointments(created.id, orderTypeId);
      }
      toast.success('Auftrag erstellt.');
      onOpenChange(false);
    } catch { toast.error('Fehler beim Erstellen.'); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step > 1 && !preselectedClient && (
              <Button variant="ghost" size="sm" className="mr-2" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            Neuer Auftrag – Schritt {step}/3
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-3">
            {!showNewClient ? (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Kunde suchen…" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} className="pl-9" />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {filteredClients.map((c) => (
                    <Card key={c.id} className="cursor-pointer hover:border-primary/50" onClick={() => { setSelectedClient(c); setStep(2); }}>
                      <CardContent className="p-3">
                        <p className="text-sm font-medium">{c.contact?.first_name} {c.contact?.last_name}</p>
                        {c.company_name && <p className="text-xs text-muted-foreground">{c.company_name}</p>}
                        {c.billing_city && <p className="text-xs text-muted-foreground">{c.billing_street}, {c.billing_postal_code} {c.billing_city}</p>}
                      </CardContent>
                    </Card>
                  ))}
                  {filteredClients.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Keine Kunden gefunden.</p>}
                </div>
                <Button variant="outline" className="w-full gap-2" onClick={() => setShowNewClient(true)}>
                  <Plus className="h-4 w-4" /> Neuen Kunden anlegen
                </Button>
              </>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Vorname *</Label><Input value={newClient.first_name} onChange={(e) => setNewClient({ ...newClient, first_name: e.target.value })} /></div>
                  <div><Label>Nachname *</Label><Input value={newClient.last_name} onChange={(e) => setNewClient({ ...newClient, last_name: e.target.value })} /></div>
                </div>
                <div><Label>Firma</Label><Input value={newClient.company_name} onChange={(e) => setNewClient({ ...newClient, company_name: e.target.value })} /></div>
                <div><Label>Straße</Label><Input value={newClient.billing_street} onChange={(e) => setNewClient({ ...newClient, billing_street: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>PLZ</Label><Input value={newClient.billing_postal_code} onChange={(e) => setNewClient({ ...newClient, billing_postal_code: e.target.value })} /></div>
                  <div><Label>Ort</Label><Input value={newClient.billing_city} onChange={(e) => setNewClient({ ...newClient, billing_city: e.target.value })} /></div>
                </div>
                <div><Label>E-Mail</Label><Input value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} /></div>
                <div><Label>Telefon</Label><Input value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} /></div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowNewClient(false)} className="flex-1">Abbrechen</Button>
                  <Button onClick={handleCreateNewClient} disabled={createClient.isPending} className="flex-1">
                    {createClient.isPending ? 'Erstelle…' : 'Anlegen & weiter'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Kunde: <span className="font-medium text-foreground">{selectedClient?.contact?.first_name} {selectedClient?.contact?.last_name}</span>
            </p>
            {properties.length > 0 && !showNewProp && (
              <>
                <Label>Bestehende Immobilie wählen</Label>
                <div className="max-h-36 overflow-y-auto space-y-1">
                  {properties.map((p) => (
                    <Card key={p.id} className="cursor-pointer hover:border-primary/50" onClick={() => { setSelectedProperty(p); setStep(3); }}>
                      <CardContent className="p-3">
                        <p className="text-sm">{p.street_address}, {p.postal_code} {p.city}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="text-center text-xs text-muted-foreground">oder</div>
              </>
            )}
            {!showNewProp ? (
              <Button variant="outline" className="w-full gap-2" onClick={() => setShowNewProp(true)}>
                <Plus className="h-4 w-4" /> Neue Immobilie anlegen
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox id="wizardBilling" checked={useBilling} onCheckedChange={(c) => {
                    setUseBilling(!!c);
                    if (c) {
                      setNewPropStreet(selectedClient?.billing_street || '');
                      setNewPropPlz(selectedClient?.billing_postal_code || '');
                      setNewPropCity(selectedClient?.billing_city || '');
                    } else { setNewPropStreet(''); setNewPropPlz(''); setNewPropCity(''); }
                  }} />
                  <Label htmlFor="wizardBilling">Rechnungsadresse = Einsatzort</Label>
                </div>
                <div><Label>Straße *</Label><Input value={useBilling ? (selectedClient?.billing_street || '') : newPropStreet} onChange={(e) => setNewPropStreet(e.target.value)} disabled={useBilling} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>PLZ</Label><Input value={useBilling ? (selectedClient?.billing_postal_code || '') : newPropPlz} onChange={(e) => setNewPropPlz(e.target.value)} disabled={useBilling} /></div>
                  <div><Label>Ort *</Label><Input value={useBilling ? (selectedClient?.billing_city || '') : newPropCity} onChange={(e) => setNewPropCity(e.target.value)} disabled={useBilling} /></div>
                </div>
                <Button onClick={() => setStep(3)} className="w-full">Weiter</Button>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Kunde: <span className="font-medium text-foreground">{selectedClient?.contact?.first_name} {selectedClient?.contact?.last_name}</span>
            </p>
            <div>
              <Label>Auftragsart</Label>
              <Select value={orderTypeId} onValueChange={setOrderTypeId}>
                <SelectTrigger><SelectValue placeholder="Art wählen…" /></SelectTrigger>
                <SelectContent>
                  {orderTypes.filter(ot => ot.is_active).map((ot) => (
                    <SelectItem key={ot.id} value={ot.id}>{ot.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {generatedNumber && (
              <div><Label>Auftragsnummer</Label><Input value={generatedNumber} readOnly className="bg-muted" /></div>
            )}
            {generatedTitle && (
              <div><Label>Auftragstitel</Label><Input value={generatedTitle} readOnly className="bg-muted" /></div>
            )}
            <div><Label>Beschreibung</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" /></div>
            <div>
              <Label>Auftragsplaner</Label>
              <Select value={plannerId} onValueChange={setPlannerId}>
                <SelectTrigger><SelectValue placeholder="Planer wählen (optional)…" /></SelectTrigger>
                <SelectContent>
                  {(allProfiles || []).map((p: any) => (
                    <SelectItem key={p.user_id} value={p.user_id}>{p.name || p.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreateJob} disabled={createJob.isPending} className="w-full">
              {createJob.isPending ? 'Erstelle…' : 'Auftrag erstellen'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateJobWizard;
