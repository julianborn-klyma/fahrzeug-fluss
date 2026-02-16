
# Auftragsarten, Terminarten, Felder und Dokumente

## Uebersicht

Dieses Feature erweitert das System um ein vollstaendiges Baukastensystem fuer Auftragsarten (Order Types) und deren zugehoerige Terminarten (Appointment Types). Jede Terminart bekommt konfigurierbare Felder (Text, Dropdown, Datum, etc.) und erforderliche Dokumente. Beim Erstellen eines Auftrags werden die Standard-Terminarten automatisch angelegt. In der Auftragsdetailansicht wird sichtbar, welche Dokumente noch fehlen.

## Datenbank-Aenderungen

### Bestehende Tabellen erweitern

**appointment_types** -- Neue Spalten:
- `description` (text, default '') -- Beschreibungstext
- `is_active` (boolean, default true) -- Aktiv/Inaktiv-Schalter

**order_types** -- Aufraumen: Bestehende Eintraege aktualisieren (WP, PV hinzufuegen, bzw. umbenennen). Neue hinzufuegen: "Photovoltaik", "Installation WP", "Installation PV".

### Neue Tabellen

**appointment_type_fields** -- Konfigurierbare Felder pro Terminart:
- `id` (uuid, PK)
- `appointment_type_id` (uuid, FK -> appointment_types)
- `label` (text) -- Feldbezeichnung
- `field_type` (text) -- 'text', 'textarea', 'dropdown', 'boolean', 'date', 'photo'
- `placeholder` (text, default '')
- `options` (jsonb, default '[]') -- Dropdown-Optionen
- `is_required` (boolean, default false)
- `width` (text, default 'half') -- 'half' oder 'full'
- `display_order` (integer, default 0)
- `created_at` (timestamptz)

**appointment_type_documents** -- Welche Dokumenttypen eine Terminart erfordert:
- `id` (uuid, PK)
- `appointment_type_id` (uuid, FK -> appointment_types)
- `document_type_id` (uuid, FK -> document_types)
- `created_at` (timestamptz)

**job_appointments** -- Konkrete Termine eines Auftrags (basierend auf Terminart):
- `id` (uuid, PK)
- `job_id` (uuid, FK -> jobs)
- `appointment_type_id` (uuid, FK -> appointment_types)
- `start_date` (timestamptz, nullable)
- `end_date` (timestamptz, nullable)
- `status` (text, default 'offen') -- offen, geplant, abgeschlossen
- `notes` (text, default '')
- `field_values` (jsonb, default '{}') -- Gespeicherte Feldwerte
- `created_at` (timestamptz)

Alle neuen Tabellen erhalten RLS-Policies analog zu den bestehenden (Admin/Office/Teamleiter: ALL, Monteur: SELECT).

### Seed-Daten

Einfuegen der Standard-Auftragsarten und zugehoerige Terminarten:

- **Waermepumpe (WP)**: SHK Montage (SHK, Intern), Elektro-WP (Elektro, Intern), Fundament (Fundament, Extern)
- **Photovoltaik (PV)**: Dachmontage (Dach, Extern), Elektroarbeiten Keller (Elektro, Intern)
- **Installation WP**: Gleiche Terminarten wie WP
- **Installation PV**: Gleiche Terminarten wie PV

Standard-Dokumenttypen einfuegen: Installationsanleitung, Hydraulischer Abgleich, Hydraulikplan, Anschlussplan, Fundamentplan, Bilder, Sonstiges, Reglereinstellungen, Fotos.

## Frontend-Aenderungen

### 1. Settings: Neuer Tab "Projektarten" (AdminSettings.tsx)

Neuer Tab in den Einstellungen mit einer Seite analog zum Screenshot:

**SettingsOrderTypes.tsx** -- Neue Komponente:
- Liste aller Auftragsarten als aufklappbare Karten (Accordion)
- Jede Karte zeigt: Name, System-Badge, Anzahl Terminarten
- "Neue Projektart"-Button zum Anlegen
- "Bearbeiten"-Button pro Auftragsart
- Unter jeder Auftragsart: Liste der Terminarten mit Trade-Badge, Intern/Extern-Badge, Edit/Delete-Buttons
- "Terminart hinzufuegen"-Button

