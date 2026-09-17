# Remote OK

## Overview
Job board de ofertas remotas. API pública de solo lectura, sin autenticación —
pero exige un `User-Agent` identificable o suele responder 403.

## Official Documentation
https://remoteok.com/api (sin portal de developer formal; comportamiento documentado
de forma informal/por convención de la comunidad, ver Tests).

## Authentication
Ninguna, pero requiere header `User-Agent` descriptivo
(`remote-job-hub (+https://github.com/vallejo-sanjuan/remote-job-hub)` en este
conector). Sin él, la API puede responder 403.

## Endpoints
```
GET https://remoteok.com/api
```
Devuelve un array donde **el primer elemento es un aviso legal**, no una oferta —
se descarta filtrando por `id !== undefined && position !== undefined`.

## Search
No hay parámetro de búsqueda server-side documentado — se trae el feed completo y se
filtra client-side con `filterByKeywords` (core).

## Job Detail
No implementado — el feed ya trae la descripción completa.

## Application
`applyMode: "external"` — se usa el campo `url` de cada oferta (o se arma un fallback
`remoteok.com/remote-jobs/{slug|id}` si faltara). No hay endpoint de submission.

## Application Questions / Status
No aplica (SEARCH_ONLY).

## Rate Limits
No documentados con certeza. Sin rate-limiting propio implementado todavía — el
`User-Agent` identificable es la única cortesía implementada por ahora.

## Errors
`search()` lanza si la respuesta no es `ok` (un 403 típicamente indica que falta o es
inválido el `User-Agent`). `healthCheck()` no lanza.

## Capabilities
```
search        = true
applyAuto     = false
applyAssisted = false
```
Clasificación: **SEARCH_ONLY**.

## Terms/Restrictions
No verificadas en detalle contra términos oficiales en vivo (ver Tests) — Remote OK no
tiene un portal de developer formal, así que el comportamiento (incluido el requisito
de `User-Agent`) está basado en convención observada, no en documentación oficial.

## Implementation Status
✅ Implementado (`packages/connectors/remoteok`). Popula `salary` estructurado
(`salary_min`/`salary_max`, moneda asumida `USD` porque el feed no la especifica por
oferta) solo cuando alguno de los dos valores es verdadero (evita inventar "$0" como
salario real). No mapea `employmentType`/`seniority`: el feed no los da con certeza.

## Tests
`packages/connectors/remoteok/test/index.test.ts` — `fetch` mockeado, incluye el caso
del elemento "aviso legal" al inicio del array. **No se pudo probar contra la API en
vivo** (egress de red restringido en el entorno donde se escribió este conector) —
confirmar el requisito de `User-Agent` y la forma exacta de la respuesta (nombres de
campo, moneda del salario) contra el comportamiento real antes de confiar en el
mapeo a largo plazo.
