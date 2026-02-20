
# Aufgaben (Tasks) einfuehren

## Uebersicht
Ein neues Aufgabensystem wird eingefuehrt, das es Admins, Teamleitern und Office-Mitarbeitern ermoeglicht, Aufgaben zu erstellen und zuzuweisen. Aufgaben koennen an Objekte (Termin, Auftrag, Immobilie, Kunde) gebunden sein und werden sowohl auf den jeweiligen Detailseiten als auch in einer eigenen globalen Aufgaben-Uebersicht angezeigt.

## 1. Datenbank

**Neue Tabelle `tasks`:**

| Spalte | Typ | Default | Beschreibung |
|--------|-----|---------|-------------|
| id | uuid | gen_random_uuid() | Primaerschluessel |
| title | text | '' | Titel der Aufgabe |
| description | text | '' | Beschreibungstext |
| due_date | date | null | Faelligkeitsdatum |
| status | text | 'open' | 'open' oder 'closed' |
| assigned_to | uuid | not null | Profil-ID des Zugewiesenen |
| created_by | uuid | auth.uid() | Ersteller |
| entity_type | text | null | 'appointment', 'job', 'property', 'client' |
| entity_id | uuid | null | ID des zugeordneten Objekts |
| closed_at | timestamptz | null | Zeitpunkt des Abschliessens |
| created_at | timestamptz | now() | Erstellzeitpunkt |

**RLS-Policies:** Gleiche Struktur wie bei anderen Tabellen -- Admin/Office/Teamleiter ALL, Monteur SELECT (eigene).

## 2. Neue Seite: Aufgaben-Tab in der Navigation

- Neue Seite `src/pages/AdminTasks.tsx` -- zeigt alle Aufgaben des eingeloggten Users
- Filterbar nach Status (Offen/Geschlossen), sortiert nach Faelligkeit
- Jede Aufgabe zeigt: Titel, Faelligkeit, Status, zugeordnetes Objekt (mit Link)
- Aufgaben koennen hier erstellt, bearbeitet und geschlossen werden

**Navigation:** Neuer Button "Aufgaben" in `AdminLayout.tsx` (zwischen Kalkulation und Fahrzeuglager), mit Icon `ClipboardList`. Route: `/admin/tasks`.

## 3. Aufgaben-Komponente fuer Detailseiten

Neue wiederverwendbare Komponente `src/components/tasks/TaskTimeline.tsx`:
- Empfaengt `entityType` und `entityId` als Props
- Zeigt offene Aufgaben oben, abgeschlossene standardmaessig eingeklappt
- Jede Aufgabe zeigt Titel, Zugewiesene Person, Faelligkeitsdatum, Status
- Button zum Erstellen neuer Aufgaben
- Button zum Abschliessen/Wiedereroeffnen

Neue Komponente `src/components/tasks/CreateTaskDialog.tsx`:
- Dialog zum Erstellen einer Aufgabe
- Felder: Titel, Beschreibung, Faelligkeitsdatum, zugewiesene Person (Dropdown mit Profilen)
- entity_type und entity_id werden automatisch aus dem Kontext gesetzt

## 4. Integration in Detailseiten

Die `TaskTimeline`-Komponente wird auf folgenden Seiten eingebaut:

- **AdminJobDetail.tsx** -- entity_type='job', unter den bestehenden Tabs oder als eigener Abschnitt
- **AdminMontageKundenDetail.tsx** -- entity_type='client'
- **AdminMontageImmobilienDetail.tsx** -- entity_type='property'
- **AppointmentCard.tsx** -- entity_type='appointment', im Detail-Modal (optional als 4. Tab oder unterhalb)

## 5. Hook

Neuer Hook `src/hooks/useTasks.ts`:
- `useTasks(entityType?, entityId?)` -- laedt Aufgaben, optional gefiltert nach Objekt
- `useMyTasks()` -- laedt alle Aufgaben des eingeloggten Users
- CRUD-Funktionen: createTask, updateTask, toggleTaskStatus

## 6. Dateien-Uebersicht

**Neue Dateien:**
- `src/hooks/useTasks.ts`
- `src/components/tasks/TaskTimeline.tsx`
- `src/components/tasks/CreateTaskDialog.tsx`
- `src/pages/AdminTasks.tsx`

**Geaenderte Dateien:**
- `src/components/AdminLayout.tsx` -- Neuer Nav-Button "Aufgaben"
- `src/App.tsx` -- Neue Route `/admin/tasks`
- `src/pages/AdminJobDetail.tsx` -- TaskTimeline einbinden
- `src/pages/AdminMontageKundenDetail.tsx` -- TaskTimeline einbinden
- `src/pages/AdminMontageImmobilienDetail.tsx` -- TaskTimeline einbinden
- `src/components/montage/AppointmentCard.tsx` -- TaskTimeline einbinden

## Technische Details

### Aufgaben-Zeitleiste (TaskTimeline)
- Offene Aufgaben werden chronologisch nach Faelligkeit sortiert (naechste zuerst)
- Ueberfaellige Aufgaben werden rot hervorgehoben
- Abgeschlossene Aufgaben sind in einem Collapsible-Bereich versteckt
- Klick auf eine Aufgabe oeffnet inline-Details mit Beschreibung

### Globale Aufgabenseite
- Tabelle/Listenansicht aller eigenen Aufgaben
- Spalten: Titel, Objekt (mit Typ-Badge und Link), Faelligkeit, Status
- Filter: Status (Offen/Geschlossen/Alle)
- Sortierung nach Faelligkeit (Standard: aufsteigend)
