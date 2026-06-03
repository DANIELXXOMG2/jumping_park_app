# Artifact manifest template

Usa este template para listar assets reales una vez capturados.

| Asset | Status | Source route/screen | Notes |
| --- | --- | --- | --- |
| kiosk-ingreso | ready | `/ingreso` | captured from production on 2026-06-02; reviewed before commit |
| kiosk-otp | ready | `/otp` | captured from local dev with `?captureSeed=...` seeder on 2026-06-03; reviewed before commit |
| kiosk-consentimiento | ready | `/consentimiento` | captured from local dev with `?captureSeed=...` seeder on 2026-06-03; DOM redaction active on signer name + UID; reviewed before commit |
| kiosk-offline-success | ready | `/exito?offline=1&nombre=Demo` | captured from local dev on 2026-06-03; `[QUERY-PARAM-OFFLINE]` — direct query-param navigation per `docs/portfolio/screenshots/README.md` |
| admin-dashboard | ready | `/admin` | captured from production on 2026-06-02 with DOM redaction active |
| admin-consents-list | ready | `/admin/consentimientos` | captured from production on 2026-06-02 with DOM redaction active |
| public-consentimiento-digital | ready | `/consentimiento-digital` | captured from production on 2026-06-02; reviewed before commit |
| robots-txt | pending | `/robots.txt` | texto completo legible |
| llms-txt | pending | `/llms.txt` | seccion citation guidance visible |
