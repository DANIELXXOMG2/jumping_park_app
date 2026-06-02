# Motion / HyperFrames compositions

Composicion de video HTML-first para el portfolio de Jumping Park.
Esta carpeta es **source of truth del producto**: no se renderiza, no se
sube a un CDN, no se hace marketing con renders de escenas inexistentes.

## Que incluye este slice (slice 1)

`composition/` es un proyecto HyperFrames minimo con una composicion
raíz de 4 escenas basada en capturas reales del producto:

1. **Kiosco &middot; Ingreso** - `screenshots/kiosk-ingreso.png`
2. **Admin &middot; Dashboard** - `screenshots/admin-dashboard.png`
3. **Admin &middot; Consentimientos** - `screenshots/admin-consents-list.png`
4. **Publico &middot; Consentimiento digital** - `screenshots/public-consentimiento-digital.png`

Cierra con un card honesto (`outro-card`) que dice que el portfolio esta
en construccion y que las escenas restantes se suman en otra iteracion.

Duracion total: 44.5s, sin narracion, sin musica, sin render MP4 en
este slice.

## Que queda pendiente (no esta en este slice)

Estas capturas todavia no estan en `docs/portfolio/screenshots/` y
por lo tanto no tienen escena en esta composicion:

- `kiosk-otp` (paso OTP con mensaje contextual)
- `kiosk-consentimiento` (firma y resumen legal)
- `kiosk-offline-success` (estado diferido / offline)
- cierre con `robots.txt` o `llms.txt` como evidencia de polish tecnico

Tampoco se incluye en este slice:

- narracion / TTS
- musica o bed sonoro
- render final a MP4 (`hyperframes render`)
- deploy o publicacion

## Validacion local

Desde la raiz del repo:

```bash
npx hyperframes lint    docs/portfolio/motion/composition
npx hyperframes validate docs/portfolio/motion/composition
npx hyperframes inspect  docs/portfolio/motion/composition
```

Estado actual esperado:

- `lint` &rarr; 0 errors, 0 warnings
- `validate` &rarr; 0 errors, contraste WCAG AA limpio
- `inspect` &rarr; 0 layout issues en los sample points

## Por que este slice se queda en lint / validate / preview

El render final (`hyperframes render`) depende de FFmpeg y de un Chrome
controlado por el CLI. En este slice no agregamos eso al alcance porque:

1. El slice es para validar estructura, timing y accesibilidad.
2. Cualquier cambio de marca, copy o escena deberia re-validarse, y no
   queremos invertir en un MP4 que se vuelve obsoleto rapido.
3. El preview en navegador (`hyperframes preview`) ya permite revisar la
   composicion interactiva sin gastar tiempo de render.

Cuando la composicion este estable (despues de incorporar las escenas
pendientes), se evalua pasar a `render` y publicar.

## Estructura de archivos

```
docs/portfolio/motion/
├── README.md            (este archivo)
├── demo-script.md       (timeline y notas narrativas)
└── composition/
    ├── index.html       (composicion raiz: 4 escenas + outro)
    ├── hyperframes.json (registry paths)
    ├── meta.json        (id, dimensiones, fps)
    └── assets/          (copia local de las 4 PNGs que usa la composicion)
```

## Por que las imagenes viven en `composition/assets/`

El CLI sirve `composition/` como raiz del proyecto y los navegadores
normalizan cualquier `..` que salga de ese root (404 sobre
`../../screenshots/...`). La fuente de verdad de las capturas sigue
siendo `docs/portfolio/screenshots/`. Si actualizas una captura, copia
la nueva en `composition/assets/` para que la composicion la vea.

## Convenciones que sigue la composicion

- Una sola composicion raiz (`jp-tour-slice-1`), sin sub-composiciones.
  Si la composicion crece, partir en sub-compos por escena.
- Cada imagen va en su propio `data-track-index` (1-4) para permitir el
  crossfade por superposicion. Las z-index explicitas en `style`
  determinan el orden visual (no usar `data-track-index` para layering).
- Cada titulo va en su propio track (5-8). El outro va en track 9.
- Solo `gsap.from(...)` para entradas. El unico `gsap.to(opacity 0)` es
  el fade-out de la ultima imagen y su titulo antes del outro.
- Sin `Math.random`, sin `Date.now`, sin fetches. Determinista.
- Sin tipografia con `@font-face` propia: se usa el sans-serif generico
  que el browser / renderer resuelve.
