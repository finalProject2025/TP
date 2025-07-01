 npm create vite@latest (ignore files &continue musste ausgewählt werden, da der Ordner nicht leer war und es schon ein bestehendes Repository war)
 typescript + SWC & react ausgewählt für eine höhere Code Qualität
 npm install
 npm run dev
Dieser Befehl dient dazu, dass die Seite nicht automatisch übersetzt wird:
<h1 translate="no">Vite + React</h1>

<meta charset="UTF-8" />  (damit die Umlaute angezeigt werden)
es gibt noch viele weitere charsets

<link rel="icon" type="image/svg+xml" href="/vite.svg" />
für das Favicon in der Tab-Anzeige

<meta name="viewport" content="width=device-width, initial-scale=1.0" />
Diese Zeile sorgt dafür, dass eine Webseite sich an die Größe des Endgeräts anpasst und in der richtigen Zoomstufe geladen wird – ein Muss für moderne mobile Websites.

Wenn responsive Webdesign gewünscht ist, gehört diese Zeile immer in den <head> der HTML-Datei.

Ab React 17 braucht man keine React import React from 'react'; mehr

