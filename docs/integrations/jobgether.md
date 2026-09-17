# Jobgether

## Overview
Plataforma agregadora de trabajo remoto (~200k ofertas listadas). **No tiene API
pública oficial propia** — investigado antes de implementar nada, siguiendo la regla
del proyecto de no inventar integraciones sin verificar documentación oficial primero.

## Official Documentation
Ninguna encontrada. `jobgether.com` no publica un endpoint JSON/REST propio ni un
developer portal.

## Authentication
No aplica — no hay API propia.

## Endpoints
No aplica.

## Search / Job Detail / Application / Application Questions / Application Status
No aplica — sin API, no hay nada que integrar del lado de Jobgether.

## Rate Limits / Errors
No aplica.

## Capabilities
```
search        = UNKNOWN (no viable sin scraping)
applyAuto     = false
applyAssisted = false
```
Clasificación: **NO INTEGRABLE** (por ahora) — no `SEARCH_ONLY` ni ningún otro nivel de
la matriz, porque no hay una fuente de datos oficial que consumir.

## Terms/Restrictions
Lo único que existe hoy es un scraper de terceros en Apify
(`automation-lab/jobgether-remote-jobs-scraper` y similares) que:
- Scrapea el sitio de Jobgether — no es una API que Jobgether ofrezca u oficialice.
- Requiere cuenta de Apify + API token pago, cobrando por cada resultado devuelto.
- No hay garantía de que Jobgether autorice esa redistribución de sus datos.

Se decidió **no** envolver ese scraper de terceros como "conector Jobgether": rompería
el patrón de los otros 5 conectores (API oficial gratuita, sin auth, del mismo dueño
de los datos) y agregaría una dependencia paga y una fuente de datos de legitimidad
incierta.

## Implementation Status
❌ **No implementado, a propósito.** Si en el futuro Jobgether publica una API
oficial, o si el usuario decide explícitamente pagar por scraping vía Apify o
construir un scraper propio de `jobgether.com` (ambas opciones evaluadas y
descartadas por ahora), retomar desde acá.

## Tests
No aplica — no hay código que testear.
