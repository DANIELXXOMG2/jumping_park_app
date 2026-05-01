# Admin cost smoke checklist

El objetivo de este checklist es verificar que el admin realmente esta operando sobre el plano barato: cursores y agregados, no scans crecientes.

## Preconditions

- `CURSOR_PAGINATION_ENABLED=true` para smoke cursor-first
- `ADMIN_AGGREGATES_ENABLED=true` para smoke aggregate-first
- dataset suficiente para navegar mas de una pagina

## Users / Consents / Minors

### Cursor contract

- abrir la primera pagina con `limit=20` o `limit=50`;
- confirmar `pageInfo.hasNextPage` y `pageInfo.nextCursor` cuando existan mas datos;
- usar `nextCursor` para pedir la siguiente pagina;
- confirmar que no aparecen signed URLs en listados de consentimientos, solo `signatureStatus`.

### Search fallback

- ejecutar una busqueda por texto o identificador;
- confirmar `meta.source = search`;
- confirmar que el fallback sigue funcional aunque cursor este activo.

## Dashboard / stats

- llamar `/api/admin/stats` y `/api/admin/stats/detailed?period=month`;
- confirmar presencia de `freshness.computedAt`;
- confirmar que la fuente es agregada cuando el flag esta activo;
- si se usa `recompute=true`, validar que el refresh no rompe el contrato de respuesta.

## Heuristica de costo

No estamos midiendo billing real en CI, pero si podemos detectar las senales correctas:

- pagina admin: 20-50 items por request, no mas;
- dashboard: 1-5 documentos agregados, no scans completos;
- no enrichment de signed URLs por fila;
- busquedas acotadas por tokens/cursores, no listas completas salvo fallback controlado.

Si algun query exige un indice nuevo o distinto, no habilitar el flag: primero actualizar IaC y volver a validar contra emulator/query logs.

## Salida minima

- endpoint validado
- flags activos
- cursor recibido y reutilizado
- `freshness` observada
- conclusion: `PASS`, `PASS WITH NOTES`, o `FAIL`
