# Bodegix Backup Format v1

Extensión: `.bodegix`. MIME: `application/octet-stream`. Tamaño máximo total: 128 MiB. Tamaño
máximo de manifiesto: 256 KiB.

## Gramática binaria

```text
BODEGIX_BACKUP_V1\n
<manifestByteLengthDecimal>\n
<manifest JSON UTF-8 exactamente manifestByteLength bytes>
<payload dexie-export-import sin base64>
```

No hay ZIP, base64 ni separador después del manifiesto: su longitud en bytes determina el inicio
del payload. La longitud debe ser un entero decimal positivo y seguro. El tamaño esperado final es
`payloadOffset + manifest.payload.byteLength`; menos bytes es truncamiento y más bytes son datos
adicionales inválidos.

El manifiesto Zod es estricto y contiene `formatName`, `formatVersion`, `createdAt`, `source`,
aplicación, base, instalación, payload, tablas ordenadas y `integrity.manifestSha256`. Los nombres de
tabla son únicos; conteos no negativos; hashes, 64 caracteres hexadecimales minúsculos.

Parsing: leer un probe pequeño para localizar los dos saltos de línea, validar límites, leer y
validar solo el manifiesto, comparar el tamaño total, verificar hash del manifiesto canónico y luego
hash del payload. Un formato futuro se rechaza antes de importar.
