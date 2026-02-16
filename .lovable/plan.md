
# Klyma OS Modul Integration

## Zusammenfassung
Das komplette Klyma OS (Handwerker-Planungssoftware) wird als neues Modul "Klyma OS" in dieses Projekt integriert. Es umfasst Auftrags-/Projektplanung, Gewerke, Termine, Dokumente und Checklisten -- sowohl fuer Admins als auch fuer Monteure.

## Architektur-Ueberblick

Die Integration folgt dem bestehenden Modul-Pattern (wie "Fahrzeuglager" und "Performance & Bonus"):
- Neuer Modul-Toggle `module_klyma_os_enabled` in `bonus_settings`
- Admin-Navigation bekommt "Montage" als erstes/oberstes Element
- Monteure bekommen einen neuen Bottom-Nav-Tab "Montage" mit Termin- und Auftrags-Ansicht

## Aenderungen

### 1. Datenbank -- Neue Tabellen

Die folgenden Tabellen werden angelegt (abgeleitet vom Klyma OS-Schema):

**Kern-Tabellen:**
- `contacts` -- Ansprechpartner (first_name, last_name, email, phone, notes)
- `clients` -- Auftraggeber (client_type, company_name, contact_id, billing-Felder)
- `properties` -- Immobilien/Objekte (name, street_address, city, postal_code, property_type, old_heating, client_id)
- `client_contacts` -- Zuordnung Kunden zu Kontakten mit Rollen
- `property_contacts` -- Zuordnung Immobilien zu Kontakten

**Auftrags-Tabellen:**
- `order_types` -- Auftragsarten (name, description, is_system, is_active, display_order)
- `appointment_types` -- Terminarten pro Auftragsart (name, trade, is_internal, requires_documents, display_order)
- `jobs` -- Auftraege (job_number, title, job_type, property_id, client_id, order_type_id, status, trades, active_trades, description, estimated_hours, assigned_to)
- `job_trade_details` -- Gewerk-Details pro Auftrag (trade, appointment_start/end, assigned_team_members, technical_info)
- `job_appointment_slots` -- Terminslots pro Auftrag

**Dokumente & Checklisten:**
- `document_types` -- Dokumenttypen (name, category, applicable_trades, is_required)
- `job_documents` -- Hochgeladene Dokumente (job_id, file_name, file_path, document_type_id, trade)
- `checklist_templates` -- Checklisten-Vorlagen (name, trade, is_standard)
- `checklist_template_steps` -- Schritte der Vorlagen (title, step_type, order_index, is_required)
- `job_checklists` -- Instanziierte Checklisten pro Auftrag
- `job_checklist_steps` -- Ausgefuellte Checklist-Schritte (is_completed, text_value, photo_url)

**Termin-Planung:**
- `trade_appointments` -- Gewerk-Termine (job_id, trade, start_date, end_date)
- `appointment_assignments` -- Personenzuordnungen zu Terminen (person_id, person_name, team_id, trade)
- `team_members` -- Teammitglieder mit Adresse und Gewerk (name, team_id, trade, address)

**Modul-Spalte:**
- `bonus_settings.module_klyma_os_enabled` (boolean, default true)

Alle Tabellen erhalten RLS-Policies analog zum bestehenden Muster (Admin/Teamleiter/Office: ALL, Monteur: SELECT + eingeschraenkt INSERT/UPDATE fuer Checklisten).

Ein Storage-Bucket `job-documents` wird fuer Datei-Uploads erstellt.

### 2. Admin-Bereich

**AdminLayout.tsx -- Navigation erweitern:**
- Neuer Button "Montage" (Icon: Briefcase/Hammer) als erstes Element in der Nav-Leiste
- Route: `/admin/montage`
- Bestehende Buttons (Fahrzeuglager, Performance, Einstellungen) bleiben

**Neue Seiten:**
- `/admin/montage` -- **AdminMontage.tsx**: Hauptseite mit Tabs:
  - Projektuebersicht (Tabelle aller Auftraege mit Filter/Suche/Sortierung)
  - Auftragsdetail-Ansicht (Gewerke, Dokumente, Checklisten, Status-Fortschritt)
- `/admin/montage/job/:id` -- **AdminJobDetail.tsx**: Detailseite eines Auftrags

**Neue Komponenten (portiert/angepasst von Klyma OS):**
- `src/components/montage/JobList.tsx` -- Projekt-Tabelle mit Filter
- `src/components/montage/JobDetailView.tsx` -- Auftragsdetail mit Tabs
- `src/components/montage/CreateJobDialog.tsx` -- Neuen Auftrag anlegen
- `src/components/montage/GewerkeSection.tsx` -- Gewerke-Verwaltung
- `src/components/montage/DocumentsSection.tsx` -- Dokumente hochladen/verwalten
- `src/components/montage/ChecklistSection.tsx` -- Checklisten-Verwaltung
- `src/components/montage/AppointmentSection.tsx` -- Terminplanung
- `src/components/montage/StatusProgress.tsx` -- Status-Fortschrittsanzeige

