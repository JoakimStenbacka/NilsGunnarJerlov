# Nisses hav

En webbplats till minne av oceanografen Nils Gunnar Jerlov (1909–1990) och en modern introduktion till hans vattentyper.

## Innehåll

| Sökväg | Vad |
|---|---|
| `index.html` | Hela sidan: dykdemo, scener under ytan, karta, sjöar, mätning och tidslinje. Fristående, ingen byggprocess. |
| `data/map.json` | Förberäknade kartdata. Samma data ligger också inbäddade i `index.html`. |
| `tools/map/` | Skriptet som bygger kartdata från Natural Earth. |
| `content/` | Plats för berättelsen om Nisse som Markdown. |

## Kör lokalt

Öppna `index.html` direkt i webbläsaren, eller starta en enkel server:

```sh
python3 -m http.server 8000
```

Gå sedan till http://localhost:8000.

## Publicera

Sidan är statisk, så den fungerar på alla vanliga värdar:

- **GitHub Pages:** Settings → Pages → Deploy from branch → `main` / root.
- **Codeberg Pages eller Forgejo:** lägg filerna i en `pages`-gren.
- **Netlify eller Cloudflare Pages:** koppla repot, inget byggkommando, publiceringsmapp `/`.

## Bygg om kartan

```sh
cd tools/map
npm install
npm run build
```

Skriptet skriver `data/map.json`. Klistra sedan in innehållet i `<script type="application/json" id="mapdata">` i `index.html`, eller ändra sidan så att den läser filen med `fetch("data/map.json")`.

## Om data

- Vattentypernas dämpningsvärden är ungefärliga och avrundade efter Jerlov, *Marine Optics* (1976). De bör kontrolleras mot den publicerade tabellen innan sidan används som referens.
- Vattentyperna på kartan är typiska värden ur litteraturen, inte satellitmätningar.
- Albatross rutt är ritad mellan kända hamnar: Göteborg, Madeira, Panama, Tahiti, Honolulu, Nya Guinea, Bali, Sri Lanka, Seychellerna, Röda havet, Suez och Monaco.
- Undervattensscenerna är illustrationer räknade ur samma modell, med förstärkt kontrast.

## Licenser för tredjepartsmaterial

- Kartdata: Natural Earth (public domain) via paketet `world-atlas` (ISC).
- Typsnitt: Newsreader och IBM Plex via Google Fonts (SIL Open Font License).

Välj själv en licens för koden och texterna, till exempel MIT för koden och CC BY 4.0 för texterna, och lägg den i en `LICENSE`-fil.
