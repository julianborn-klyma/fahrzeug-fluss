
# Checklisten-Verwaltung und Gewerk-Bereinigung

## Uebersicht

Zwei Aenderungen: (1) Gewerk/Trade wird aus den Terminarten entfernt (UI und DB-Bezug), da es redundant ist. (2) Der "Checklisten"-Unterreiter in den Montage-Einstellungen wird mit einer vollstaendigen Checklisten-Verwaltung befuellt. Checklisten sind an Terminarten gebunden und haben Schritte mit Gruppierungen (aufklappbare Ebenen).

## 1. Gewerk aus Terminarten entfernen

- In `EditAppointmentTypeDialog.tsx`: Gewerk-Dropdown aus dem Einstellungen-Tab entfernen
- In `SettingsOrderTypes.tsx`: Trade-Badge bei Terminarten entfernen, Trade-Feld beim Hinzufuegen einer Terminart entfernen
- In `handleSaveSettings`: `trade` nicht mehr mitspeichern

## 2. Datenbank-Erweiterungen fuer Checklisten

Bestehende Tabellen erweitern:

**checklist_templates** -- Neue Spalten:
- `description` (text, default '') -- Beschreibungstext
- `appointment_type_id` (uuid, nullable) -- Verknuepfung zur Terminart (statt trade)

**checklist_template_steps** -- Neue Spalten:
- `description` (text, default '') -- Beschreibung/Anweisung fuer den Schritt
- `parent_step_id` (uuid, nullable, self-ref FK) -- Fuer Gruppierungen/verschachtelte Schritte
- `options` (jsonb, default '[]') -- Antwortoptionen (z.B. Ja, Nein, Teilweise)

## 3. Checklisten-Verwaltung UI

### Checklisten-Liste (im "Checklisten"-Subtab von SettingsOrderTypes)

- Filterung nach Terminart (Tabs oder Dropdown mit allen verfuegbaren Terminarten)
- Liste der Checklisten-Vorlagen als Karten mit Name, Beschreibung, Standard-Badge
- "Neue Checkliste"-Button
- Edit/Delete pro Checkliste

### Checkliste bearbeiten/erstellen Dialog

Grosser Dialog mit:
- **Name** (Pflichtfeld)
- **Beschreibung** (optional, Textarea)
- **Terminart** (Dropdown: alle verfuegbaren Terminarten aus allen Projektarten)
- **Als Standard-Checkliste markieren** (Toggle -- wird automatisch hinzugefuegt wenn Terminart im Auftrag ist)

**Schritte-Bereich:**
- Liste aller Schritte mit Drag-Handle, Typ-Icon, Titel, Beschreibung, Delete-Button
- Gruppierte Schritte werden eingerueckt dargestellt
- "Schritt hinzufuegen"-Button oeffnet Inline-Formular:
  - Titel (Pflicht)
  - Beschreibung (optional)
  - Typ: Checkbox, Freitext, Foto
  - Antwortoptionen (optional, kommagetrennt -- z.B. "Ja, Nein, Teilweise")
  - Uebergeordneter Schritt (Dropdown: "Kein uebergeordneter Schritt" oder bestehende Schritte als Gruppen)
- "Gruppe hinzufuegen"-Button erstellt einen Schritt vom Typ "group" der als aufklappbarer Container dient

## Technische Details

### Datenbank-Migration
- ALTER TABLE `checklist_templates` ADD `description` text DEFAULT '', ADD `appointment_type_id` uuid REFERENCES appointment_types(id) ON DELETE SET NULL
- ALTER TABLE `checklist_template_steps` ADD `description` text DEFAULT '', ADD `parent_step_id` uuid REFERENCES checklist_template_steps(id) ON DELETE CASCADE, ADD `options` jsonb DEFAULT '[]'

### Neue Dateien
- `src/components/settings/SettingsChecklists.tsx` -- Checklisten-Liste und -Verwaltung
- `src/components/settings/EditChecklistDialog.tsx` -- Dialog zum Bearbeiten/Erstellen einer Checkliste
- `src/hooks/useChecklistTemplates.ts` -- CRUD-Hook fuer checklist_templates und checklist_template_steps

### Geaenderte Dateien
- `src/components/settings/SettingsOrderTypes.tsx` -- Checklisten-Subtab rendert neue Komponente, Trade-Referenzen in Terminarten entfernen
- `src/components/settings/EditAppointmentTypeDialog.tsx` -- Gewerk-Dropdown entfernen
- `src/types/montage.ts` -- ChecklistTemplate/Step-Interfaces erweitern (description, parent_step_id, options, appointment_type_id)

### Schritt-Typen
- `checkbox` -- Einfache Abhakmeldung (mit optionalen Antwortoptionen)
- `text` -- Freitextfeld
- `photo` -- Foto-Upload
- `group` -- Gruppierung (Container fuer untergeordnete Schritte, aufklappbar)
