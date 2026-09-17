# Jobicy

## Overview
Job board de ofertas remotas. API pública de solo lectura, sin autenticación.

## Official Documentation
https://jobicy.com/jobs-rss-feed (feed RSS oficial) y comportamiento observado del
endpoint JSON `v2` — no se pudo abrir la documentación viva del API v2 desde el
entorno donde se escribió este conector (ver Tests).

## Authentication
Ninguna.

## Endpoints
```
GET https://jobicy.com/api/v2/remote-jobs?count={n}&tag={tag}
```

## Search
`count` limita la cantidad de resultados. `tag` filtra por una única
categoría/etiqueta — **no está confirmado que sea full-text search** ni que soporte
múltiples keywords, así que se pasa como mejor esfuerzo (solo la primera keyword) y
el conector **igual filtra client-side** con `filterByKeywords` (core) sobre el
resultado, sea cual sea el comportamiento real de `tag`.

## Job Detail
No implementado — el listado ya trae `jobDescription`/`jobExcerpt`.

## Application
`applyMode: "external"` — el campo `url` de cada oferta apunta a la página de Jobicy
(que a su vez linkea a la postulación real). No hay endpoint de submission.

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
No verificadas en detalle contra términos oficiales en vivo (ver Tests).

## Implementation Status
✅ Implementado (`packages/connectors/jobicy`). Es el primer conector con **salario
estructurado real**: `annualSalaryMin`/`annualSalaryMax`/`salaryCurrency` se mapean a
`salary` con `period: "year"` (el nombre del campo fuente ya indica que es anual).
Mapea `jobType[0]` a `employmentType` solo si coincide con el enum
(`full-time`/`part-time`/`contract`/`freelance`/`internship`, normalizando el guion a
underscore). No mapea `seniority`: `jobLevel` es texto libre de la fuente
("Senior Level", etc.) y no hay certeza de un vocabulario estable para traducirlo sin
inventar. `pubDate` se parsea de forma defensiva — si no es una fecha válida, queda
`undefined` en vez de romper.

## Tests
`packages/connectors/jobicy/test/index.test.ts` — `fetch` mockeado, incluye el caso
de fecha de publicación inválida. **No se pudo probar contra la API en vivo** (egress
de red restringido en el entorno donde se escribió este conector) — confirmar el
comportamiento real de `tag`, el vocabulario de `jobLevel`/`jobType`, y el formato
real de `pubDate` contra la API viva antes de ampliar este conector.
