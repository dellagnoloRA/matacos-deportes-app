# Registro Inmutable de Consentimiento Legal y Cumplimiento de Defensa del Consumidor

Para cumplir con la Ley N° 25.326 de Protección de Datos Personales, la Ley N° 24.240 de Defensa del Consumidor y las Resoluciones 271/2020 y 316/2018 de la Secretaría de Comercio Interior, se implementa una tabla inmutable `LegalConsentLog` en PostgreSQL y un flujo formal de revocación (`/arrepentimiento`). 

Se decidió desacoplar el consentimiento en dos checkboxes explícitos ("Términos y Condiciones" y "Políticas de Privacidad") registrando fecha, IP, userAgent y versión documental para cualquier usuario (registrado o invitado), y establecer una política de devoluciones que garantiza el derecho legal irrenunciable de arrepentimiento web en 10 días corridos con inspección previa de la prenda, complementada por una política de salón físico sin límite de tiempo sujeta a etiquetas intactas y ticket original.
