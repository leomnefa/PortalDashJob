# Himalayas

## Overview
Job board de ofertas remotas. API pública de solo lectura, sin autenticación.

## Official Documentation
https://himalayas.app/api

## Authentication
Ninguna para búsqueda pública.

## Endpoints
```
GET https://himalayas.app/api/jobs?limit={n}&search={keywords}
```
La documentación pública menciona soporte de filtros adicionales (país, seniority,
employment type, company, timezone) que **no están implementados todavía** en este
conector — se suman cuando haya certeza del nombre exacto de cada query param (no
se pudo verificar contra la doc en vivo desde este entorno, ver Tests).

## Search
Implementado vía `search`/`limit`. Como el filtrado server-side por keyword no está
confirmado con certeza, el conector **también filtra client-side** sobre
título+tags+descripción como red de seguridad (`matchesKeywords` en
`packages/connectors/himalayas/src/index.ts`).

## Job Detail
No implementado (`getJob()` ausente) — el listado ya trae descripción completa.

## Application
`applyMode: "external"` — `applicationLink` de cada oferta apunta a la postulación
real (empleador o su ATS). No hay endpoint de submission en Himalayas.

## Application Questions
No aplica (SEARCH_ONLY).

## Application Status
No aplica (SEARCH_ONLY).

## Rate Limits
No documentados con certeza; la API menciona un máximo de ~20 jobs por request (se
respeta pidiendo de a `limit` acotado, sin loops agresivos de paginación todavía).

## Errors
`search()` lanza si la respuesta no es `ok`. `healthCheck()` no lanza — devuelve
`online/degraded/offline`.

## Capabilities
```
search             = true
applyAuto          = false
applyAssisted      = false
```
Clasificación: **SEARCH_ONLY**.

## Terms/Restrictions
**Importante:** Himalayas prohíbe explícitamente redistribuir sus ofertas hacia
ciertos terceros (Google Jobs, LinkedIn Jobs, Jooble, entre otros). Este proyecto
consume los datos para uso propio (búsqueda + tracking personal) y no los redistribuye
a ningún tercero — si en algún momento se agrega un feature de distribución/exportación
pública, hay que revisar esta restricción primero.

## Implementation Status
✅ Implementado (`packages/connectors/himalayas`). Campos `employmentType`,
`seniority` y `salary` estructurado quedan sin poblar: no se confirmó el nombre/forma
exacta de esos campos en la respuesta real de la API.

## Tests
`packages/connectors/himalayas/test/index.test.ts` — `fetch` mockeado con fixtures,
sin llamadas reales. **No se pudo probar contra la API en vivo** desde el entorno
donde se escribió este conector (egress de red restringido a un allowlist que no
incluye himalayas.app) — validar el mapeo de campos y los filtros documentados
(país/seniority/employment type/timezone) contra la doc oficial en un entorno con
red real antes de ampliar este conector.
