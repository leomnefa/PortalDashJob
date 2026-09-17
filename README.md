# remote-job-hub

Plataforma modular para centralizar la búsqueda de trabajo remoto: un motor central
(perfil + generador de CV/carta a medida + tracker de postulaciones tipo CRM) al que se
le van sumando **conectores** por plataforma. Cada conector declara qué puede hacer
(buscar, postular automático, o solo asistir) para que el motor sepa cómo tratarlo.

## Arquitectura

```
packages/
  core/                     tipos (Profile, JobListing, Application), generador de CV/carta,
                             tracker de postulaciones (JSON local)
  connectors/
    remotive/                conector Nivel 1 (API pública, sin auth)
    himalayas/                conector Nivel 1 (API pública, sin auth)
  cli/                      interfaz de línea de comandos: buscar, generar CV a medida
                             y postular, trackear estado
```

Un **conector** implementa la interfaz `Connector` de `packages/core`:

```ts
interface Connector {
  id: string;
  name: string;
  capabilities: { search: boolean; applyAuto: boolean; applyAssisted: boolean };
  search(query: SearchQuery): Promise<JobListing[]>;
}
```

`capabilities` es lo que le permite al motor (y a futuro, a la UI) tratar cada plataforma
distinto: una con `applyAuto: true` puede postular sola, una con solo `search: true`
alimenta el buscador pero la postulación queda en modo asistido (el motor arma CV +
carta, vos hacés clic para mandarla).

## Matriz de plataformas

| Nivel | Plataforma | search | applyAuto | Notas |
|---|---|---|---|---|
| 1 — API pública libre | **Remotive** ✅ implementado | ✅ | ❌ | Sin auth. El delay del free tier es de 24hs. |
| 1 — API pública libre | **Himalayas** ✅ implementado | ✅ | ❌ | Sin auth. El filtrado por keyword server-side no está garantizado; el conector filtra client-side como red de seguridad. |
| 1 — API pública libre | Arbeitnow, RemoteOK, Jobicy | pendiente | ❌ | Mismo patrón que Remotive/Himalayas, foco Europa/remoto. |
| 2 — API con key gratis | Adzuna | pendiente | ❌ | Requiere `app_id`/`app_key` gratis, ~1000 llamadas/mes. |
| 3 — ATS por empresa | Greenhouse, Lever, Ashby | pendiente | a veces, depende de cada empresa | Cada board es una empresa distinta; hay que verificar caso por caso si expone apply por API. |
| 4 — Solo asistido (sin API pública) | LinkedIn, Indeed, WeWorkRemotely, Jobot, Workana, Upwork | ❌ | ❌ | **A propósito no se automatiza.** No tienen API pública de postulación para individuos, y automatizarlo por scraping/browser-bot viola sus Términos de Servicio y puede marcar la cuenta como fraudulenta. El motor puede generar igual el CV/carta a medida para copiar y pegar. |

## Cómo correrlo

Requiere Node.js 20+.

```bash
npm install
npm run build
npm test

cp data/profile.example.json data/profile.json
# completá data/profile.json con tus datos reales (no se versiona)

npm run cli -- search backend node --limit 20
npm run cli -- apply 0          # genera CV + carta a medida para el resultado [0], guarda en data/output/
npm run cli -- track            # lista tus postulaciones y su estado
npm run cli -- track status <id> submitted
```

`data/` completo (perfil, postulaciones, CVs generados) está en `.gitignore`: son tus
datos personales, no se commitean.

## Cómo agregar un conector nuevo

1. `packages/connectors/<nombre>/` con `package.json`, `tsconfig.json` y `src/index.ts`
   que exporte `create<Nombre>Connector(opts): Connector`, siguiendo el patrón de
   `remotive`/`himalayas` (inyectar `fetchImpl` para poder testear con mocks).
2. Mapear la respuesta de la API al tipo `JobListing` de `@remote-job-hub/core`.
3. Declarar `capabilities` con honestidad: si la plataforma no tiene endpoint de
   postulación público, `applyAuto` va en `false`.
4. Tests con `fetch` mockeado (ver `packages/connectors/*/test/index.test.ts`) — no hacen
   falta llamadas reales para el CI.
5. Registrar el conector en `packages/cli/src/context.ts` (`getConnectors`).
6. Sumar la fila correspondiente a la matriz de este README.

## Notas sobre las APIs de Nivel 1

Los conectores de Remotive y Himalayas están implementados contra la forma de
respuesta documentada/observada de cada API pública. El entorno donde se escribió este
scaffold tiene el egress de red restringido a un allowlist, así que **no se pudieron
probar las llamadas en vivo** desde acá — los tests unitarios usan fixtures mockeadas.
Antes de confiar en un conector en producción, corré `npm run cli -- search ...` desde
un entorno con salida a internet libre y confirmá que el mapeo de campos sigue vigente
(las APIs públicas gratuitas cambian de forma sin aviso).

## Generador de CV/carta a medida (v1)

Determinístico, sin LLM: extrae keywords del título/tags/descripción del aviso,
reordena tus skills y los bullets de experiencia por relevancia, e inserta el nombre
del puesto/empresa en el resumen y la carta. Es una base simple y barata de correr; el
próximo paso natural es un generador v2 basado en la API de Claude para reescritura más
rica (ver Roadmap).

## Roadmap

- Conectores Nivel 1 restantes: Arbeitnow, RemoteOK, Jobicy.
- Conector Adzuna (Nivel 2, requiere registrar API key).
- Conectores Nivel 3 por empresa puntual (Greenhouse/Lever/Ashby) a demanda, cuando
  aparezca una oferta concreta que lo permita.
- Generador de CV v2 con Claude API (tono, síntesis, adaptación de idioma).
- UI web sobre el mismo `core` (dashboard de postulaciones tipo kanban, edición de
  perfil, revisión del CV generado antes de exportarlo).
- Notificaciones (email/Telegram) cuando aparece un match nuevo.
