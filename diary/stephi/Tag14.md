## Heutige Hauptaufgabe(n)
Unsere Hauptaufgabe bestand heute darin, die Anwendung auf einer EC2-Instanz in AWS zu deployen.  
Ziel war es, die bestehende Node.js-Anwendung produktionsnah auf einem Linux-Server zum Laufen zu bringen.  


## Fortschritt & Ergebnisse
- EC2-Instanz (Ubuntu) in AWS gestartet und konfiguriert
- SSH-Zugriff hergestellt und Security Group angepasst (Port 22 und 80 freigegeben)
- Node.js mit `nvm` installiert (z. B. Version 23.5.0)
- Anwendung per `scp` auf die Instanz übertragen
- Abhängigkeiten mit `npm install` installiert
- Anwendung mit `pm2` gestartet und dauerhaft erreichbar gemacht
- Funktionstest über öffentliche IP erfolgreich durchgeführt

## Herausforderungen & Blockaden
- Initiale Probleme mit fehlendem Zugriff auf Port 80 (gelöst durch Anpassung der Rechte bzw. Weiterleitung)
- `nvm` war nach erneutem Einloggen nicht direkt verfügbar (gelöst durch Konfiguration der Shell)
- Verzögerungen durch fehlerhafte oder unvollständige Inbound-Rules in der AWS Security Group

## Was ich heute gelernt habe
- Einsatz von `pm2`, um Node.js-Anwendungen auf einem Server dauerhaft laufen zu lassen
- Konfiguration von AWS Security Groups zur Steuerung des Zugriffs
- Verwendung von `scp`, um Projekte auf entfernte Server zu übertragen

## Plan für morgen
- eventuell Unit-Tests
- Vorbereitung einer einfachen Deployment-Automatisierung ( Github-Actions, CI/CD-Pipeline)