# Integridad de respaldos

Web Crypto calcula SHA-256 del payload binario y del núcleo del manifiesto serializado como JSON
canónico: objetos con claves ordenadas, arrays estables y solo valores JSON finitos. El hash del
manifiesto se almacena fuera de ese núcleo para evitar autorreferencia.

Esto detecta truncamiento, corrupción accidental, cambios en metadata, sustitución del payload y
bytes adicionales. No autentica al autor: no hay firma ni clave. Tampoco ofrece confidencialidad:
el archivo no está cifrado y debe guardarse en un medio controlado.

La aplicación valida primero límites de 128 MiB/256 KiB para contener memoria y rechaza objetos no
conformes antes de construir estructuras internas. No usa `Object.assign` con datos del archivo ni
valores externos como propiedades operativas. Los hashes no reemplazan el diagnóstico relacional en
la base temporal.
