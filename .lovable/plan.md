
# Team-Verwaltung hinzufuegen

## Uebersicht
Es wird eine neue "Teams"-Tabelle in der Datenbank erstellt und die Benutzer-Sektion in zwei Untermenüs aufgeteilt: **Nutzerverwaltung** (bestehend) und **Teamverwaltung** (neu). Jeder Benutzer kann einem Team zugeordnet werden. Wird ein Team geloescht, verlieren die zugehoerigen Benutzer lediglich ihre Teamzuordnung.

## Aenderungen

### 1. Datenbank
- Neue Tabelle `teams` mit Spalten: `id` (uuid), `name` (text), `created_at` (timestamp)
- Neue Spalte `team_id` (uuid, nullable) in der `profiles`-Tabelle mit Fremdschluessel auf `teams.id` und `ON DELETE SET NULL`
- RLS-Policies fuer `teams`: Admin, Teamleiter und Office koennen verwalten; Monteure koennen lesen

### 2. Benutzer-Tab aufteilen (AdminSettings.tsx)
- Der bestehende Tab "Benutzer" bekommt zwei Unter-Tabs (wie beim Fahrzeuglager-Tab bereits umgesetzt):
  - **Nutzerverwaltung** -- zeigt die bestehende Benutzertabelle
  - **Teamverwaltung** -- neue Komponente zum Anlegen, Umbenennen und Loeschen von Teams

### 3. Nutzerverwaltung erweitern (SettingsUsers.tsx)
- Neue Spalte "Team" in der Benutzertabelle
- Team-Zuordnung wird aus `profiles.team_id` gelesen und der Teamname angezeigt
- Im Benutzer-Bearbeitungsdialog wird ein Dropdown zur Teamauswahl hinzugefuegt
- Sortierung nach Team wird unterstuetzt

### 4. Neue Komponente: SettingsTeams.tsx
- Tabelle aller Teams mit Name
- Button "Team erstellen" oeffnet Dialog mit Namensfeld
- Inline-Bearbeitung / Umbenennen ueber Stift-Icon
- Loeschen-Button mit Bestaetigungsdialog: "Sind Sie sicher? Benutzer in diesem Team verlieren ihre Zuordnung."

## Technische Details

**Migration SQL:**
```sql
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage teams" ON public.teams FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Teamleiter can manage teams" ON public.teams FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'teamleiter'::app_role));
CREATE POLICY "Office can manage teams" ON public.teams FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'office'::app_role));
CREATE POLICY "Monteurs can view teams" ON public.teams FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'monteur'::app_role));

-- Team-Spalte in profiles
ALTER TABLE public.profiles ADD COLUMN team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL;
```

**Neue Datei:** `src/components/settings/SettingsTeams.tsx`
- CRUD-Operationen direkt ueber Supabase-Client
- Anlegen, Umbenennen, Loeschen von Teams

**Geaenderte Dateien:**
- `src/pages/AdminSettings.tsx` -- Unter-Tabs fuer Benutzer-Bereich
- `src/components/settings/SettingsUsers.tsx` -- Team-Spalte und Team-Dropdown im Bearbeitungsdialog
