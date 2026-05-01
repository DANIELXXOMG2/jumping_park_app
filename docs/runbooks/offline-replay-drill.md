# Offline replay drill

Este drill prueba la promesa mas delicada del kiosk: aceptar un consentimiento sin red y reintentar sin duplicar el consecutivo ni crear dos consentimientos.

## Preconditions

- `OFFLINE_QUEUE_ENABLED=true`
- `NEXT_PUBLIC_OFFLINE_QUEUE_ENABLED=true`
- app reiniciada o redeploy aplicado
- ambiente con acceso a Firestore para revisar `consents` y `offline_sync`

No correr este drill en produccion con los flags por defecto apagados; primero habilitarlo de forma controlada en preview o staging.

## Flujo de prueba

1. Abrir el kiosk y completar el flujo hasta la pantalla de consentimiento.
2. Cortar conectividad del navegador o del dispositivo.
3. Firmar y enviar el consentimiento.
4. Confirmar que la UI informa exito diferido y no se cae.
5. Restaurar conectividad.
6. Esperar replay automatico o disparar retry manual si el operador lo necesita.

## Verificaciones esperadas

- existe un solo consentimiento final en `consents`;
- existe `offline_sync/{dedupeKey}` para esa operacion;
- reintentar el mismo payload no crea un segundo consentimiento;
- el consecutivo reservado coincide con el ack final;
- el item de cola sale de `pending/failed` hacia estado resuelto.

## Datos a capturar

- `dedupeKey`
- timestamp local de firma (`signedAtLocal`)
- ID del consentimiento final
- consecutivo final
- mensaje visible al operador

## Fallas comunes

| Sintoma | Lectura tecnica | Accion |
| --- | --- | --- |
| el item queda en `failed` | error de red o payload invalido | revisar `lastError`, reintentar con red estable |
| aparecen dos consentimientos | fallo de idempotencia | desactivar `OFFLINE_QUEUE_ENABLED` y `NEXT_PUBLIC_OFFLINE_QUEUE_ENABLED`, luego abrir incidente |
| no existe `offline_sync` | el replay no llego al ledger | revisar API `/api/consentimientos` y `consentService` |

## Salida del drill

Registrar resultado como `PASS` o `FAIL` junto con:

- ambiente
- operador
- dedupeKey
- evidencia de `consents`
- evidencia de `offline_sync`
