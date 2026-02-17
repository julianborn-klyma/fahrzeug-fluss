
# Neue Auftragsstatus "Review" und "Abgenommen" einfuegen

## Uebersicht

Zwei neue Status werden in den Auftrags-Lebenszyklus eingefuegt. Die gewuenschte Reihenfolge ist:

Neu -> In Planung -> Vorbereitet -> In Umsetzung -> **Review** -> **Abgenommen** -> Nacharbeiten -> Abgeschlossen

## 1. Datenbank-Migration

Zwei neue Werte werden zum `job_status` Enum hinzugefuegt:
- `review`
- `abgenommen`

Zusaetzlich wird `signature_url` (text) zur Tabelle `job_appointments` hinzugefuegt (fuer die spaetere Unterschrift-Funktion).

Ein `signatures` Storage-Bucket wird erstellt mit passenden RLS-Policies.

## 2. TypeScript-Typen anpassen (src/types/montage.ts)

- `JobStatus` Typ erweitern um `'review' | 'abgenommen'`
- `JOB_STATUS_LABELS` ergaenzen: `review: 'Review'`, `abgenommen: 'Abgenommen'`
- `JOB_STATUS_ORDER` anpassen auf die korrekte Reihenfolge:
  `['neu', 'in_planung', 'vorbereitet', 'in_umsetzung', 'review', 'abgenommen', 'nacharbeiten', 'abgeschlossen']`

## 3. JobStatusTimeline anpassen (src/components/montage/JobStatusTimeline.tsx)

Die Validierungslogik (`STATUSES_REQUIRING_VALIDATION`) wird um die neuen Status erweitert, damit die Pflichtfeld-Pruefung auch in diesen Phasen greift.

## Technische Details

### SQL-Migration
```text
ALTER TYPE public.job_status ADD VALUE IF NOT EXISTS 'review';
ALTER TYPE public.job_status ADD VALUE IF NOT EXISTS 'abgenommen';
ALTER TABLE public.job_appointments ADD COLUMN IF NOT EXISTS signature_url text DEFAULT '';
-- Storage bucket + RLS fuer Unterschriften
```

### Geaenderte Dateien
- `src/types/montage.ts` -- JobStatus Typ, Labels und Order
- `src/components/montage/JobStatusTimeline.tsx` -- Validierungs-Array erweitern
