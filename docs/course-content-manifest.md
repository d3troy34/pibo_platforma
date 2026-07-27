# Manifiesto de materiales del curso

**Estado:** preparados localmente, pendientes de aprobación del dueño.
**Ubicación:** `D:\Pibo\.artifacts\course-content\drive-upload`
**Regla:** estos archivos no deben subirse ni publicarse hasta que Franco los revise y los apruebe.

La revisión local del 27/07/2026 confirmó que los diez archivos existen, se pueden abrir, contienen texto y tienen entre cinco y siete páginas. El hash SHA-256 sirve para comprobar que el archivo que se suba más adelante sea exactamente el archivo aprobado.

| Módulo | Archivo | Páginas | Tamaño | SHA-256 | Estado de publicación |
|---:|---|---:|---:|---|---|
| 1 | `PIBO - Módulo 01 - Introducción y plan.pdf` | 5 | 301826 bytes | `4F6E51C6255E5DC23342871F6F7F509E22114B0B84BABB1FDF6392C86D9FB68F` | Pendiente de aprobación |
| 2 | `PIBO - Módulo 02 - Documentación, ingreso y residencia.pdf` | 6 | 287065 bytes | `CD49F8FDE81FC1125678C5BA2FD35A06E404A2C1C20275E196F37776E8F7F569` | Pendiente de aprobación |
| 3 | `PIBO - Módulo 03 - Carrera, universidad e inscripción.pdf` | 6 | 293684 bytes | `464851D1BCAA51E6BF55017F50B95B6BC796297F05338BA57A0018E76109DB37` | Pendiente de aprobación |
| 4 | `PIBO - Módulo 04 - Vivienda y alquiler.pdf` | 6 | 287469 bytes | `E5B015791EE432FB162AEBA94E23577EBB789FAE1AE7010B07C81749A275A2C0` | Pendiente de aprobación |
| 5 | `PIBO - Módulo 05 - Trabajo y protección.pdf` | 7 | 297111 bytes | `196F1A337406CE3CE2770BED28974581E1F53AA191A5872DF6C3A26D6A5CA8FE` | Pendiente de aprobación |
| 6 | `PIBO - Módulo 06 - Vida cotidiana.pdf` | 5 | 285932 bytes | `5A970AA664A5AC2A0314A3BE87E79A6457CBF99C65CD76B0E2FF04B150791573` | Pendiente de aprobación |
| 7 | `PIBO - Módulo 07 - Salud y cobertura.pdf` | 5 | 275140 bytes | `F4A5C4337E0C32F7BF14859E2FB2731D01D82E76F5767D936D5D5C77FF3E252F` | Pendiente de aprobación |
| 8 | `PIBO - Módulo 08 - Comunidad, bienestar y redes.pdf` | 5 | 279129 bytes | `80345093A3AB1310F79D6971F35274646BAFFEED38C0C1B877CF76E117BB84F7` | Pendiente de aprobación |
| 9 | `PIBO - Módulo 09 - Información dinámica.pdf` | 6 | 296047 bytes | `681ECA3DB25751881DDB87B1381B2E68EAB6252BEC00E4A51756090C55147393` | Pendiente de aprobación; módulo oculto |
| 10 | `PIBO - Módulo 10 - Plan de llegada y continuidad.pdf` | 6 | 292168 bytes | `9CACAB9A8BA1D1AF0A5CFBE907821A9192ED589FA3292EC581B20EFF71F9E7BD` | Pendiente de aprobación |

## Qué falta antes de publicar

- [ ] Franco revisa el contenido de cada PDF.
- [ ] Confirmar que títulos y orden coincidan con los diez módulos actuales de Supabase.
- [ ] Revisar especialmente los datos que pueden cambiar: requisitos, costos, documentación, universidades, salud y trámites.
- [ ] Decidir si el módulo 9 llevará también video o quedará como módulo documental.
- [ ] Subir sólo los archivos aprobados al bucket privado `lesson-resources`.
- [ ] Guardar cada recurso dentro de la carpeta de su módulo.
- [ ] Actualizar el campo `resources` del módulo correcto.
- [ ] Verificar con un alumno de prueba que el enlace firmado funciona y no es público.
- [ ] Registrar en este manifiesto la fecha de aprobación y el hash del archivo publicado.

## Criterio de aceptación

Un PDF se considera listo únicamente cuando:

1. Fue revisado y aprobado explícitamente.
2. Su información sensible al tiempo fue comprobada.
3. El archivo publicado coincide con el hash aprobado.
4. Sólo un alumno con acceso puede abrirlo.
5. El módulo y el nombre visible coinciden con la guía comercial de Pibo.
