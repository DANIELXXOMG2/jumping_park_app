# Artifact manifest template

Usa este template para listar assets reales una vez capturados.

| Asset | Status | Source route/screen | Notes |
| --- | --- | --- | --- |
| kiosk-ingreso | ready | `/ingreso` | captured from production on 2026-06-02; reviewed before commit |
| kiosk-otp | pending | `/otp` | blocked: production route showed fallback guidance, not a truthful OTP state |
| kiosk-consentimiento | pending | `/consentimiento` | blocked: likely real signer / signature / minor PII |
| admin-dashboard | ready | `/admin` | captured from production on 2026-06-02 with DOM redaction active |
| admin-consents-list | ready | `/admin/consentimientos` | captured from production on 2026-06-02 with DOM redaction active |
| public-consentimiento-digital | ready | `/consentimiento-digital` | captured from production on 2026-06-02; reviewed before commit |
| robots-txt | pending | `/robots.txt` | texto completo legible |
| llms-txt | pending | `/llms.txt` | seccion citation guidance visible |
