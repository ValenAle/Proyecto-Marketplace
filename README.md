Autenticación (login/registro):

Objetivo: Permitir a los usuarios registrarse e iniciar sesión de forma segura para acceder a la aplicación.

Alcance: Registro de usuarios, inicio de sesión, validación de credenciales, generación de sesión.

Contexto: Se utiliza en el acceso inicial a la aplicación. Es obligatorio para cualquier funcionalidad protegida como publicaciones, perfil o soporte.

Requisitos funcionales: Permitir registro con email y contraseña, Permitir login con credenciales válidas, Validar que el email no esté duplicado, Generar token de sesión, Permitir logout.

Requisitos no funcionales: Escalabilidad (soportar múltiples usuarios concurrentes), Usabilidad (mensajes claros de error), Seguridad (contraseñas hasheadas ), Diseño responsive.

Interfaz del componente: inputs (email, contraseña, etc), outputs (mensajes de error), evento (login exitoso y fallido, y registro exitoso).

Reglas del negocio: Todo usuario nuevo se registra como usuario, No se permite login sin credenciales válidas, El email debe ser único, El token expira luego de cierto tiempo.

Arquitectura técnica: Frontend (React + HTML), Backend: Node.js + Express, Autenticación: JWT, Seguridad: bcrypt para contraseñas, Base de datos: tabla USERS (SQL SMS). 

Repositorio: app-frontend, app-backend, app-database.

Flujo: Front envía datos, Backend valida, Backend consulta DB, Backend responde con token.

Dependencias: Base datos USERS, libreria JWT, libreria bcrypt, API backend.

Casos de uso: Usuario se registra correctamente, Usuario inicia sesión correctamente, Usuario ingresa contraseña incorrecta

Casos borde: Email vacío, Contraseña vacía, Email ya registrado, Usuario inexistente, Token inválido o expirado.

Criterios de aceptación: Registro exitoso crea usuario en DB, Login válido devuelve token, Login inválido devuelve error, Contraseña nunca se guarda en texto plano.

Estrategia de pruebas: Test de registro, Test de login, Test de errores, Test de seguridad (password hash).

Riesgos: Vulnerabilidades de seguridad, Mala gestión de tokens, Anexos.

Endpoints: POST /register, POST /login.


Publicaciones:

Objetivo: Permitir a los usuarios crear, visualizar y gestionar publicaciones con contenido e imágenes.

Alcance: Creación de publicaciones, visualización de listado, visualización de detalle, eliminación de publicaciones.

Contexto: Se utiliza dentro de la aplicación una vez que el usuario está autenticado. Es una funcionalidad principal para compartir contenido.

Requisitos funcionales: Permitir crear publicaciones con título y descripción, Permitir adjuntar imagen, Mostrar listado de publicaciones, Mostrar detalle de una publicación, Permitir eliminar publicaciones propias.

Requisitos no funcionales: Escalabilidad (soportar múltiples publicaciones concurrentes), Performance (carga rápida de imágenes), Usabilidad (interfaz clara), Diseño responsive.

Interfaz del componente: inputs (título, descripción, imagen), outputs (mensaje de éxito o error), evento (publicación creada, eliminada).

Reglas del negocio: Solo usuarios autenticados pueden crear publicaciones, El título y descripción son obligatorios, Un usuario solo puede eliminar sus propias publicaciones, Las imágenes deben cumplir formato válido.

Arquitectura técnica: Frontend (React + HTML), Backend (Node.js + Express), Manejo de imágenes (Multer o Cloudinary), Base de datos (tabla POSTS en SQL).

Repositorio: app-frontend, app-backend, app-database.

Flujo: Front envía datos de publicación, Backend valida, Backend guarda en DB, Backend responde con confirmación.

Dependencias: Base de datos POSTS, API backend, librería de subida de imágenes.

Casos de uso: Usuario crea publicación correctamente, Usuario visualiza publicaciones, Usuario elimina una publicación.

Casos borde: Campos vacíos, Imagen inválida, Error al subir imagen, Usuario intenta eliminar publicación ajena.

Criterios de aceptación: Publicación válida se guarda en DB, Publicación aparece en listado, Error si faltan datos obligatorios, Solo autor puede eliminar.

Estrategia de pruebas: Test de creación, Test de listado, Test de eliminación, Test de validación de datos.

