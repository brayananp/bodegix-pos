# Releases

Versión app viene de `package.json`; tag manual `v<version>`. Commit viene de CI/Vercel/git. Timestamp
determinista usa `BUILD_TIMESTAMP`, `SOURCE_DATE_EPOCH` o fecha del commit. Artifact:
`bodegix-pos-<version>-<sha7>.tar.gz`.
CI adjunta checksum SHA-256, SBOM, release metadata y reportes; nunca datos de usuario. Node 24.14.1 y
pnpm 11.20.0 quedan fijados.
Attestation GitHub queda pendiente hasta confirmar soporte/plan del repositorio; no bloquea release.
Checksum y SBOM cubren baseline sin mutar artifact después de generarlo.

`release.json` publica versión, commit, builtAt, schema DB, backup format, mínimo compatible, impacto DB
y permiso de rollback. No contiene secretos. Schema y backup format vienen de constantes de código;
impacto/política vienen de `release.config.json`. Notas identifican artifact y deployment. Producción
promociona bytes probados, no reconstruye.
