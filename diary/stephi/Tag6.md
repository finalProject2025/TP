## Heutige Hauptaufgabe(n)
- Ziel: Vorbereitung und Einrichtung eines Testdeployments auf einer Multipass-Umgebung für unsere Anwendung Neighborly.

## Fortschritt & Ergebnisse
- PostgreSQL erfolgreich auf der Multipass-VM installiert
- Dump-Datei erfolgreich in die neue Datenbank importiert
- Frontend-Build (dist-Ordner) per `multipass transfer` in die VM übertragen
- erste Tests der Webanwendung im neuen Setup durchgeführt

## Herausforderungen & Blockaden
- Zugriffsrechte auf `/var/www/html` haben beim Transfer über Multipass Probleme gemacht und mussten über chown angepasst werden
- Encoding-Probleme beim Transfer von Dateien via PowerShell unter Windows (invalid utf8)

## Was ich heute gelernt habe
- Multipass transfer benötigt explizit den Parameter `--recursive` für Verzeichnisse
- Standardrechte von `/var/www/html` blockieren Transfers und müssen gezielt angepasst werden

## Plan für morgen
- weitere Tests der Webanwendung im neuen Setup
- Konfiguration des PostgreSQL-Zugriffs von extern absichern
- eventueller Beginn von Unit - Tests (siehe Jira)