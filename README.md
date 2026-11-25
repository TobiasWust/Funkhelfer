<p align="center">
  <img src="www/img/icons/logo-192.png" width="128" height="128" alt="Funkhelfer-Logo">
</p>

<h1 align="center">Funkhelfer</h1>

<p align="center">Kanal und Frequenz für PMR446, LPD und Freenet, CTCSS-Töne und ein Gruppenkanal zum Teilen.<br>
Offline-Web-App für Gleitschirmflieger, in Partnerschaft mit der <a href="https://www.flugschule-phoenix.de/">Flugschule Phönix</a>.</p>

<p align="center"><a href="https://funkhelfer.de/">funkhelfer.de</a></p>

## Funktionen

- Kanaltabellen für PMR446 (16 Kanäle, 9–16 als „neu“ markiert), LPD 433 (69) und Freenet (6), dazu die 38 CTCSS-Töne
- **Unser Kanal:** Dienst, Kanal und CTCSS merken und per Link an die Gruppe schicken (`?k=pmr12&t=7`)
- **Großanzeige** für den Startplatz, der Bildschirm bleibt dabei an
- Suche nach Kanal, Frequenz oder Ton
- Infos und Tipps mit Links zu [gleitschirmfunk.de](https://www.gleitschirmfunk.de/)
- Installierbar als App, funktioniert offline, Dark Mode

## Entwicklung

Kein Build-Schritt: `www/` ist die fertige Seite.

```bash
python3 -m http.server 5173 -d www
```

Nach Änderungen an Dateien in `www/` die Version `CACHE` in `www/sw.js` hochzählen (und `VERSION` in `www/js/app.js`), sonst behalten installierte Apps die alte Version.
