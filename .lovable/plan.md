

# Montage-Modul Umstrukturierung: Unterpunkte + Kunden-Workflow

## Uebersicht

Das Montage-Modul wird von einer einzelnen Auftragslistenseite zu einem vollstaendigen Bereich mit Sub-Navigation umgebaut. Es entstehen vier Unterpunkte: Planung, Kunden, Auftraege und Termine. Der Kern dieser Aenderung ist ein neuer Kunden-/Immobilien-Workflow, bei dem Auftraege immer an einen Kunden und eine Immobilie (Einsatzort) gebunden sind.

## Aenderungen im Detail

### 1. Sub-Navigation im Montage-Bereich

Die bestehende AdminLayout-Navigation bleibt. Unter "Montage" entsteht eine sekundaere Tab-Leiste mit den vier Unterpunkten. Die Routing-Struktur wird erweitert:

- `/admin/montage` -- Redirect auf `/admin/montage/auftraege`
- `/admin/montage/planung` -- Platzhalter ("Kommt bald")
- `/admin/montage/kunden` -- Kundenliste
- `/admin/montage/kunden/:id` -- Kundendetail mit Immobilien
- `/admin/montage/auftraege` -- Auftragsliste (bisherige AdminMontage)
- `/admin/montage/termine` -- Platzhalter ("Kommt bald")
- `/admin/montage/job/:id` -- Bleibt wie bisher

### 2. Neue Seiten und Komponenten

**AdminMontage.tsx** -- Wird zur Layout-Seite mit Tab-Navigation (Planung, Kunden, Auftraege, Termine) und rendert die jeweilige Unterseite.

**Kundenliste (AdminMontageKunden.tsx)**:
- Suchbare Liste aller Kunden aus der `clients`-Tabelle
- Button "Neuer Kunde" oeffnet ein Dialogformular
- Klick auf Kunde navigiert zur Kundendetailseite

**Kundendetail (AdminMontageKundenDetail.tsx)**:
- Stammdaten des Kunden (Name/Firma, Rechnungsadresse, Email, Telefon)
- Liste der Immobilien (Einsatzorte) des Kunden
- Button "Neue Immobilie" mit Option "Rechnungsadresse = Einsatzort" oder separate Adresse
- Unter jeder Immobilie: Liste der zugehoerigen Auftraege mit "Neuer Auftrag"-Button

**Auftragsliste (AdminMontageAuftraege.tsx)**:
- Bisherige AdminMontage-Auftragslistenlogik hierher verschoben
- "Neuer Auftrag" startet jetzt einen mehrstufigen Wizard

**Neuer Auftrag Wizard (CreateJobWizard.tsx)**:
Ersetzt den bisherigen CreateJobDialog. Drei Schritte:
1. Kunde waehlen oder neu anlegen
2. Immobilie (Einsatzort) waehlen: "Rechnungsadresse verwenden" oder neue Immobilie anlegen
3. Auftragsdetails: Auftragsart (WP/PV/INST), Kundenname wird automatisch befuellt, Auftragsnummer und -titel werden generiert

### 3. Datenbank-Erweiterungen

Die Tabellen `clients`, `contacts`, `properties` existieren bereits. Folgende Anpassungen:

- In der `contacts`-Tabelle fehlt `phone` nicht (ist vorhanden).
- `clients` hat bereits `billing_street`, `billing_city`, `billing_postal_code`.
- `properties` hat `street_address`, `city`, `postal_code` und `client_id`.
- `jobs` hat `client_id` und `property_id`.

Keine neuen Tabellen noetig -- die bestehende Struktur deckt den Workflow ab.

### 4. Neuer Kunden-Hook (useClients.ts)

Ein neuer Hook fuer CRUD-Operationen auf `clients` mit zugehoerigen `contacts`:
- `useClients()` -- Liste aller Kunden mit Kontaktdaten
- `createClient` -- Legt Kontakt + Kunde an
- `updateClient` -- Aktualisiert Stammdaten

### 5. Neuer Properties-Hook (useProperties.ts)

- `useProperties(clientId)` -- Alle Immobilien eines Kunden
- `createProperty` -- Neue Immobilie anlegen (mit Option Rechnungsadresse zu uebernehmen)

## Technische Details

### Neue Dateien
- `src/pages/AdminMontageKunden.tsx` -- Kundenliste
- `src/pages/AdminMontageKundenDetail.tsx` -- Kundendetail + Immobilien
- `src/pages/AdminMontageAuftraege.tsx` -- Auftragsliste (aus AdminMontage extrahiert)
- `src/components/montage/CreateClientDialog.tsx` -- Neuer Kunde Formular
- `src/components/montage/CreatePropertyDialog.tsx` -- Neue Immobilie Formular
- `src/components/montage/CreateJobWizard.tsx` -- Mehrstufiger Auftrags-Wizard
- `src/components/montage/MontageSubNav.tsx` -- Tab-Navigation fuer Montage-Unterseiten
- `src/hooks/useClients.ts` -- Kunden-CRUD
- `src/hooks/useProperties.ts` -- Immobilien-CRUD

### Geaenderte Dateien
- `src/App.tsx` -- Neue Routen registrieren
- `src/pages/AdminMontage.tsx` -- Umgebaut zur Layout-Seite mit Sub-Navigation
- `src/components/montage/CreateJobDialog.tsx` -- Entfernt, ersetzt durch Wizard

### Auftrags-Erstellungsablauf

```text
[Neuer Auftrag]
    |
    v
Schritt 1: Kunde
    +-- Bestehenden Kunden aus Liste waehlen
    +-- ODER: Neuen Kunden anlegen (Name, Adresse, Email, Telefon)
    |
    v
Schritt 2: Einsatzort (Immobilie)
    +-- "Rechnungsadresse = Einsatzort" (erstellt Property mit gleicher Adresse)
    +-- ODER: Neue Adresse eingeben
    +-- ODER: Bestehende Immobilie des Kunden waehlen
    |
    v
Schritt 3: Auftragsdetails
    +-- Auftragsart waehlen (WP / PV / INST)
    +-- Auftragsnummer wird automatisch generiert (z.B. WP-2026-001)
    +-- Titel wird automatisch gebildet (z.B. Mueller_WP)
    +-- Optionale Beschreibung
    |
    v
[Auftrag erstellt mit client_id + property_id]
```

