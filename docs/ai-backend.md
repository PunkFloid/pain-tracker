# AI backend — pouze bezplatný provoz Groq Free + Workers Free

Požadavek uživatele: žádné platby, žádný placený fallback. Server nyní volá výhradně Groq Chat Completions přes https://api.groq.com/openai/v1/chat/completions s modelem openai/gpt-oss-20b. Název modelu ani cesta /openai/ neznamenají volání placeného OpenAI API. Původní adaptér a konfigurace OpenAI byly nahrazeny.

Tento commit nic nenasazuje, nevytváří účty a nevolá poskytovatele. AI_ENABLED=false a GROQ_FREE_TIER_CONFIRMED=false jsou výchozí hodnoty. Stávající Pages workflow Worker nenasazuje.

## Podmínky před aktivací

1. Ověřit, že Groq organizace skutečně používá Free plán a vybraný model v něm má bezplatnou kvótu. Neaktivovat placený plán, nevkládat platební metodu. Jestli účet zdarma nelze zprovoznit, zastavit postup.
2. Použít pouze Cloudflare Workers Free, bez placených doplňků a bez přechodu na Workers Paid.
3. V Groq Data Controls zkontrolovat a podle možností zapnout Zero Data Retention. Výchozí inferenční data Groq standardně neuchovává, ale výjimky pro spolehlivost a zneužití mohou mít retenci až 30 dní. Provozní metadata se uchovávají. Nepředpokládat nulové uchovávání jen proto, že jde o Free.
4. Nastavit níže uvedenou konfiguraci. Nasazení a první skutečné volání schválit odděleně.

Kód neumí z API klíče ověřit tarif. GROQ_FREE_TIER_CONFIRMED je ruční potvrzení konfigurace, nikoli automatické ověření účtu ani technická záruka ceny. Pokud někdo později změní účet na placený, tento přepínač tomu nezabrání. Změní-li se podmínky bezplatné služby, AI vypnout a nabídku znovu ověřit.

## Konfigurace

- ALLOWED_ORIGIN: přesný origin skutečné aplikace bez cesty /pain-tracker/.
- GROQ_API_KEY: pouze serverový secret. Nikdy VITE_ proměnná, repozitář nebo klíč vložený do frontendového balíčku.
- APP_AUTH_TOKEN: jiný náhodný token alespoň 32 znaků pro osobní endpoint. Není to Groq API klíč. Frontendový klient jej bude potřebovat pro autentizaci, ale nesmí být pevně vložený do veřejného balíčku.
- RATE_LIMITER: povinný binding; ověřit namespace_id vůči ostatním limiterům v účtu.
- GROQ_FREE_TIER_CONFIRMED: true teprve po ověření Free účtu.
- AI_ENABLED: true teprve po dokončení konfigurace a schválení služby.

Secrets nastavit v Cloudflare dashboardu jako Secret nebo přes Wrangler. Klíče a tokeny neposílat do chatu ani logů. Lokální .dev.vars a .env jsou ignorované.

## Chování při limitech a výpadku

Groq 429 se vrátí jako HTTP 429 s kódem groq_free_quota_exhausted. Žádné automatické opakování, změna modelu nebo placená záloha. Uložené rozklady a běžná aplikace mohou fungovat bez nových AI výsledků. Limit Workeru je 10 požadavků za 60 sekund v rámci Cloudflare lokality; není globální účetní limit. Free kvóty se mohou měnit.

## Soukromí a kvalita

Endpoint ověřuje autentizaci, origin, metodu, typ obsahu, povolená pole a 24 000 bajtů vstupu. CORS není náhrada autentizace. Posílá jen názvy jídel a známých surovin; citlivý text vložený přímo do názvu se také odešle. Bolesti, léky, množství, časy a poznámky nejsou součástí kontraktu. Kód neloguje těla, klíče ani odpovědi. Cloudové provozní záznamy mohou vznikat nezávisle.

Používá se striktní JSON schema a následná validace sdíleným parserem. Formát neověřuje pravdivost receptury. Všechny návrhy zůstávají odhady. Neúplný, odmítnutý nebo neplatný výstup se nepoužije. Timeout je 20 sekund, výstup maximálně 1600 completion tokenů.

Připojení frontendového klienta a zadání adresy/tokenu ještě není implementované. Reálné nasazení a kvalita českých rozkladů nejsou ověřené.

## Testy

Testy v tests/ai-worker.test.mjs používají falešného poskytovatele a jsou zahrnuté v prebuild. Testují i předání 429 bez opakování a odmítnutí bez potvrzení Free účtu. Nevolají Groq ani Cloudflare.

## Zdroje pro ověření před nasazením

- https://console.groq.com/docs/rate-limits
- https://console.groq.com/docs/structured-outputs
- https://console.groq.com/docs/your-data
- https://developers.cloudflare.com/workers/platform/pricing/
