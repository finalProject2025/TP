## Heutige Hauptaufgabe(n)
- Besprechung und Analyse der aktuellen Teststrategie und auftretender Probleme (Thema auf morgen verschoben)
- Behebung von Linting-Fehlern (durch den Einsatz von Typen anstelle von `any`)
- Modularisierung des Backends und Merge in den `main`-Branch
- Überprüfung der User Experience mit Fokus auf Verbesserungspotenziale
- Implementierung der "Passwort vergessen"-Logik mit Google Mail als SMTP-Server
- Erweiterung der Post-Logik: Benutzer sehen nur Posts von Personen mit identischer Postleitzahl

## Fortschritt & Ergebnisse
- Linting-Probleme im Frontend behoben (durch Ersetzen von `any` durch passende Typannotationen)
- Backend erfolgreich modularisiert und in den Hauptzweig integriert
- Passwort-zurücksetzen-Funktion implementiert inkl. Mailversand via Gmail SMTP
- UX-Analyse durchgeführt; kleinere Verbesserungen identifiziert
- Posts werden nun basierend auf PLZ gefiltert dargestellt

## Herausforderungen & Blockaden
- Unklare Teststrategie und unstrukturierte Diskussion → Thema wurde auf morgen verschoben
- Linting-Warnungen durch dynamische Typen (`any`) – Lösung durch präzisere Typdefinitionen
- SMTP-Setup mit Gmail erforderte spezielle App-Passwörter und Konfiguration

## Was ich heute gelernt habe
- Wie man mit Gmail als Mailserver arbeitet und dafür App-spezifische Passwörter nutzt

## Plan für morgen
- Gemeinsame Erarbeitung einer strukturierten Teststrategie (Unit- und Integrationstests)
- Umsetzung erster Tests im Frontend (z. B. für das Registrierungsformular)
- Eventuell: Verbesserung der UX auf Basis der heutigen Analyse
