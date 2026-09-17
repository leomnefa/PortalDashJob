# Arbeitnow

## Overview
Job board enfocado en Europa/remoto. API pública de solo lectura, sin autenticación.

## Official Documentation
https://www.arbeitnow.com/api/job-board-api

## Authentication
Ninguna.

## Endpoints
```
GET https://www.arbeitnow.com/api/job-board-api
```
Paginado (`data`/`links`/`meta` estilo Laravel), pero **no se implementó paginación
todavía** — solo se pide la primera página. Sumar paginación cuando haga falta más
volumen que eso.

## Search
**No hay parámetro de búsqueda por keyword server-side documentado** — la API solo
pagina el feed completo, más reciente primero. `search()` trae la página y filtra
client-side con `filterByKeywords` (core), igual que Himalayas.

## Job Detail
No implementado — el listado ya trae la descripción completa.

## Application
`applyMode: "external"` — el campo `url` de cada oferta es la página de Arbeitnow,
que a su vez linkea a la postulación real. No hay endpoint de submission.

## Application Questions / Status
No aplica (SEARCH_ONLY).

## Rate Limits
No documentados con certeza. Sin rate-limiting propio implementado todavía.

## Errors
`search()` lanza si la respuesta no es `ok`. `healthCheck()` no lanza.

## Capabilities
```
search        = true
applyAuto     = false
applyAssisted = false
```
Clasificación: **SEARCH_ONLY**.

## Terms/Restrictions
No verificadas en detalle contra la doc oficial en vivo (ver Tests) — revisar antes de
cualquier uso que redistribuya estos datos a terceros.

## Implementation Status
✅ Implementado (`packages/connectors/arbeitnow`). Mapea `job_types[0]` a
`employmentType` solo para los valores que coinciden con nuestro enum
(`full_time`/`part_time`/`contract`/`internship`); no inventa `seniority` ni salario
estructurado porque la fuente no los da.

## Tests
`packages/connectors/arbeitnow/test/index.test.ts` — `fetch` mockeado con fixtures,
sin llamadas reales. **No se pudo probar contra la API en vivo** (egress de red
restringido en el entorno donde se escribió este conector) — validar el mapeo de
campos y confirmar si existe algún parámetro de búsqueda server-side antes de asumir
que no lo hay.
