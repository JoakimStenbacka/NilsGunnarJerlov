# Nisses hav

En webbplats om oceanografen Nils Gunnar Jerlov (1909–1990): hur solljus bryts i havsytan, och hur hans vattentyper beskriver färgen längre ner.

## Innehåll

| Sökväg | Vad |
|---|---|
| `index.html` | Sidan. Berättelse, Snells fönster, dyk genom de tio typerna, tre undervattensscener, en blandningsmodell, karta, mätning och tidslinje. |
| `css/site.css` | Utseende. |
| `js/optics.js` | Snells lag, Fresnel, K<sub>d</sub> ur Jerlov 1976 och färgräkningen. |
| `js/app.js` | Interaktionen. |
| `data/map.json` | Kartdata. `data/map.js` är samma data som skript, så sidan fungerar även om den öppnas som fil. |
| `tools/map/` | Bygger om kartan från Natural Earth. |
| `content/nils-jerlov.md` | Den längre texten om Nisse. |
| `tests/check-optics.js` | Kontrollerar tabellvärden, brytning och att klart och grumligt vatten inte byter plats. |

## Kör lokalt

Öppna `index.html` i webbläsaren, eller starta en server:

```sh
python3 -m http.server 8000
```

Gå sedan till http://localhost:8000.

Kontrollera optiken utan webbläsare:

```sh
node tests/check-optics.js
```

## Publicera

Sidan är statisk.

- **GitHub Pages:** Settings → Pages → Deploy from branch → `main` / root.
- **Codeberg Pages eller Forgejo:** lägg filerna i en `pages`-gren.
- **Netlify eller Cloudflare Pages:** koppla repot, inget byggkommando, publiceringsmapp `/`.

Typsnitten hämtas från Google Fonts. Utan nät syns reservtypsnitten.

## Bygg om kartan

```sh
cd tools/map
npm install
npm run build
node -e "const fs=require('fs'); fs.writeFileSync('../../data/map.js','window.MAPDATA='+fs.readFileSync('../../data/map.json','utf8')+';\\n')"
```

## Om siffrorna

- K<sub>d</sub> är de tryckta knutpunkterna i Jerlov, *Marine Optics* (1976), tabell XXVII. Mellan knutpunkterna är kurvan rätlinjig. Kusttyperna heter 1C–9C i tabellen och 1–9 på sidan.
- Blandningsmodellen är en pedagogisk summa av rent vatten, gult ämne, plankton och en grå partikeldämpning. Den är inte en inversion av tabellen.
- Brytningsindex 1,34 är ett typiskt värde för havsvatten i synligt ljus. Sötvatten ligger närmare 1,333.
- Vattentyperna på kartan är typiska värden ur litteraturen, inte satellitmätningar.
- Albatross rutt är ritad mellan kända hamnar.
- Undervattensscenerna är illustrationer. Sikten är tumregeln 4,8 delat med en stråldämpning satt till 4,5 gånger K<sub>d</sub>.

## Licenser

Koden är MIT, se `LICENSE`. Texterna i `index.html` och `content/` är CC BY 4.0.

- Kartdata: Natural Earth (public domain) via `world-atlas` (ISC).
- Typsnitt: Newsreader och IBM Plex (SIL Open Font License).
