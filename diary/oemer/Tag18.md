### Heutige Hauptaufgabe(n)
- Überarbeitung und Vervollständigung des Projekts 
- Frontend- und Backend-Dateien ergänzt und verbessert
- Vorbereitung auf die Präsentation: offene Punkte ausgebessert und abgestimmt  

### Fortschritt & Ergebnisse
- **Frontend**:
  - Komponenten wie `RatingModal.tsx`, `Toast.tsx`, `FloatingNotificationBadge.tsx` fertiggestellt
  - Struktur unter `components/`, `hooks/`, `services/`, `utils/` überprüft und vereinheitlicht
- **Backend**:
	- komplettes Backend auf TypeScript umgestellt
  - Controller (`authController.ts`, `ratingsController.ts`) und Routen (`posts.ts`, `users.ts`) überarbeitet
  - Middleware für Authentifizierung und Validierung integriert
  - Konfigurationsdateien (`.env`, `tsconfig.json`, `eslint.config.js`) angepasst
- **Präsentation**:  
- Präsentationsmaterial aktualisiert und mit Team abgestimmt


### Herausforderungen & Blockaden
- Unklare Anforderungen bei einigen API-Routen – Abstimmungen im Team nötig
- Datenfluss zwischen Backend und einzelnen UI-Komponenten teils uneinheitlich
- Absprache der Zuständigkeiten bei finalen Änderungen im Team


### Was ich heute gelernt habe
- Bedeutung einer konsistenten Projektstruktur in TypeScript/React
- Anwendung von `useContext` + Custom Hooks (`useToast`) für globale UI-Zustände
- Nutzung von Express-Middleware zur zentralen Zugriffskontrolle und Datenvalidierung


### Plan für morgen
- Implementierung von Unit Tests und Github Actions
- Präsentation weiter üben und evtl. noch weitere Anpassungen vornehmen