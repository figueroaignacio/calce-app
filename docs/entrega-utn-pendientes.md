# CALCE — Traspaso de Santiago a Ignacio / Checklist TFI UTN

> Documento de coordinación. **No implica aceptación del tutor ni entrega final realizada.**
> La guía de 236 checks de la UTN es orientativa: solo marcar requisitos comprobados.

## Aportes de Santiago

- Auth: PR #2 `https://github.com/figueroaignacio/calce-app/pull/2` (corrección de escalamiento de roles en el registro y cuatro pruebas); **estado actual: abierto, requiere revisión/merge**.
- Clientes: paquete propuesto con API, frontend, tipos, pruebas y documentación. Pendiente ejecutar verificación y crear PR.

## Acciones de Ignacio como integrador

- [ ] Revisar y fusionar PR #2 de autenticación o solicitar correcciones.
- [ ] Revisar e integrar la rama/PR de Clientes después de los tests y demo.
- [ ] Resolver la política del `pnpm format:check` global, que previamente detectó ~191 archivos con diferencias de formato.
- [ ] Conservar CI en verde (lint, TypeScript, tests y build).
- [ ] Preparar Neon/variables de entorno sin credenciales publicadas y comprobar migraciones desde cero.
- [ ] Desplegar por lo menos un componente principal online y verificar acceso funcional.
- [ ] Confirmar alcance aprobado por tutor/comité: módulos terminados versus pendientes; NO presentarlos como implementados si no lo están.
- [ ] Actualizar README con instalación real, entorno, integrantes, despliegue, PDF y enlace al video.
- [ ] Centralizar en README los enlaces; comprobar permisos y accesibilidad.
- [ ] Consolidar el Informe Final PDF con portada (incluye número de grupo), contexto y evidencia, objetivos/alcance, modelo de datos, arquitectura, módulos reales, pruebas, resultados, limitaciones y enlace al video.
- [ ] Grabar y publicar junto con Santiago un video natural: problema, contexto, arquitectura, demo, pruebas, limitaciones y conclusión. Participan los dos; inglés preferente, no obligatorio según el checklist.
- [ ] Verificar integridad y ausencia de secretos/tokens en todo el historial publicado.
- [ ] Confirmar fecha y condiciones formales de la entrega en el aula.

## Responsabilidades personales que no se pueden delegar

- Cada integrante confirma situación académica, tutor, instancias previas y cursada aprobada.
- Para la mesa final: totalidad de materias aprobadas, entrega actualizada dos semanas antes de la mesa, cuestionario teórico-práctico y coloquio individual.
- Cada integrante debe comprender y defender **el proyecto completo**, no solo su módulo.
- Preparar plan B de demo: captura/video y ejecución local de respaldo.

## Evidencias para marcar los 236 checks con criterio

| Área | Evidencia válida | Situación pendiente |
|---|---|---|
| Repositorio | Código ordenado, historial y ramas fusionadas | Revisar PRs y CI |
| Sistema | Build, demo y base de datos funcionando | Ejecutar recorrido E2E |
| Despliegue | URL operativa accesible para el comité | Ignacio |
| README | Enlaces verificables a deploy/PDF/video | Ignacio |
| Informe PDF | Documento incorporado al repo, concordante con el código | Ambos |
| Video | Enlace y participación sustancial de ambos | Ambos |
| Defensa | Materias, plazos, cuestionario, simulacro | Individual |

**Regla central UTN:** el código, README, informe y video deben describir el mismo sistema real. Se documentan limitaciones y módulos futuros en vez de prometer capacidades que todavía no existen.
