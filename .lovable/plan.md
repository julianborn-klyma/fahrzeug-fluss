
# Checklisten nativ im Tab anzeigen (wie in den Screenshots)

## Aktueller Zustand
Der Checklisten-Tab zeigt Karten mit Fortschrittsbalken. Ein Klick oeffnet einen Dialog (`ChecklistDetailDialog`). Der Nutzer moechte stattdessen die Schritte direkt im Tab sehen -- wie in den Screenshots: eine flache Liste mit Status-Icons und Klick auf einen Schritt oeffnet die Detail-Ansicht (Kommentar + Foto).

## Geplante Aenderungen

### 1. Checklisten-Tab umbauen (`MonteurJobDetail.tsx`)
- Gruppen werden als aufklappbare Sektionen (`Collapsible`) direkt im Tab angezeigt
- Jeder Schritt wird als Zeile dargestellt mit:
  - **Kein Icon**: Schritt offen (nicht erledigt, nicht verpflichtend)
  - **Gruener Haken**: Schritt erledigt (`is_completed = true`)
  - **Rotes Ausrufezeichen**: Verpflichtend aber noch offen (`is_required = true` und `is_completed = false`)
- Foto-Thumbnail (kleines Bild-Icon oder Vorschau) links, wenn der Schritt vom Typ `photo` ist
- Untertitel "Zu erledigen" / "Erledigt" unter jedem Schritt-Titel
- Klick auf einen Schritt oeffnet eine **Schritt-Detail-Ansicht** (neuer Dialog oder Fullscreen-Sheet)

### 2. Neue Komponente: `ChecklistStepDetailSheet` (in `MonteurJobDetail.tsx` oder eigene Datei)
- Wird als Sheet/Dialog geoeffnet wenn man auf einen Schritt tippt
- Zeigt: Schritt-Titel, Typ-Label ("Aufgabe"), optionales Kommentar-Feld, Foto-Upload-Button (Kamera-Icon unten rechts wie im Screenshot)
- Fortschrittsbalken unten mit "Zurueck" / "Weiter" Navigation zwischen Schritten
- Foto-Upload mit `capture="environment"` fuer Kamera
- Annotation (Malen auf Foto) ueber bestehendes `PhotoAnnotationDialog`

### 3. Bestehende `ChecklistDetailDialog`-Logik wiederverwenden
- Die Upload-, Toggle-, Text- und Annotations-Logik aus `ChecklistDetailDialog` wird in den neuen Flow integriert
- Der bestehende Dialog bleibt fuer die Admin-Ansicht erhalten

## Technische Details

### `MonteurJobDetail.tsx`
- Checklisten-Tab: Statt der Karten-Liste werden Gruppen mit `Collapsible` angezeigt
- Jeder Schritt ist eine klickbare Zeile mit Status-Icon (Check/AlertCircle/leer)
- State: `selectedStep` fuer die Detail-Ansicht
- Fortschrittsbalken oben pro Checkliste

### Neue Komponente oder Inline-Sheet fuer Schritt-Details
- Sheet/Dialog mit Schritt-Titel, Kommentar-Textarea, Kamera-Button
- "Zurueck"/"Weiter" Buttons am unteren Rand navigieren durch die Schritte der aktuellen Checkliste
- Gruener Fortschrittsbalken zwischen den Buttons
- Upload-Logik aus `ChecklistDetailDialog` wird hierhin uebernommen (Supabase Storage Upload, signed URLs)

### Keine Datenbank-Aenderungen noetig
Alle benoetigten Felder (`is_completed`, `is_required`, `photo_urls`, `text_value`, `step_type`, `parent_step_id`) existieren bereits in `job_checklist_steps`.
