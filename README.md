# Pain Tracker

Český lokální deník bolestí, léků a jídel. React + TypeScript + Vite.

## Vývoj

```sh
npm install
npm run dev
```

Port 5180. Test na domácí Wi-Fi: `npm run dev -- --host 0.0.0.0`.

```sh
npm run build
npm run lint
node --test tests/food-parser.test.mjs
```

Před spuštěním a sestavením skript stáhne přes HTTPS připnutou verzi PDF.js 5.4.394 a licenci do ignorované složky public/pdfjs. Veřejný web pak knihovnu i worker poskytuje ze stejné adresy jako aplikaci. Prohlížeč neposílá importované PDF na server. První spuštění/sestavení vyžaduje internet a dostupnost CDN jsDelivr.

## Funkce

- Bolesti: začátek, konec, souhrnná intenzita a poznámka; léky, historie a úpravy.
- PDF export Kalorických tabulek: výběr souboru, náhled, jídla a rozepsané suroviny, datum a rozmezí kategorie.
- Překryvy importů se řeší po kategorii v rámci dne. Shodné seznamy se přeskočí. Změněné se zachovají, dokud uživatel nepotvrdí nahrazení celé kategorie. Pořadí položek není důležité, opakované stejné položky se zachovávají.
- Nerozpoznané řádky nebo nesouhlasící součty energie blokují uložení pro kontrolu.
- Originální PDF se uloží lokálně spolu s potvrzeným importem. Lze jej znovu stáhnout.
- Rozpoznání vajec a mléčných složek je pouze slovník výslovných názvů, nikoli kompletní analýza receptur ani odhad množství alergenů.

## Omezení a soukromí

IndexedDB: bolesti v pain-tracker, jídelníček v pain-tracker-food. Změna adresy/portu používá jiné úložiště. Bez synchronizace, serverového účtu či šifrování databáze. Používat v jedné kartě. Zálohy i PDF obsahují citlivá data a nesmějí do veřejného repozitáře.

JSON export bolestí/léků a jídel je zatím oddělený; jídelní JSON neobsahuje původní PDF. Obnovení není implementované. Původní soubory stáhněte zvlášť.

Zatím není analýza vztahu jídel k bolesti, ruční oprava surovin, OCR, potvrzování úplnosti dnů, nastavení intervalů ani plná offline PWA. Ikona na ploše sama o sobě neznamená offline podporu. Časy jídel jsou pouze intervalové odhady.

Při vývoji byl parser ověřen na textu vzorového PDF a anonymních syntetických testech. Celý PDF.js import, TypeScript sestavení a Safari je nutné ověřit v CI a na zařízení. Testovací PDF ani jeho text nejsou v repozitáři.
