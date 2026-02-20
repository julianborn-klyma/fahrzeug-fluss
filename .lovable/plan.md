
# Produkte und Pakete pro Termin

## Uebersicht
Jedem Termin (Appointment) koennen Produkte und Pakete aus dem Kalkulationsmodul zugewiesen werden. Der Auftrag (Job) bekommt ein Preisbuch zugeordnet, damit die richtigen Preise gezogen werden. Pro Termin werden EK, VK und MwSt berechnet.

## Aenderungen

### 1. Datenbank

**Neue Tabelle `job_appointment_items`:**
- `id` (uuid, PK)
- `job_appointment_id` (uuid, FK -> job_appointments)
- `item_type` (text: 'product' oder 'package')
- `item_id` (uuid, Referenz auf kalkulation_products oder kalkulation_packages)
- `quantity` (numeric, default 1)
- `vat_rate` (numeric, default 19 -- MwSt-Satz in Prozent)
- `override_vk` (numeric, nullable -- optionaler manueller VK-Override)
- `created_at` (timestamptz)

RLS-Policies: Gleiche Struktur wie bei job_appointments (Admin/Office/Teamleiter ALL, Monteur SELECT).

**Neue Spalte auf `jobs`:**
- `pricebook_id` (uuid, nullable) -- Zugeordnetes Preisbuch

### 2. Auftrag: Preisbuch-Zuordnung

In `AdminJobDetail.tsx` wird neben dem Auftragsplaner eine Preisbuch-Auswahl (Select-Dropdown) angezeigt. Dort waehlt man das Preisbuch, das fuer die Preisberechnung aller Termine verwendet wird.

### 3. Detail-Modal: 3 Tabs

Das bestehende Detail-Modal im `AppointmentCard.tsx` hat derzeit 2 Tabs (Details, Checklisten). Es wird um einen dritten Tab **"Produkte"** erweitert:

**Tab "Produkte":**
- Tabelle mit zugeordneten Produkten/Paketen: Name, Typ (Produkt/Paket), Menge, EK, VK, MwSt-Satz
- Button "Produkt/Paket hinzufuegen" oeffnet ein Auswahl-Dialog
- MwSt-Satz pro Zeile aenderbar (0%, 7%, 19%)
- Summenzeile unten: Gesamt-EK, Gesamt-VK netto, MwSt-Betrag, Brutto
- Preise werden aus dem zugeordneten Preisbuch des Auftrags gezogen (kalkulation_product_prices / kalkulation_package_prices)

### 4. Hinzufuegen-Dialog

Modal mit:
- Toggle zwischen "Produkte" und "Pakete"
- Suchfeld
- Liste der verfuegbaren Produkte/Pakete mit Artikelnummer, Name, EK und VK (aus dem Preisbuch des Auftrags)
- Klick fuegt das Item mit Menge 1 und 19% MwSt hinzu

### 5. Neue Dateien und Hooks

- `src/hooks/useAppointmentItems.ts` -- CRUD fuer job_appointment_items
- `src/components/montage/AppointmentProductsTab.tsx` -- Der neue "Produkte"-Tab

### 6. Bestehende Dateien die geaendert werden

- `src/pages/AdminJobDetail.tsx` -- Preisbuch-Select hinzufuegen, pricebook_id an AppointmentCard weitergeben
- `src/components/montage/AppointmentCard.tsx` -- Dritten Tab "Produkte" im Detail-Modal, pricebook_id als Prop
- `src/hooks/useJobs.ts` -- pricebook_id in Queries und Updates einbauen
- `src/types/montage.ts` -- Job-Interface um pricebook_id erweitern

## Technische Details

### Preisberechnung
- EK pro Produkt: `material_cost + (hourly_rate * time_budget)` (aus kalkulation_product_prices)
- VK pro Produkt: `final_vk` aus kalkulation_product_prices (oder override_vk falls gesetzt)
- EK pro Paket: Summe der Produkt-EKs * Menge aus package_items
- VK pro Paket: `custom_override_vk` aus kalkulation_package_prices, oder Summe der Produkt-VKs
- MwSt pro Zeile: `VK * quantity * (vat_rate / 100)`
- Es werden die bestehenden Hooks `useProductPrices`, `usePackagePrices`, `useProducts`, `usePackages`, `useAllPackageItems` wiederverwendet

### Datenfluss

```text
Job (pricebook_id) 
  -> AppointmentCard (pricebook_id prop)
    -> AppointmentProductsTab
      -> useAppointmentItems (CRUD job_appointment_items)
      -> useProductPrices(pricebook_id) + usePackagePrices(pricebook_id)
      -> Berechnung EK/VK/MwSt mit Hilfsfunktionen aus src/lib/kalkulation.ts
```
