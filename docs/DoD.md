# Definition of Done (DoD)
> Diese Definition of Done gilt für alle User Stories, Bugs und technischen Aufgaben im Nachbarschaftshilfe-Projekt. Sie stellt sicher, dass Qualität, Transparenz und Nachvollziehbarkeit im Team gewährleistet sind.
---
## Allgemeine Anforderungen
- [ ] Alle **Akzeptanzkriterien** der User Story sind erfüllt.
- [ ] Aufgabe wurde **im Team-Board auf „Done“ gesetzt**.
- [ ] **Code-Review** durch mindestens eine andere Person durchgeführt.
- [ ] **Pull Request erfolgreich gemerged** (nach bestandener CI/CD).
- [ ] Die Funktion ist **für Endnutzer nachvollziehbar** (UX, Fehlermeldungen, etc.).
---
## Code-Qualität
- [ ] Funktionaler und **sauber strukturierter Code** ist implementiert.
- [ ] Kein toter Code im PR enthalten.
- [ ] **ESLint + Prettier**-Checks laufen erfolgreich.
- [ ] Variablennamen und Funktionsnamen sind **verständlich und selbsterklärend**.
---
## Testing
- [ ] **Unit-Tests** für neue Funktionen geschrieben (z. B. mit Vitest oder Jest).
- [ ] Tests laufen **automatisch in GitHub Actions**.
- [ ] Testabdeckung geprüft und akzeptabel (>80 %, wenn machbar).
- [ ] Backend: Tests für Routen, Validierungen und Business-Logik.
- [ ] Fehlerfälle sind mit abgedeckt (z. B. ungültige Eingaben).
---
## Frontend (React + Vite + Tailwind)
- [ ] UI-Komponenten sind **responsive und barrierefrei** (wenn möglich).
- [ ] **Tailwind-Klassen wurden konsistent und sinnvoll eingesetzt**.
- [ ] **Navigation, Buttons und Formulare funktionieren wie vorgesehen**.
- [ ] UX-Szenarien wurden getestet (z. B. Hilfsgesuche erstellen, Anfragen senden).
- [ ] Falls relevant: Dokumentation oder Screenshots im `docs/`-Ordner ergänzt.
---
## Backend (Node.js + Express)
- [ ] API-Endpunkte sind **funktional, validiert und dokumentiert**.
- [ ] Eingaben werden serverseitig geprüft (z. B. `express-validator`, manuell).
- [ ] Fehlerbehandlung vorhanden (HTTP 4xx/5xx mit Message).
- [ ] Authentifizierung via JWT korrekt implementiert.
- [ ] Passwort-Hashing erfolgt mit Bcrypt.
---
## Infrastruktur & DevOps
- [ ] Falls relevant: Änderungen an **Kubernetes YAMLs** (falls nötig) vorgenommen.
- [ ] Falls relevant: **Terraform-Code** für neue Ressourcen geschrieben.
- [ ] Falls relevant: Erfolgreiches Deployment in eine Staging-Umgebung (z.B. Kubernetes Cluster).
- [ ] Secrets und sensitive Daten **nicht hardcoded**, sondern über Secrets/Env.
---
## CI/CD (GitHub Actions)
- [ ] Linting, Build und Tests **laufen automatisch bei jedem PR**.
- [ ] Fehlerhafte Pipelines werden **nicht ignoriert** – PR darf nur mit erfolgreicher Pipeline gemerged werden.
---
## Sicherheit & Monitoring
- [ ] Sicherheitsrelevante Aspekte wurden berücksichtigt:
  - Authentifizierung/Autorisierung
  - Keine sensiblen Daten im Frontend
  - Keine SQL-Injection/unsichere Endpunkte
- [ ] Falls relevant: Logging der wichtigsten Aktionen implementiert (z. B. Loginversuche).
- [ ] Falls relevant: Monitoring-Ressourcen konfiguriert (wenn möglich/prometheus geplant).
---
## Dokumentation
- [ ] Code ist für die Nachvollziebarkeit kommentiert.
- [ ] Relevante Projekt-Dokumente (`technical_plan.md`, `README.md`) aktualisiert.
- [ ] Neue Umgebungsvariablen in `.env.example` dokumentiert.
- [ ] Falls relevant: Deployment-Schritte bei Bedarf in `docs/deployment.md` ergänzt.