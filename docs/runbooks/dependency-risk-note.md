# Dependency risk note

## Estado actual

Fecha de referencia: `2026-04-06`

- `next` se actualizo de `16.0.7` a `16.2.2` para sacar del gate las vulnerabilidades directas reportadas por `bun audit`.
- `firebase` se actualizo de `12.6.0` a `12.11.0` y `firebase-admin` de `13.6.0` a `13.7.0` como upgrade directo de bajo riesgo.
- Resultado actual: `bun audit` ya no reporta vulnerabilidades en dependencias runtime directas, pero SI mantiene riesgo residual transitive/tooling. Ese es el estado vigente que tienen que repetir `docs/README.md` y `docs/runbooks/production-hardening.md`, sin reinterpretarlo.

## Riesgo residual aceptado por ahora

### Runtime transitivo

- `node-forge`, `jws` y `@tootallnate/once` siguen entrando por el arbol de `firebase-admin` / `@google-cloud/storage`.
- No se aplico override manual sobre esos paquetes en esta fase para evitar forzar combinaciones no validadas en la cadena Firebase/Admin SDK.

### Tooling / CI transitivo

- `smol-toml` via `knip`
- `ajv`, `brace-expansion`, `minimatch`, `flatted` via `eslint`
- `picomatch` via `dependency-cruiser`, `knip`, `eslint-config-next` y `jscpd`

Estos hallazgos afectan principalmente tooling de desarrollo/CI, no el runtime productivo servido a usuarios.

## Mitigaciones activas

- CI ahora bloquea si `bun audit` vuelve a reportar una vulnerabilidad en una dependencia directa (`(direct dependency)`).
- El job de audit sigue mostrando el reporte completo para no ocultar deuda transitive/tooling.
- Los upgrades pendientes deben intentarse primero via releases oficiales upstream; evita overrides agresivos salvo reproduccion controlada y verificacion dedicada.

## Proximo paso recomendado

1. Revisar releases de `firebase-admin` / `@google-cloud/storage` y retirar este riesgo residual apenas upstream publique rangos parchados.
2. Re-evaluar si conviene separar tooling vulnerable en jobs no bloqueantes o moverlos a versiones mayores en una fase dedicada de mantenimiento.
3. Mantener `bun audit` registrado en verify/apply mientras exista este runbook.
