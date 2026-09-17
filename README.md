# remote-job-hub

Plataforma modular para centralizar la búsqueda de trabajo remoto: un motor central
(perfil + generador de CV/carta a medida + tracker de postulaciones tipo CRM) al que se
le van sumando **conectores** por plataforma. Cada conector declara qué puede hacer
(buscar, postular automático, o solo asistir) para que el motor sepa cómo tratarlo.

Dos formas de usarlo, sobre el mismo `core`:

- **CLI zero-config** (`packages/cli`): guarda todo en JSON local (`data/`), no
  necesita base de datos. Pensada para uso personal desde tu máquina.
- **API + dashboard web** (`packages/api` + `packages/web`): persiste en SQL Server,
  pensada como el servicio "real" si esto crece más allá de un uso individual desde
  la terminal.

## Arquitectura

```
packages/
  core/            tipos de dominio (NormalizedJob, Application, Profile),
                    ConnectorRegistry, dedup, generador de CV/carta, stores
                    (JsonApplicationStore para la CLI)
  db/              persistencia SQL Server (mssql): schema, migrate, SqlJobStore,
                    SqlApplicationStore — usados por la API y opcionalmente por la CLI
  connectors/
    remotive/       conector Nivel 1 (API pública, sin auth) — ver docs/integrations/
    himalayas/      conector Nivel 1 (API pública, sin auth) — ver docs/integrations/
  cli/             búsqueda + postulación + tracking por línea de comandos
  api/             servidor HTTP (Fastify) sobre core+db+connectors
  web/             dashboard (React + Vite) que consume la API
docs/
  integrations/    un .md por conector con su contrato real (auth, rate limits,
                    capabilities, qué se pudo verificar y qué no)
```

Un **conector** implementa la interfaz `Connector` de `packages/core`:

```ts
interface Connector {
  id: string;
  name: string;
  capabilities: { search: boolean; applyAuto: boolean; applyAssisted: boolean };
  search(query: SearchQuery): Promise<JobListing[]>;
  getJob?(sourceJobId: string): Promise<JobListing | undefined>;
  submitApplication?(sourceJobId: string, application: {...}): Promise<{...}>;
  healthCheck(): Promise<ConnectorHealth>;
}
```

`capabilities` es lo que le permite al motor (y al dashboard) tratar cada plataforma
distinto: una con `applyAuto: true` puede postular sola, una con solo `search: true`
alimenta el buscador pero la postulación queda en modo asistido (el motor arma CV +
carta, vos hacés clic para mandarla). `getJob`/`submitApplication` son opcionales a
propósito — no se implementan hasta que una fuente concreta lo soporte de verdad.

## Matriz de plataformas

| Nivel | Plataforma | search | applyAuto | Notas |
|---|---|---|---|---|
| 1 — API pública libre | **Remotive** ✅ implementado | ✅ | ❌ | Sin auth. Delay del free tier: 24hs. Ver `docs/integrations/remotive.md`. |
| 1 — API pública libre | **Himalayas** ✅ implementado | ✅ | ❌ | Sin auth. Prohíbe redistribuir sus ofertas a ciertos terceros (Google Jobs, LinkedIn Jobs, Jooble). Ver `docs/integrations/himalayas.md`. |
| 1 — API pública libre | Arbeitnow, RemoteOK, Jobicy, Jobgether | pendiente | ❌ | Mismo patrón que Remotive/Himalayas. |
| 2 — API con key gratis | Adzuna | pendiente | ❌ | Requiere `app_id`/`app_key` gratis, ~1000 llamadas/mes. |
| 3 — ATS por empresa | Greenhouse, Lever, Ashby, SmartRecruiters | pendiente | a veces, depende de cada empresa | Cada board es una empresa distinta; el `POST` de aplicación existe en algunas (Greenhouse/Lever) pero requiere una API key **emitida por esa empresa puntual** — no hay una key genérica del ecosistema. |
| 4 — ATS enterprise, requiere descubrimiento | Workday, Recruitee, BambooHR, Personio, Teamtailor, Breezy, Pinpoint, Workable | pendiente | `UNKNOWN` hasta investigar cada uno | Sin asumir que existe apply universal; Workday en particular es por tenant. |
| 5 — Freelance marketplaces con OAuth | Upwork, Freelancer | pendiente | requiere que **vos** registres y aprueben una app en su developer portal | El código puede quedar listo para recibir `CLIENT_ID`/`CLIENT_SECRET` por env var, pero el alta es un trámite manual de cada plataforma, no algo que el código resuelva solo. |
| 6 — Solo asistido (sin API pública para individuos) | LinkedIn, Indeed, WeWorkRemotely, Jobot, Workana | ❌ | ❌ | **A propósito no se automatiza.** Automatizar postulación acá por scraping/browser-bot viola sus Términos de Servicio y puede marcar la cuenta o el perfil como fraudulento ante el empleador. El motor arma igual el CV/carta a medida para copiar y pegar. |

## Cómo correrlo

Requiere Node.js 20+.

```bash
npm install
npm run build
npm test

cp data/profile.example.json data/profile.json
# completá data/profile.json con tus datos reales (no se versiona)
```

### Modo CLI (zero-config, JSON local)

```bash
npm run cli -- search backend node --limit 20
npm run cli -- apply 0          # genera CV + carta a medida para el resultado [0], guarda en data/output/
npm run cli -- track            # lista tus postulaciones y su estado
npm run cli -- track status <id> submitted
```

### Modo API + dashboard (SQL Server)

