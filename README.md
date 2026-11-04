# Pain Tracker 0.1

Osobní deník bolestí hlavy a užití léků. React + TypeScript + Vite.

## Spuštění

```sh
npm install
npm run dev
```

Port je definován v existujícím vite.config.ts (5180).

## Kontrola

```sh
npm run build
npm run lint
```

## Funkce

- Začátek a konec bolesti nyní nebo zpětně, souhrnná intenzita 0–10, poznámka.
- Léky: název, volitelná síla z obalu, počet kusů, čas, vazba na bolest.
- Historie, úpravy, mazání s potvrzením. Smazání bolesti ponechá její léky jako samostatné záznamy.
- IndexedDB a export úplné JSON zálohy.
- Časové překryvy epizod a budoucí časy jsou odmítnuty.

## Zatím není implementováno

Import PDF, evidence jídel, analýza, obnovení zálohy, průběžná křivka intenzity, instalovatelná/offline PWA, synchronizace, šifrování databáze a doporučení dávkování.

## Soukromí

Data jsou v prohlížeči, neposílají se na server. Změna domény nebo portu používá jiné úložiště. Vymazání dat webu může záznamy odstranit. Používejte jen jednu kartu aplikace; souběžné úpravy ve více kartách nejsou podporované. JSON zálohy obsahují citlivé údaje a nepatří do GitHubu. Polovina kusu je pouze evidenční údaj, nikoli pokyn k dělení přípravku.

## Ruční test

1. Založte testovací bolest a přidejte testovací užití léku.
2. Obnovte stránku a ověřte zachování záznamů.
3. Ukončete bolest a upravte poznámku v historii.
4. Ověřte odmítnutí konce před začátkem.
5. Exportujte JSON a ověřte obsah pains a medications.
6. Smažte testovací záznamy.

Zdrojový kód před nahráním nebyl spuštěn v Node ani ověřen na iPhonu. Build, lint a funkční kontrolu proveďte lokálně.
