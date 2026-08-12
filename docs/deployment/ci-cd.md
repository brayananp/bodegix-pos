# CI/CD

PR/push a `main`, `master` o `develop`: frozen install y `release:check`. PRs cancelan ejecución vieja;
production nunca se cancela. CI crea Build Output API, tar versionado, SBOM/licencias y evidencia.
`release:check` compila una vez; suites browser consumen ese mismo output.

Push exitoso a `main`/`master` activa `Deploy Vercel`: descarga artifact, despliega staged production,
ejecuta smoke; GitHub Environment `production` solicita aprobación; promociona mismo deployment y
ejecuta smoke contra `PRODUCTION_URL`. Fallo antes de promoción deja producción intacta. Fallo después
de promoción activa runbook rollback/forward-fix según impacto DB.
