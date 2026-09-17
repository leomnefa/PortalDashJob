# Remotive

## Overview
Job board de ofertas 100% remotas. API pública de solo lectura, sin autenticación.

## Official Documentation
https://remotive.com/api/remote-jobs (endpoint documentado en https://remotive.com/remote-jobs/api)

## Authentication
Ninguna para el endpoint público. Existe un tier privado/pago con datos en tiempo real
(el público tiene ~24hs de delay) — no usado en esta implementación.

## Endpoints
```
GET https://remotive.com/api/remote-jobs?search={keywords}&limit={n}
```

## Search
Soportado vía query params `search` y `limit`. Implementado en
`packages/connectors/remotive/src/index.ts`.

## Job Detail
No hay endpoint de detalle por id separado — el listado ya trae la descripción
completa. `getJob()` no está implementado (no hace falta).

## Application
`applyMode: "external"` — cada oferta trae su propia `url` de postulación externa
(la del empleador o su ATS). No hay endpoint de submission en Remotive.

## Application Questions
No aplica (SEARCH_ONLY).

## Application Status
No aplica (SEARCH_ONLY).

## Rate Limits
No documentados públicamente para el tier gratuito. No se implementó rate-limiting
propio todavía — pendiente si se observan 429 en uso real.

## Errors
`search()` lanza si la respuesta no es `ok` (incluye status HTTP). `healthCheck()`
hace un request liviano (`limit=1`) y nunca lanza — devuelve `online/degraded/offline`.

## Capabilities
```
search             = true
applyAuto          = false
applyAssisted      = false   (queda en false porque el motor arma el CV/carta igual,
                               sin necesidad de una capability específica por ahora)
```
Clasificación: **SEARCH_ONLY**.

## Terms/Restrictions
Respetar atribución y condiciones de uso de Remotive; no redistribuir los datos hacia
terceros donde esté prohibido (no verificado en detalle todavía — pendiente antes de
cualquier redistribución pública de estos datos).

## Implementation Status
✅ Implementado (`packages/connectors/remotive`). Mapea `job_type` a `employmentType`
cuando el valor es reconocido; no inventa `seniority` ni `salary` estructurado porque
la fuente no los da con certeza.

## Tests
`packages/connectors/remotive/test/index.test.ts` — `fetch` mockeado, sin llamadas
reales. **No se pudo probar contra la API en vivo** desde el entorno donde se escribió
este conector (egress de red restringido); validar en un entorno con red real antes de
confiar en el mapeo de campos a largo plazo.
