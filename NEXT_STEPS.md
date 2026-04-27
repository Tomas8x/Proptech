# Next Steps — PropTech

Lo que hubiésemos implementado con más tiempo, ordenado por impacto.

---

## Alta prioridad

### Auto-flagging de documentos sospechosos
La estructura de DB (`FlaggedDocument`) y la UI del admin ya existen, pero la detección es manual. Con más tiempo conectaríamos el pipeline de scoring para que documentos con `score < 40` o `docQuality === "Baja"` queden automáticamente en la cola del admin al momento del upload. Solo falta el trigger en `src/app/inquilino/documentos/actions.ts` después de calcular el score.

### Email con dominio propio
Hoy el `from` usa `onboarding@resend.dev` (dominio compartido de Resend) y el envío está restringido a la dirección verificada de la cuenta. Verificar el dominio en Resend desbloquea envío a cualquier destinatario, mejora la deliverability y evita caer en spam. El código de notificaciones (`src/lib/email/notifications.ts`) no necesita cambios — solo la variable `FROM`.

### Delta numérico en mejoras de score
Hoy `improvement_text` devuelve texto genérico ("mejorar la calidad del DNI"). Con más tiempo calcularíamos el impacto estimado por dimensión y mostraríamos algo como "subir el comprobante de ingresos podría llevar tu score de 54 a ~72". Requiere un segundo pass del modelo con los valores actuales de cada dimensión y su peso relativo en el score final.

---

## Con más tiempo

### Rediseño del frontend
La UI cumple su función pero es genérica. Le daría una pasada de personalidad: sistema de diseño propio (paleta, tipografía, espaciado consistente), componentes con más carácter, micro-interacciones en los flujos de carga de documentos y avance de etapas. El objetivo sería que la plataforma se sienta como un producto real, no un CRUD con Tailwind.

### Cobertura de casos de uso reales
Hay flujos que el happy path no ejercita: inquilino que sube documentos ilegibles, inmobiliaria que rechaza una postulación después de aprobarla, transacción que vuelve a etapa anterior por un error, garantía que no cubre el monto. Mapear estos casos y tener UI + lógica de negocio para cada uno haría la plataforma usable en producción.

### Unit testing de server actions y lógica de AI
Las server actions y la capa `src/lib/ai/` no tienen tests. Hubiésemos agregado unit tests para los casos críticos: parseo del JSON de Groq cuando el modelo devuelve texto malformado, cálculo de score con perfiles extremos (score 0, score 100), validaciones en las actions antes de tocar la DB. Sin esto cualquier cambio en los prompts o en la lógica de negocio es un leap of faith.

### Más server actions
Varios flujos que hoy requieren navegar entre páginas se resolverían mejor como actions inline: rechazar una postulación desde el listado sin entrar al detalle, archivar una propiedad, cambiar el estado de una transacción desde el board sin abrir el modal. Menos fricción para la inmobiliaria que gestiona volumen.
