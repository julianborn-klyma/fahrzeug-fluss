
# Fahrzeuginhaber und Werkzeug-Berechtigung

## Zusammenfassung
Jedes Fahrzeug bekommt einen **Fahrzeuginhaber** (einen bestimmten Monteur). Zusaetzlich bleiben die bestehenden Zuweisungen fuer die allgemeine Materialverwaltung bestehen. Materialien der Kategorie **Werkzeug** (Unterkategorien: Fahrzeugwerkzeug, Handwerkzeug) koennen in der Monteur-App nur vom Fahrzeuginhaber bearbeitet werden.

## Aenderungen im Detail

### 1. Datenbank: Neue Spalte `owner_id` auf `vehicles`
- Neue nullable Spalte `owner_id` (uuid) auf der Tabelle `vehicles` hinzufuegen
- Diese Spalte speichert die `user_id` des Fahrzeuginhabers

### 2. Admin-Einstellungen: Fahrzeug-Dialog erweitern (SettingsVehicles.tsx)
- Im Fahrzeug-Bearbeitungsdialog ein neues Dropdown **"Fahrzeuginhaber"** hinzufuegen
- Auswahl aus allen Benutzern (Profilen)
- In der Fahrzeug-Tabelle den Inhaber als eigene Spalte anzeigen (z.B. mit einem Stern oder Label hervorgehoben)

### 3. TypeScript-Typen anpassen (database.ts)
- `Vehicle`-Interface um `owner_id?: string` erweitern

### 4. DataContext anpassen (DataContext.tsx)
- `owner_id` beim Laden, Erstellen und Aktualisieren von Fahrzeugen beruecksichtigen

### 5. Monteur-App: Werkzeug-Bearbeitung einschraenken (MonteurInventoryCheck.tsx)
- Pruefen ob der aktuelle Benutzer der Fahrzeuginhaber ist (`vehicle.owner_id === user.id`)
- Wenn die ausgewaehlte Kategorie "Werkzeug" ist (genauer: Materialien mit Kategorie die "werkzeug" enthaelt, also Fahrzeugwerkzeug/Handwerkzeug als Unterkategorien):
  - **Fahrzeuginhaber**: StepperInput bleibt editierbar
  - **Andere Monteure**: StepperInput wird deaktiviert, mit einem Hinweistext "Nur der Fahrzeuginhaber kann Werkzeug verwalten"

### 6. Fahrzeugauswahl-Seite: Inhaber kennzeichnen (MonteurVehicleSelect.tsx)
- Optional: Bei Fahrzeugen, deren Inhaber der aktuelle Benutzer ist, ein kleines Label "Inhaber" anzeigen

---

## Technische Details

### Datenbank-Migration (SQL)
```sql
ALTER TABLE public.vehicles
ADD COLUMN owner_id uuid DEFAULT NULL;
```

### Betroffene Dateien
| Datei | Aenderung |
|---|---|
| `src/types/database.ts` | `owner_id?: string` zu Vehicle hinzufuegen |
| `src/context/DataContext.tsx` | owner_id in fetch/add/update Logik einbauen |
| `src/components/settings/SettingsVehicles.tsx` | Inhaber-Dropdown im Dialog, Inhaber-Spalte in Tabelle |
| `src/pages/MonteurInventoryCheck.tsx` | Werkzeug-Kategorie fuer Nicht-Inhaber sperren |
| `src/pages/MonteurVehicleSelect.tsx` | Inhaber-Badge anzeigen |

### Werkzeug-Kategorie Logik
Die bestehende Kategorie "Werkzeug" in `material_catalog` wird weiterverwendet. In der Monteur-App wird geprueft:
- Ist die Kategorie des Materials === "Werkzeug"? -> Nur Inhaber darf Menge aendern
- Alle anderen Kategorien -> Jeder zugewiesene Monteur darf Menge aendern
