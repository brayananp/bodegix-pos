# Arquitectura de deployment

```text
Git → GitHub Actions → artifact validado → Vercel staged production → producción

Browser
├── Cache Storage → shell/recursos PWA
└── IndexedDB     → datos comerciales locales
```

CI produce una sola vez `.vercel/output`. Staging despliega con `--prebuilt --prod --skip-domain`;
producción promociona mismo deployment, sin rebuild. Hosting nunca recibe IndexedDB o backups.
