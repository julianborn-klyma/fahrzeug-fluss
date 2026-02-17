
# Checklisten im Monteur-Auftrag verbessern

## Problem
Die Checklisten-Ansicht in der Monteur-App zeigt aktuell nur einfache Checkboxen. Die bereits existierende, umfangreiche `ChecklistDetailDialog`-Komponente (mit Foto-Upload, Textfeldern, aufklappbaren Gruppen, Fortschrittsanzeige) wird nicht genutzt. Ausserdem fehlt eine Funktion zum Malen/Annotieren auf Fotos.

## Loesung

### 1. Checklisten-Tab mit ChecklistDetailDialog verbinden
Die flache Checkbox-Liste im `MonteurJobDetail.tsx` wird durch eine Karten-Ansicht ersetzt, die pro Checkliste den Fortschritt anzeigt. Beim Antippen oeffnet sich der bestehende `ChecklistDetailDialog`, der bereits Gruppen, Foto-Upload, Textfelder und Fortschrittsbalken unterstuetzt.

### 2. Foto-Annotation (auf Bildern malen)
Eine neue Komponente `PhotoAnnotationDialog` wird erstellt, die ein Canvas ueber das Foto legt. Der Monteur kann mit dem Finger/Maus Linien, Kreise oder Pfeile zeichnen (Freihand-Zeichnung). Das annotierte Bild wird als neues Bild gespeichert und ersetzt/ergaenzt das Original.

## Technische Details

### Datei-Aenderungen

**`src/pages/MonteurJobDetail.tsx`**
- Import von `ChecklistDetailDialog` hinzufuegen
- State fuer `selectedChecklistId` hinzufuegen
- Im Checklisten-Tab: Statt flacher Checkbox-Liste eine Karten-Uebersicht mit Fortschrittsbalken pro Checkliste
- Klick auf Checkliste oeffnet `ChecklistDetailDialog`

**`src/components/montage/PhotoAnnotationDialog.tsx`** (neue Datei)
- Fullscreen-Dialog mit HTML5 Canvas ueber dem Foto
- Freihand-Zeichenmodus mit konfigurierbarer Farbe (rot, blau, schwarz, weiss) und Strichstaerke
- "Rueckgaengig"-Funktion
- "Speichern"-Button: Canvas wird als Bild exportiert und in den Storage hochgeladen
- Ergebnis-URL wird per Callback zurueckgegeben

**`src/components/montage/ChecklistDetailDialog.tsx`**
- Integration der `PhotoAnnotationDialog`: Neuer Button "Bearbeiten" (Stift-Icon) auf jedem Foto im Grid
- Klick oeffnet das Foto im Annotations-Editor
- Nach dem Speichern wird die alte URL durch die annotierte ersetzt
- Kamera-Capture hinzufuegen: `capture="environment"` am File-Input fuer direkte Kamera-Nutzung auf dem Handy

### Ablauf Foto-Annotation

```text
Foto im Grid antippen
  --> PhotoAnnotationDialog oeffnet sich
  --> Canvas-Overlay ueber dem Bild
  --> Farbe/Strichstaerke waehlen
  --> Freihand zeichnen (Touch + Maus)
  --> "Rueckgaengig" oder "Speichern"
  --> Annotiertes Bild wird hochgeladen
  --> URL im Checklist-Step aktualisiert
```

### Keine Datenbank-Aenderungen noetig
Die bestehenden Felder `photo_urls` und `photo_url` in `job_checklist_steps` reichen aus. Annotierte Bilder werden als neue Dateien im `job-documents`-Bucket gespeichert.