**Settings erweitern:**
- `SettingsModules.tsx`: Neuer Toggle "Klyma OS" mit Briefcase-Icon
- Neuer Settings-Tab "Montage" (wenn Modul aktiv):
  - Auftragsarten verwalten (CRUD fuer `order_types` + `appointment_types`)
  - Dokumenttypen verwalten
  - Checklisten-Vorlagen verwalten
  - Teammitglieder verwalten (Gewerk-Zuordnung, Adressen)

### 3. Monteur-Bereich

**MonteurBottomNav.tsx erweitern:**
- Neuer Tab "Montage" (Icon: Briefcase) -- erscheint wenn `module_klyma_os_enabled`
- Route: `/montage`

**Neue Seiten:**
- `/montage` -- **MonteurMontage.tsx**: Dashboard mit zugewiesenen Auftraegen
  - Anstehende Termine gruppiert nach Woche (diese Woche, naechste Woche, spaeter)
  - Auftraege mit Status-Anzeige und Bereitschaftsindikator
  - Tap auf Auftrag oeffnet Detail

- `/montage/job/:id` -- **MonteurJobDetail.tsx**: Auftragsdetail fuer Monteure
  - Uebersicht: Adresse, Kunde, Gewerk, Termin
  - Dokumente: Einsehen und herunterladen
  - Checklisten: Schritte abhakenm, Texte eingeben, Fotos hochladen
  - Status sehen (kein Aendern)

### 4. Typen und Hooks

**Neue Typen** in `src/types/montage.ts`:
- Alle Interfaces portiert aus Klyma OS (Job, Client, Property, Contact, OrderType, AppointmentType, ChecklistTemplate, etc.)

**Neue Hooks** in `src/hooks/`:
- `useJobs.ts` -- CRUD fuer Auftraege
- `useClients.ts` -- CRUD fuer Kunden
- `useProperties.ts` -- CRUD fuer Immobilien
- `useContacts.ts` -- CRUD fuer Kontakte
- `useOrderTypes.ts` -- CRUD fuer Auftragsarten
- `useDocumentTypes.ts` -- CRUD fuer Dokumenttypen
- `useJobDocuments.ts` -- Dokument-Upload/Download
- `useChecklistTemplates.ts` -- Checklisten-Vorlagen
- `useJobChecklists.ts` -- Checklisten-Instanzen
- `useAssignedJobs.ts` -- Monteur-spezifisch: nur eigene Auftraege
- `useTradeAppointments.ts` -- Terminverwaltung

### 5. Routing (App.tsx)

Neue Routen:
```text
/admin/montage          -> AdminMontage (requiredRole: admin)
/admin/montage/job/:id  -> AdminJobDetail (requiredRole: admin)
/montage                -> MonteurMontage (requiredRole: monteur)
/montage/job/:id        -> MonteurJobDetail (requiredRole: monteur)
```

### 6. Umsetzungsreihenfolge

1. **Datenbank-Migration**: Alle Tabellen, RLS-Policies, Storage-Bucket erstellen + `module_klyma_os_enabled` Spalte
2. **Typen & Hooks**: TypeScript-Typen und Daten-Hooks
3. **Modul-Toggle**: `SettingsModules.tsx` und `BonusSettingsContext.tsx` erweitern
4. **Admin-Navigation**: `AdminLayout.tsx` um "Montage" erweitern
5. **Admin Montage-Seiten**: Projektuebersicht, Auftragsdetail, Settings-Tabs
6. **Monteur Bottom-Nav**: `MonteurBottomNav.tsx` erweitern
7. **Monteur Montage-Seiten**: Dashboard, Auftragsdetail mit Checklisten/Dokumenten

## Technische Details

**Migration SQL** (gekuerzt -- vollstaendig bei Umsetzung):

```text
-- Enum fuer Trades
CREATE TYPE public.trade_type AS ENUM ('SHK','Elektro','Fundament','Dach','GaLa');
CREATE TYPE public.job_status AS ENUM ('erstellt','vorbereitet','verplant','durchgefuehrt','abgerechnet');

-- Kontakte, Kunden, Immobilien, Auftraege, Dokumente, Checklisten, Termine
-- (ca. 15+ Tabellen mit RLS-Policies)

-- Modul-Flag
ALTER TABLE public.bonus_settings ADD COLUMN module_klyma_os_enabled boolean NOT NULL DEFAULT true;

-- Storage Bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('job-documents','job-documents',false);
```

**Dateien die geaendert werden:**
- `src/App.tsx` -- Neue Routen
- `src/components/AdminLayout.tsx` -- Montage-Nav-Button
- `src/components/MonteurBottomNav.tsx` -- Montage-Tab
- `src/components/settings/SettingsModules.tsx` -- Klyma OS Toggle
- `src/context/BonusSettingsContext.tsx` -- Neues Feld
- `src/pages/AdminSettings.tsx` -- Montage-Settings-Tab

**Neue Dateien (ca. 25+):**
- Typen, Hooks, Seiten, Komponenten wie oben beschrieben