Riesgos: Pérdida de imágenes, Problemas de carga, Datos inconsistentes.

Endpoints: POST /posts, GET /posts, DELETE /posts/:id

Soporte (Tickets)

Objetivo: Permitir la comunicación entre usuarios y administradores mediante un sistema de tickets.

Alcance: Creación de tickets, envío de mensajes, visualización de conversaciones, respuesta por parte de administradores.

Contexto: Se utiliza cuando un usuario necesita asistencia. Forma parte del sistema de ayuda de la aplicación.

Requisitos funcionales: Permitir crear ticket, Permitir enviar mensajes dentro del ticket, Permitir respuestas de administrador, Mostrar historial de conversación.

Requisitos no funcionales: Escalabilidad (soportar múltiples conversaciones), Usabilidad (interfaz tipo chat clara), Persistencia (guardar mensajes), Diseño responsive.

Interfaz del componente: inputs (mensaje), outputs (mensajes enviados/recibidos), evento (mensaje enviado, respuesta recibida).

Reglas del negocio: Solo usuarios autenticados pueden crear tickets, Un ticket pertenece a un usuario, Los mensajes quedan almacenados, Solo admin puede cerrar tickets.

Arquitectura técnica: Frontend (React + HTML), Backend (Node.js + Express), Base de datos (tablas SUPPORT_TICKETS y SUPPORT_MESSAGES).

Repositorio: app-frontend, app-backend, app-database.

Flujo: Usuario crea ticket, Backend guarda ticket, Usuario/admin envían mensajes, Backend almacena mensajes y los devuelve.

Dependencias: Base de datos (tickets y mensajes), API backend.

Casos de uso: Usuario crea ticket, Usuario envía mensaje, Admin responde ticket, Usuario visualiza historial.

Casos borde: Mensaje vacío, Ticket inexistente, Usuario sin permisos, Error de conexión.

Criterios de aceptación: Ticket se guarda correctamente, Mensajes se almacenan, Admin puede responder, Historial se muestra completo.

Estrategia de pruebas: Test de creación de ticket, Test de envío de mensajes, Test de respuesta de admin, Test de historial.

Riesgos: Pérdida de mensajes, Problemas de sincronización, Sobrecarga de mensajes.

Endpoints: POST /tickets, GET /tickets, POST /messages




Perfil

Objetivo: Permitir a los usuarios visualizar y actualizar su información personal.

Alcance: Visualización de perfil, edición de nombre, carga de foto, cambio de contraseña.

Contexto: Se utiliza dentro de la sesión del usuario para gestionar sus datos personales.

Requisitos funcionales: Mostrar datos del usuario, Permitir editar nombre, Permitir subir o cambiar foto, Permitir cambiar contraseña.

Requisitos no funcionales: Seguridad (protección de datos), Usabilidad (interfaz clara), Performance (carga rápida de datos), Diseño responsive.

Interfaz del componente: inputs (nombre, foto, contraseña), outputs (confirmación o error), evento (perfil actualizado).

Reglas del negocio: Solo el usuario puede editar su perfil, La contraseña debe actualizarse de forma segura, La foto debe ser válida.

Arquitectura técnica: Frontend (React + HTML), Backend (Node.js + Express), Base de datos (tabla PROFILES), Manejo de imágenes (Cloudinary o almacenamiento local).

Repositorio: app-frontend, app-backend, app-database.

Flujo: Usuario solicita perfil, Backend devuelve datos, Usuario envía cambios, Backend valida y actualiza DB.

Dependencias: Base de datos PROFILES, API backend, librería de imágenes.

Casos de uso: Usuario visualiza perfil, Usuario actualiza nombre, Usuario cambia contraseña, Usuario actualiza foto.

Casos borde: Datos vacíos, Imagen inválida, Error al actualizar, Contraseña insegura.

Criterios de aceptación: Perfil se muestra correctamente, Cambios se guardan en DB, Contraseña se actualiza de forma segura, Mensajes de error claros.

Estrategia de pruebas: Test de visualización, Test de edición, Test de cambio de contraseña, Test de validaciones.

Riesgos: Exposición de datos sensibles, Fallos en actualización, Problemas con imágenes.

Endpoints: GET /profile, PUT /profile, PUT /profile/password
