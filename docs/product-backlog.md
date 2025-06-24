
# Projekt: Nachbarschaftshilfe-Webservice  

**Team:** Stephi, Yasemin, Ömer 

**Tool für Backlog-Verwaltung:**  Jira  

**Hinweis:**  
> Dies ist der erste Entwurf des Product Backlogs für das Abschlussprojekt "Nachbarschaftshilfe". Das Dokument umfasst priorisierte User Stories, technische Aufgaben, bekannte Bugs sowie Forschungsthemen. 
Der initiale Product Backlog befindet sich unter `/docs/product-backlog.md`.

---

## Product Backlog (Erste Version)

---

### Top-priorisierte User Stories (ready für Sprint 1)

#### 1. Als Nachbar möchte ich mich registrieren können, damit ich Hilfsgesuche und Hilfsangebote anlegen oder besuchen kann.
- **Akzeptanzkriterien:**
  - Formular mit Name, E-Mail, Passwort
  - Validierung von E-Mail-Format & Passwortlänge
  - Erfolgreiche Registrierung führt zu Login-Möglichkeit und speichert Daten in der Datenbank (Passwort gehasht)
  - Fehleranzeige bei ungültigen Eingaben
- **Priorität:** Hoch

#### 2. Als registrierter Nutzer möchte ich mich einloggen können, damit ich Zugang zu meinem Konto habe.
- **Akzeptanzkriterien:**
  - Login über E-Mail + Passwort
  - JWT-Token wird erstellt und im Header gespeichert
  - Ungültige Eingaben liefern sinnvolle Fehlermeldung
- **Priorität:** Hoch

#### 3. Als eingeloggter Nutzer möchte ich ein neues Hilfsgesuch oder Hilfsangebot erstellen können, damit andere daran teilnehmen können.
- **Akzeptanzkriterien:**
  - Hilfsgesuch-Titel, Datum, Beschreibung, Ort müssen eingegeben werden
  - Button "Hilfsgesuch erstellen" sichtbar nach Login
  - Nach dem Erstellen erscheint entweder das Hilfsgesuch oder Hilfsangebot in der Übersicht
- **Priorität:** Hoch

#### 4. Als Nachbar möchte ich eine Übersicht aller offenen Hilfsgesuche oder Hilfsangebote sehen, damit ich auf interessante Hilfsgesuche oder Hilfsangebote reagieren kann.
- **Akzeptanzkriterien:**
  - Hilfsgesuche werden nach Datum sortiert angezeigt
  - Möglichkeit, ein Gesuch zu akzeptieren
  - Hilfsgesuch/Hilfsangebot ändert Status auf „aktiv“ und wird im eigenen Dashboard angezeigt
  - "Mehr erfahren"-Funktion durch anklicken des Hilfsgesuches/Hilfsangebotes
- **Priorität:** Hoch

---

### Weitere User Stories (mittel/niedrig priorisiert)

#### 5. Als Nutzer möchte ich meine Hilfsgesuche/Hilfsangebote bearbeiten können, damit ich Änderungen vornehmen kann.
- **Akzeptanzkriterien:**
  - Nur eigene Hilfsgesuche/Hilfsangebote sind editierbar
  - Felder wie Inhalt, Datum oder Ort können geändert werden
  - Wenn ich eine Rückmeldung auf mein Hilfsgesuch/Hilfsangebot erhalte, kann ich entscheiden ob ich diese akzeptiere oder ablehne
  - Beim akzeptieren der Rückmeldung wird die Chat-Funktion aktiviert
  - Chat-Funktion so intuitiv verwendbar wie z.B. Whatsapp o.Ä.
- **Priorität:** Mittel

#### 6. Als Nutzer möchte ich mich für ein Hilfsgesuch anmelden können, damit ich helfen kann.
- **Akzeptanzkriterien:**
  - Button "Helfen" ist klickbar
  - Nach Klick muss ich als Nutzer warten, ob meine Unterstützung angenommen wird
  - Bei Annahme kann durch die Chat-Funktion weiteres besprochen werden
  - Max. Helferzahl wird beachtet (optional)
- **Priorität:** Mittel
<br>
<br>

---

### Technische Aufgaben

| Beschreibung                                             | Typ        | Verantwortlich | Priorität |
|----------------------------------------------------------|------------|----------------|-----------|
| Datenbankmodell für User, Hilfsgesuch/Hilfsangebot, Anmeldung aufsetzen     | Tech Task  | Ömer           | Hoch      |
| CI/CD-Pipeline für automatisches Deployment aufsetzen (optional)    | Tech Task  | Yasemin        | Mittel    |
| Authentifizierung mit JWT implementieren                 | Tech Task  | Stephi         | Hoch      |
| Passwort hashing mit Bcrypt                 | Tech Task  | Ömer           | Mittel    |
| Tailwind-Konfiguration prüfen und anpassen    | Tech Task  | Stephi        | Mittel    |
| Unit Test Setup (z. B. Jest/Pytest) konfigurieren         | Tech Task  | Yasemin        | Niedrig   |
| Error-Handling für API-Routen (Express Middleware)        | Tech Task  | Yasemin        | Mittel   |
| Validation mit express-validator       | Tech Task  | Stephi        | Niedrig   |
| Monitoring-Grundlage mit Prometheus aufsetzen (optional)      | Tech Task  | Stephi        | Niedrig   |
| Dockerfile für Frontend, Backend und Datenbank schreiben (optional)      | Tech Task  | Ömer        | Niedrig   |

---

### Bekannte Bugs / technische Risiken (initial)

| Beschreibung                                                     | Kategorie  | Priorität |
|------------------------------------------------------------------|------------|-----------|
| Fehlerhafte Validierung bei Registrierung/Login (z. B. leere Felder, doppelter User) | Bug        | Hoch    |
| Probleme bei JWT-Verifizierung im Frontend       | Bug        | Mittel      |
| Zeitformat bei Hilfsgesuch-Erstellung nicht standardisiert              | Bug        | Niedrig   |
| Fehlerhafte API-Kommunikation bei Deployment (CORS, Proxy)              | Bug        | Mittel   |
| Inkonsistente Statuswerte bei Hilfsgesuchen/Hilfsangeboten (offen/akzeptiert/erledigt)           | Bug        | Mittel   |

---

### Experimente / Forschungsthemen

| Thema                                                           | Zweck                                              | Verantwortlich |
|------------------------------------------------------------------|-----------------------------------------------------|----------------|
| Welche API für Geolocation bei Hilfsgesuche (Google Maps vs. OpenAPI)? | Entscheidung für Ort-Funktionalität           | Stephi         |
| E-Mail-Verifikation: Eigene Lösung oder Drittanbieter?           | Klärung Aufwand/Nutzen                              | Yasemin        |
| Vergleich von Deployment-Strategien (Docker vs. Railway)         | Optimierung der Deploymentzeit                      | Ömer           |

---

## Priorisierungskriterien
- **Kundennutzen:** Sichtbarkeit der Hilfsgesuche + Registrierung = zentral
- **Abhängigkeiten:** Hilfsgesuch-Erstellung setzt Registrierung voraus
- **Risiko:** Bugs bei Authentifizierung gefährden gesamte Webservice
- **Aufwand:** Tech Tasks wie CI/CD oder Tests kommen später

---

## "Definition of Ready" für Top Items erfüllt
- Klarer Titel im User Story Format
- Akzeptanzkriterien vorhanden
- Abhängigkeiten der Features geklärt
- Tasks untereinander aufgeteilt 
- Alle Punkte priorisiert
