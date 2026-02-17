
# Status-Umstrukturierung: Termin- und Auftragsstatus trennen

## Uebersicht

Die bisherige detaillierte Status-Kette wird vom Auftrag auf den **Termin** verlagert. Auftraege erhalten ein vereinfachtes Status-Modell.

### Neue Status-Struktur

**Termin-Status** (detailliert):
```text
Neu -> In Planung -> Vorbereitet -> In Umsetzung -> Review -> Abgenommen
```

**Auftrags-Status** (vereinfacht):
```text
Neu -> Ausfuehrung -> Nacharbeiten -> Abgeschlossen
```

---

## 1. Datenbank-Migration

### Neuer Enum: `appointment_status`
Ein neuer Enum-Typ wird erstellt mit den Werten: `neu`, `in_planung`, `vorbereitet`, `in_umsetzung`, `review`, `abgenommen`.

### Tabelle `job_appointments`
Die Spalte `status` (aktuell `text` mit Werten wie "offen", "geplant" etc.) wird auf den neuen Enum `appointment_status` umgestellt. Bestehende Text-Werte werden gemappt:
- `offen` -> `neu`
- `geplant` -> `in_planung`
- `abgeschlossen` -> `abgenommen`
- `abgesagt` -> `neu` (Fallback)

### Enum `job_status` vereinfachen
Neue Werte `ausfuehrung` wird hinzugefuegt. Die alten Werte (`in_planung`, `vorbereitet`, `in_umsetzung`, `review`, `abgenommen`) bleiben im Enum bestehen (PostgreSQL kann keine Werte entfernen), werden aber im Frontend nicht mehr angezeigt. Bestehende Jobs mit alten Status-Werten werden auf `ausfuehrung` migriert.

---

## 2. TypeScript-Typen (src/types/montage.ts)

Neuer Typ und Konstanten:
- `AppointmentStatus = 'neu' | 'in_planung' | 'vorbereitet' | 'in_umsetzung' | 'review' | 'abgenommen'`
- `APPOINTMENT_STATUS_LABELS` und `APPOINTMENT_STATUS_ORDER`
- `JobStatus` wird reduziert auf `'neu' | 'ausfuehrung' | 'nacharbeiten' | 'abgeschlossen'`
- `JOB_STATUS_LABELS` und `JOB_STATUS_ORDER` werden entsprechend aktualisiert

---

## 3. Neue Komponente: AppointmentStatusTimeline

Die bestehende `JobStatusTimeline`-Logik (Validierung, Fortschrittsanzeige) wird in eine neue Komponente `AppointmentStatusTimeline` verschoben, die den Termin-Status steuert. Die Validierungsregeln (Pflichtdokumente, Pflichtfelder, Checklisten) gelten jetzt pro Termin.

---

## 4. JobStatusTimeline vereinfachen

Die `JobStatusTimeline` wird auf die vier neuen Auftrags-Status reduziert. Die Validierungslogik faellt hier weg, da diese jetzt auf Termin-Ebene liegt.

---

## 5. Betroffene Dateien

### Datenbank
- Neuer Enum `appointment_status`
- `job_appointments.status` umstellen
- Bestehende `job_status`-Werte migrieren
- Neuen Wert `ausfuehrung` hinzufuegen

### Neue Dateien
- `src/components/montage/AppointmentStatusTimeline.tsx` -- Status-Timeline fuer Termine

### Geaenderte Dateien
- `src/types/montage.ts` -- Neue Typen und vereinfachte Job-Status
- `src/components/montage/JobStatusTimeline.tsx` -- Vereinfacht auf 4 Status, ohne Validierung
- `src/components/montage/AppointmentCard.tsx` -- Termin-Status mit neuem Enum, Status-Timeline einbinden
- `src/pages/AdminJobDetail.tsx` -- Vereinfachte Job-Status-Anzeige
- `src/pages/AdminMontageAuftraege.tsx` -- Vereinfachte Status-Farben und -Filter
- `src/pages/AdminMontageKundenDetail.tsx` -- Vereinfachte Status-Farben
- `src/pages/AdminMontageTermine.tsx` -- Termin-Status-Filter anpassen
- `src/pages/MonteurJobDetail.tsx` -- Vereinfachter Job-Status
- `src/pages/MonteurMontage.tsx` -- Termin-Status anzeigen
- `src/components/planung/GanttAppointmentDialog.tsx` -- Termin-Status anpassen
- `src/hooks/useJobAppointments.ts` -- ggf. Typ-Anpassungen

### Technische Details

#### SQL-Migration
```text
-- 1. Neuer Enum fuer Termin-Status
CREATE TYPE public.appointment_status AS ENUM ('neu','in_planung','vorbereitet','in_umsetzung','review','abgenommen');

-- 2. job_appointments.status umstellen
ALTER TABLE public.job_appointments
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE public.job_appointments
  ALTER COLUMN status TYPE appointment_status
  USING CASE
    WHEN status = 'geplant' THEN 'in_planung'::appointment_status
    WHEN status = 'abgeschlossen' THEN 'abgenommen'::appointment_status
    ELSE 'neu'::appointment_status
  END;

ALTER TABLE public.job_appointments
  ALTER COLUMN status SET DEFAULT 'neu'::appointment_status;

-- 3. Neuer Wert fuer job_status
ALTER TYPE public.job_status ADD VALUE IF NOT EXISTS 'ausfuehrung';

-- 4. Bestehende Jobs mit alten Detail-Status migrieren
UPDATE public.jobs SET status = 'ausfuehrung'
WHERE status IN ('in_planung','vorbereitet','in_umsetzung','review','abgenommen');
```