```bash
cp .env.example .env
# completá DB_HOST/DB_USER/DB_PASSWORD/DB_NAME con tus credenciales reales (no se versiona)

npm run api            # levanta el servidor en :3100 (o $PORT), corre las migraciones al arrancar
npm --workspace @remote-job-hub/web run dev   # dashboard en :5173, proxya /api hacia :3100
```

Si `DB_HOST/DB_USER/DB_PASSWORD/DB_NAME` no están en `.env`, la CLI sigue funcionando
con el store JSON local sin ningún cambio — el modo API sí requiere la base (falla al
arrancar con un mensaje claro si no está configurada).

**Seguridad de las credenciales de DB:**
- `.env` está en `.gitignore` — nunca lo commitees. Si una contraseña de DB llegó a
  pegarse en un chat, un ticket o un log en algún momento, tratala como comprometida y
  rotala.
- No uses el usuario `sa` para la app: creá un login dedicado con permisos acotados
  (`db_datareader`/`db_datawriter` sobre la base de este proyecto nada más). `sa`
  expuesto a internet es uno de los vectores de entrada más comunes para ransomware
  contra SQL Server.
- Confirmá que el firewall de la instancia solo acepta conexiones desde las IPs que
  vos controlás.

`data/` completo (perfil, postulaciones/JSON, CVs generados) está en `.gitignore`: son
datos personales, no se commitean.

## Cómo agregar un conector nuevo

1. `packages/connectors/<nombre>/` con `package.json`, `tsconfig.json` y `src/index.ts`
   que exporte `create<Nombre>Connector(opts): Connector`, siguiendo el patrón de
   `remotive`/`himalayas` (inyectar `fetchImpl` para poder testear con mocks).
2. Mapear la respuesta de la API al tipo `JobListing` (`NormalizedJob`) de
   `@remote-job-hub/core`. No inventar `employmentType`/`seniority`/`salary`
   estructurado si la fuente no los da con certeza — dejarlos `undefined`.
3. Declarar `capabilities` con honestidad: si la plataforma no tiene endpoint de
   postulación público y verificado, `applyAuto` va en `false`.
4. Implementar `healthCheck()`.
5. Tests con `fetch` mockeado (ver `packages/connectors/*/test/index.test.ts`) — no
   hacen falta llamadas reales para el CI.
6. Registrar el conector en `getRegistry()` (`packages/cli/src/context.ts` y
   `packages/api/src/context.ts`).
7. Escribir `docs/integrations/<nombre>.md` con la plantilla usada en
   `remotive.md`/`himalayas.md` (Overview/Auth/Endpoints/Search/Application/Rate
   Limits/Capabilities/Terms/Implementation Status/Tests).
8. Sumar la fila correspondiente a la matriz de este README.

## Validación pendiente (red bloqueada en el entorno donde se escribió esto)

Este scaffold se escribió en un entorno con el egress de red restringido a un
allowlist (no llega ni a las APIs de trabajo ni a la IP:puerto de la SQL Server). Lo
que sí se validó acá:

- `npm test` (24 tests: core, conectores con `fetch` mockeado, `packages/db` con un
  pool de SQL Server simulado que interpreta las queries reales).
- Build completo (`npm run build`) y build de producción del dashboard (`vite build`).
- El server de API falla rápido y con mensaje claro tanto sin `.env` como con
  credenciales que apuntan a una DB inalcanzable (no cuelga).
- El dashboard levantado con Playwright: navegación entre tabs, formulario de
  búsqueda, y manejo prolijo de errores de backend (sin pantalla en blanco).

Lo que **falta validar en un entorno con red real** (tu máquina, o donde esto se
despliegue):
- Los conectores Remotive/Himalayas contra las APIs en vivo (mapeo de campos puede
  haber cambiado).
- La conexión real a la SQL Server y las migraciones (`schema.sql` vía `migrate()`).
- El flujo end-to-end completo: buscar → preparar postulación → verla en el dashboard.

## Generador de CV/carta a medida (v1)

Determinístico, sin LLM: extrae keywords del título/tags/descripción del aviso,
reordena tus skills y los bullets de experiencia por relevancia, e inserta el nombre
del puesto/empresa en el resumen y la carta. Es una base simple y barata de correr; el
próximo paso natural es un generador v2 basado en la API de Claude para reescritura más
rica (ver Roadmap).

## Roadmap

- Conectores Nivel 1 restantes: Arbeitnow, RemoteOK, Jobicy, Jobgether.
- Conector Adzuna (Nivel 2, requiere registrar API key).
- Conectores Nivel 3 por empresa puntual (Greenhouse/Lever/Ashby/SmartRecruiters) a
  demanda, cuando aparezca una oferta concreta que lo permita y con una API key propia
  de esa empresa.
- Descubrimiento automático de ATS por dominio de empresa (`empresa.com/careers` →
  detectar Greenhouse/Lever/etc.) — Fase avanzada, no antes de tener varios conectores
  ATS sólidos.
- OAuth para Upwork/Freelancer (requiere que registres la app vos en sus developer
  portals — el código queda listo para recibir las credenciales).
- Motor de matching con IA (`JobMatchingService`): score de compatibilidad explicable
  contra el perfil, no solo keyword-overlap.
- Generador de CV v2 con Claude API (tono, síntesis, respuesta a preguntas de
  postulación basada en `CandidateAnswers`, sin inventar información).
- Browser-assisted application (Workday y similares) — solo cuando el resto del core
  esté sólido; nunca saltea CAPTCHA/MFA, siempre pide intervención humana cuando hace
  falta.
- Notificaciones (email/Telegram) cuando aparece un match nuevo.
- Agente autónomo + MCP tools (`search_jobs`, `analyze_job`, `prepare_application`,
  etc.) una vez que el resto de las fases estén maduras.
