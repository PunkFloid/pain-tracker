# AI backend — připravený kód, ne nasazená služba

Frontend zůstává na GitHub Pages. Samostatný Cloudflare Worker přijímá POST /ingredients a používá OpenAI Responses API. Tento commit nic nenasazuje, nevytváří účty a neprovádí AI požadavky. Výchozí AI_ENABLED=false znamená HTTP 503 bez volání poskytovatele.

## Konfigurace před případným nasazením

Vyžaduje schválení poskytovatelů a jejich případných nákladů. Cloudflare účet a OpenAI API projekt s dostupným modelem podporujícím Structured Outputs jsou samostatné služby; předplatné chatové aplikace zde nepovažujeme za API přístup. Model není vybraný ani cenově odhadnutý.

- ALLOWED_ORIGIN: přesný origin skutečné aplikace, bez cesty /pain-tracker/.
- OPENAI_MODEL: explicitně zvolený dostupný model.
- OPENAI_API_KEY: pouze serverový secret, nikdy frontendová VITE_ proměnná.
- APP_AUTH_TOKEN: jiný náhodný token alespoň 32 znaků, pouze pro přístup k osobnímu endpointu. Není to klíč OpenAI. Budoucí frontend jej bude potřebovat pro autentizaci; nesmí být zabudovaný do veřejného balíčku.
- RATE_LIMITER: povinný binding. Před nasazením ověřit, že namespace_id nekoliduje s jiným limiterem v účtu.
- AI_ENABLED: zapnout až po nastavení a schválení služby.

Secrets se nastavují v Cloudflare dashboardu jako Secret nebo příslušným příkazem Wrangler. Nevkládat je do chatu, repozitáře, konfiguračního JSON ani logů. Soubory .dev.vars a .env jsou lokálně ignorované. Nasazení se provádí odděleně; stávající Pages workflow Worker nenasazuje.

## Ochrany a omezení

Endpoint kontroluje vlastní přístupový token, origin, metodu, typ obsahu, maximálně 24 000 bajtů vstupu a povolená pole. CORS není autentizace. Platný token je potřeba i pro klienta mimo prohlížeč. Limit 10 požadavků za 60 sekund je sdílený osobní limit v rámci Cloudflare lokality; není přesný globální limit ani záruka maximálních nákladů. Samostatně je nutné řešit dostupné kvóty a sledování nákladů u poskytovatele; upozornění na rozpočet nepovažovat za tvrdý strop.

Posílají se pouze hodnoty názvů jídel a známých surovin. Pokud uživatel vloží citlivý text přímo do názvu, bude součástí požadavku. Bolesti, léky, množství, časy konzumací a poznámky nejsou součástí kontraktu. store=false vypíná ukládání objektu Responses; není zárukou nulové retence poskytovatele. Kód neloguje těla požadavků, tokeny ani odpovědi. Cloudové provozní záznamy mohou vznikat nezávisle na tomto kódu.

Timeout je 20 sekund a výstup nejvýše 1600 tokenů. Neúplný nebo odmítnutý výstup se nepoužije. JSON schema kontroluje strukturu, nikoli pravdivost receptury. Odpověď znovu ověřuje sdílený parser a klient ji musí ověřit před uložením.

Připojení frontendového klienta a zadání endpointu/tokenu ještě není implementované. Reálné nasazení ani integrační volání poskytovatele nebyly tímto commitem ověřeny.

## Testy

Node testy s falešným poskytovatelem jsou v tests/ai-worker.test.mjs a patří do existujícího prebuild globu. Nevolají OpenAI ani Cloudflare.
