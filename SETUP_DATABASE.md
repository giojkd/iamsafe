# Setup Database - Istruzioni

## Problema
L'app richiede che le tabelle del database siano create per funzionare correttamente.

## Soluzione: Applicare le Migrazioni Manualmente

### Passo 1: Accedi a Supabase

1. Vai su [supabase.com](https://supabase.com)
2. Fai login con il tuo account
3. Apri il progetto dell'app (dovrebbe essere chiamato qualcosa come `bolt-native-database-58763821`)

### Passo 2: Apri SQL Editor

1. Nel menu laterale sinistro, clicca su **SQL Editor**
2. Clicca su **New query** per creare una nuova query

### Passo 3: Esegui le Migrazioni nell'Ordine Corretto

**IMPORTANTE**: Le migrazioni devono essere eseguite in questo ordine specifico:

#### 3.1 - Prima Migrazione: Profiles

1. Apri il file `supabase/migrations/00_create_profiles.sql`
2. Copia **tutto il contenuto** del file (Ctrl+A, Ctrl+C)
3. Incolla nel SQL Editor di Supabase
4. Clicca su **Run** (o premi Ctrl+Enter)
5. Dovresti vedere un messaggio "Success. No rows returned"

Questa migrazione crea:
- Tabella `profiles` (profili utenti e bodyguard)
- Funzione `update_updated_at_column()` per gestire i timestamp
- Policy di sicurezza RLS per i profili

#### 3.2 - Seconda Migrazione: Bookings and Payments

1. Apri il file `supabase/migrations/create_bookings_and_payments.sql`
2. Copia **tutto il contenuto** del file
3. Incolla nel SQL Editor di Supabase
4. Clicca su **Run**
5. Dovresti vedere "Success. No rows returned"

Questa migrazione crea:
- Tabella `bookings` (prenotazioni)
- Tabella `payments` (pagamenti)
- Policy di sicurezza RLS
- Indici per performance

#### 3.3 - Terza Migrazione: Chat System

1. Apri il file `supabase/migrations/create_chat_system.sql`
2. Copia **tutto il contenuto** del file
3. Incolla nel SQL Editor di Supabase
4. Clicca su **Run**
5. Dovresti vedere "Success. No rows returned"

Questa migrazione crea:
- Tabella `conversations` (conversazioni)
- Tabella `messages` (messaggi)
- Policy di sicurezza RLS
- Trigger per aggiornare automaticamente le conversazioni

#### 3.4 - Quarta Migrazione: SOS System

1. Apri il file `supabase/migrations/create_sos_system.sql`
2. Copia **tutto il contenuto** del file
3. Incolla nel SQL Editor di Supabase
4. Clicca su **Run**
5. Dovresti vedere "Success. No rows returned"

Questa migrazione crea:
- Tabella `emergency_contacts` (contatti di emergenza)
- Tabella `sos_alerts` (allerte SOS)
- Tabella `sos_notifications` (notifiche)
- Policy di sicurezza RLS
- Trigger automatici per gestire le notifiche

#### 3.5 - Quinta Migrazione: Audio Recordings

1. Apri il file `supabase/migrations/add_audio_recordings.sql`
2. Copia **tutto il contenuto** del file
3. Incolla nel SQL Editor di Supabase
4. Clicca su **Run**
5. Dovresti vedere "Success. No rows returned"

Questa migrazione crea:
- Tabella `sos_audio_recordings` (registrazioni audio)
- Storage bucket `sos-audio-recordings`
- Policy di sicurezza per i file audio

#### 3.6 - Sesta Migrazione: Bodyguard Work Zones

1. Apri il file `supabase/migrations/add_bodyguard_work_zones.sql`
2. Copia **tutto il contenuto** del file
3. Incolla nel SQL Editor di Supabase
4. Clicca su **Run**
5. Dovresti vedere "Success. No rows returned"

Questa migrazione crea:
- Tabella `bodyguard_work_zones` (zone di lavoro dei bodyguard)
- Policy di sicurezza RLS

### Passo 4: Verifica le Tabelle

1. Nel menu laterale, clicca su **Table Editor**
2. Dovresti vedere queste tabelle:
   - `profiles`
   - `bookings`
   - `payments`
   - `conversations`
   - `messages`
   - `emergency_contacts`
   - `sos_alerts`
   - `sos_notifications`
   - `sos_audio_recordings`
   - `bodyguard_work_zones`

### Passo 5: Torna all'App e Riprova

1. Ricarica l'app nel browser (F5)
2. Ora tutte le funzionalità dell'app dovrebbero funzionare correttamente:
   - Registrazione e login
   - Prenotazioni bodyguard
   - Chat con i bodyguard
   - Sistema SOS e contatti di emergenza
   - Gestione profilo

## Risoluzione Problemi

### Se vedi errori durante l'esecuzione

**Errore: "relation already exists"**
- Alcune tabelle esistono già, è normale. Il codice usa `IF NOT EXISTS` quindi puoi eseguire di nuovo senza problemi.

**Errore: "permission denied"**
- Assicurati di essere loggato come owner del progetto Supabase

**Errore: "function already exists"**
- Anche questo è normale. Le funzioni vengono ricreate con `CREATE OR REPLACE`

### Se l'app continua a non funzionare

1. Apri la console del browser (F12)
2. Vai alla tab **Console**
3. Prova ad aggiungere un contatto
4. Cerca messaggi di errore che iniziano con `[SOS Service]`
5. Copia l'errore e contatta il supporto

### Verifica Manuale

Puoi testare se il database funziona con questa query SQL:

```sql
-- Verifica che la tabella esista
SELECT COUNT(*) FROM emergency_contacts;

-- Prova a inserire un contatto di test (sostituisci YOUR_USER_ID con il tuo ID utente)
INSERT INTO emergency_contacts (user_id, contact_name, contact_phone, priority, is_active)
VALUES ('YOUR_USER_ID', 'Test Contact', '+39 123 456 789', 1, true);

-- Visualizza i contatti
SELECT * FROM emergency_contacts WHERE user_id = 'YOUR_USER_ID';
```

## Contatto

Se hai problemi, condividi:
1. Screenshot dell'errore nella console del browser
2. Screenshot dell'errore in Supabase SQL Editor
3. Quale passo ha fallito
