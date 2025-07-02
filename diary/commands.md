
# Projekt Setup & Hinweise

##  Vite-Projekt mit React und TypeScript (SWC)

```bash
npm create vite@latest
```

> Hinweis: Bei bestehendem Repository muss **"ignore files & continue"** ausgewählt werden, da der Ordner nicht leer ist.

- Ausgewählt: **TypeScript + SWC & React**  
  (für höhere Codequalität)

```bash
npm install
npm run dev
```

---

##  HTML-Konfiguration

###  Automatische Übersetzung verhindern (z. B. für Umlaute)

```html
<h1 translate="no">Vite + React</h1>
```

---

###  Zeichensatz definieren

```html
<meta charset="UTF-8" />
```

Es gibt noch viele weitere `charset`-Optionen, aber `UTF-8` ist Standard und ausreichend.

---

###  Favicon in der Browser-Tab-Leiste

```html
<link rel="icon" type="image/svg+xml" href="/vite.svg" />
```

---

###  Responsive Webdesign aktivieren

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

Diese Zeile gehört immer in den `<head>` einer HTML-Datei.  
Sie sorgt dafür, dass die Seite sich an die Bildschirmgröße des Endgeräts anpasst.

---

##  React 17+ Besonderheit

Seit React 17 ist dieser Import **nicht mehr nötig**:

```ts
import React from 'react';
```

---

##  Daten auf GitHub wiederherstellen

###  Variante 1: Über das GitHub-Webinterface

1. Öffne dein Repository auf GitHub.
2. Klicke auf **"Commits"** oder auf die Datei `README.md` → **"History"**.
3. Wähle einen älteren Commit vor der Änderung aus.
4. Sieh dir die alte Version der Datei an und kopiere sie bei Bedarf zurück.

---

###  Variante 2: Lokal mit Git (Terminal)

```bash
# Commit-Historie der README.md anzeigen
git log -- README.md

# Datei aus einem bestimmten Commit wiederherstellen
git checkout <COMMIT_HASH> -- README.md
```

> Ersetze `<COMMIT_HASH>` durch den tatsächlichen Hash des gewünschten Commits.

---

**Tipp:**  
Regelmäßige Commits schützen dich vor Datenverlust und machen es einfacher, versehentliche Änderungen rückgängig zu machen.


## Tailwind installieren
https://tailwindcss.com/docs/installation/using-vite

```bash
npm install tailwindcss @tailwindcss/vite
```
Configure the Vite plugin
Add the @tailwindcss/vite plugin to your Vite configuration.
---

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
```
Import Tailwind CSS
Add an @import to your CSS file that imports Tailwind CSS.
---
```css
@import "tailwindcss";
```
---
```bash
npm run dev
```