**EditAppointmentTypeDialog.tsx** -- Dialog mit 3 Tabs:
- **Einstellungen**: Name, Beschreibung, Gewerk (Trade-Dropdown), Intern/Extern-Toggle, Aktiv-Toggle
- **Felder**: Liste konfigurierbarer Felder mit Drag-and-Drop-Reihenfolge. "Neues Feld"-Button oeffnet Unter-Dialog mit: Label, Feldtyp (Text/Textarea/Dropdown/Ja-Nein/Datum/Foto-Upload), Platzhaltertext, Pflichtfeld-Toggle, Breite (Halbe/Volle Breite). Bei Dropdown: Optionen konfigurieren.
- **Dokumente**: Dropdown zum Auswaehlen eines Dokumenttyps + Hinzufuegen-Button. Liste der zugewiesenen Dokumenttypen mit Loeschen-Moeglichkeit.

### 2. Auftrags-Erstellung: Standard-Termine anlegen (CreateJobWizard.tsx)

Wenn ein Auftrag erstellt wird:
- Die Auftragsart (WP/PV/INST-WP/INST-PV) wird mit `order_type_id` verknuepft
- Alle aktiven Terminarten dieser Auftragsart werden automatisch als `job_appointments` angelegt (Status: "offen", ohne Datum)

### 3. Auftragsdetail: Termine und Dokument-Tracking (AdminJobDetail.tsx)

**Termine-Tab erweitert:**
- Zeigt `job_appointments` statt der bisherigen `trade_appointments`
- Jeder Termin zeigt: Terminart-Name, Trade-Badge, Status, Datum (falls geplant)
- "Termin hinzufuegen"-Button: Oeffnet Dialog mit Terminart-Auswahl (alle verfuegbaren Terminarten)
- Klick auf Termin zeigt die konfigurierten Felder zum Ausfuellen

**Dokumente-Tab erweitert:**
- Zeigt pro Terminart welche Dokumente erforderlich sind (aus `appointment_type_documents`)
- Gruen markiert: Dokument bereits hochgeladen
- Rot/Grau markiert: Dokument fehlt noch
- Upload-Moeglichkeit direkt in der Uebersicht

### 4. Neue Hooks

- `useOrderTypes.ts` -- CRUD fuer order_types mit appointment_types
- `useAppointmentTypes.ts` -- CRUD fuer appointment_types inkl. fields und documents
- `useJobAppointments.ts` -- CRUD fuer job_appointments

## Technische Details

### Neue Dateien
- `src/components/settings/SettingsOrderTypes.tsx`
- `src/components/settings/EditAppointmentTypeDialog.tsx`
- `src/components/settings/EditOrderTypeDialog.tsx`
- `src/hooks/useOrderTypes.ts`
- `src/hooks/useAppointmentTypes.ts`
- `src/hooks/useJobAppointments.ts`

### Geaenderte Dateien
- `src/pages/AdminSettings.tsx` -- Neuer Tab "Projektarten"
- `src/pages/AdminJobDetail.tsx` -- Erweiterte Termine- und Dokumenten-Ansicht
- `src/components/montage/CreateJobWizard.tsx` -- order_type_id setzen + auto-Termine
- `src/types/montage.ts` -- Neue Interfaces fuer Fields, JobAppointment, etc.

### Datenfluss bei Auftragserstellung

```text
Wizard Schritt 3: Auftragsart waehlen (WP/PV/...)
    |
    v
order_type_id wird am Job gespeichert
    |
    v
Alle aktiven appointment_types dieser order_type_id werden geladen
    |
    v
Fuer jeden appointment_type wird ein job_appointment erstellt
    (status: 'offen', keine Daten, leere field_values)
    |
    v
Auftrag oeffnen -> Termine-Tab zeigt alle job_appointments
    +-- Jeder Termin kann geplant und Felder ausgefuellt werden
    +-- Dokumente-Tab zeigt Soll/Ist der erforderlichen Dokumente
```
