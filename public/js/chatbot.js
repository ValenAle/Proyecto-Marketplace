const CHATBOT_RESPONSES = [
    {
        keywords: ['contraseña', 'password', 'clave', 'cambiar contraseña'],
        answer: '🔐 Para cambiar tu contraseña:\n1. Hacé clic en el ícono de perfil (👤) arriba a la derecha.\n2. Bajá hasta la sección "Cambiar contraseña".\n3. Ingresá tu contraseña actual y la nueva.\n4. Hacé clic en "Guardar cambios".'
    },
    {
        keywords: ['perfil', 'editar perfil', 'información', 'nombre', 'foto', 'teléfono', 'avatar'],
        answer: '👤 Para editar tu perfil:\n1. Hacé clic en el ícono de perfil (👤) arriba a la derecha.\n2. Tocá el lápiz ✏️ al lado de cada dato que quieras modificar.\n3. Guardá los cambios con el botón al final.'
    },
    {
        keywords: ['cerrar sesión', 'logout', 'salir', 'desconectar', 'como cierro', 'cómo cierro', 'cerrar la sesion', 'cerrar la sesión'],
        answer: '👋 Para cerrar sesión:\nEn el panel izquierdo de la pantalla encontrás el botón rojo "Cerrar sesión". Hacé clic ahí y se cerrará tu sesión.'
    },
    {
        keywords: ['publicar', 'agregar servicio', 'nuevo servicio', 'crear publicación', 'cómo publico', 'como publico', 'subir servicio'],
        answer: '📝 Para publicar un servicio:\n1. Hacé clic en el botón "+" que aparece flotante a la derecha.\n2. Completá el título, descripción, imagen y categoría.\n3. Hacé clic en "Publicar".\n4. Tu publicación entrará en revisión y el equipo de FIVOX la evaluará antes de que aparezca en el home.'
    },
    {
        keywords: ['no se ve', 'no aparece', 'publicación no aparece', 'no está publicada', 'pendiente', 'revisión'],
        answer: '⏳ Las publicaciones pasan por un proceso de revisión antes de aparecer públicamente. Esto es para garantizar la calidad del contenido. Una vez aprobada por un administrador, aparecerá en el home automáticamente. Podés ver el estado en "Mis Servicios".'
    },
    {
        keywords: ['cuánto tarda', 'cuanto tarda', 'tiempo aprobación', 'cuando se aprueba', 'demora'],
        answer: '⏱️ El tiempo estimado de aprobación es de 24 a 48 horas hábiles. Si pasado ese tiempo tu publicación sigue pendiente, podés abrir un ticket de soporte para consultarlo.'
    },
    {
        keywords: ['contactar fivox', 'equipo fivox', 'soporte fivox', 'ayuda fivox', 'contacto fivox', 'contacto al equipo', 'contactar al equipo', 'contactar equipo', 'contactar a fivox', 'hablar con fivox', 'administrador', 'contacto administrador', 'contactar administrador', 'hablar con un admin', 'contacto a un admin'],
        answer: '📬 Para contactar al equipo de FIVOX:\nUsá el sistema de soporte integrado en la plataforma. Hacé clic en el ícono 💬 de la barra derecha, creá un nuevo ticket y te responderemos a la brevedad.'
    },
    {
        keywords: ['contactar prestador', 'contacto prestador', 'contactar proveedor', 'hablar con el prestador', 'comunicarme con el prestador', 'número de teléfono', 'email del prestador', 'datos del prestador'],
        answer: '📞 Para contactar a un prestador de servicios:\nHacé clic en cualquier publicación del home. En el detalle del post vas a ver el número de teléfono y el email del prestador para que puedas comunicarte directamente.'
    },
    {
        keywords: ['reportar publicación', 'reportar', 'denunciar', 'publicación inapropiada', 'contenido inadecuado'],
        answer: '🚩 Para reportar una publicación:\nAndá a la sección de Soporte (ícono 💬 en la barra de la derecha) y abrí un nuevo ticket indicando el número o nombre de la publicación que querés reportar. Un administrador revisará tu caso.'
    },
    {
        keywords: ['problema técnico', 'error', 'bug', 'falla', 'no funciona', 'problema'],
        answer: '🛠️ Si tenés un problema técnico:\nAbrí un ticket en la sección de Soporte (ícono 💬 en la barra de la derecha). Describí el problema con el mayor detalle posible y un administrador te ayudará a resolverlo.'
    }
];

const QUICK_REPLIES = [
    '¿Cómo publico un servicio?',
    '¿Cómo contacto a un prestador?',
    'Tengo un problema técnico',
    '¿Cómo edito mi perfil?',
];

const DEFAULT_RESPONSE = '🤔 No tengo una respuesta específica para eso. Te recomiendo abrir un ticket de soporte haciendo clic en el ícono 💬 de la barra derecha. Un administrador te ayudará personalmente.';

function getBotResponse(message) {
    const lower = message.toLowerCase();
    for (const item of CHATBOT_RESPONSES) {
        if (item.keywords.some(k => lower.includes(k))) {
            return item.answer;
        }
    }
    return DEFAULT_RESPONSE;
}

function initChatbot() {
    const toggle = document.getElementById('chatbot-toggle');
    const window_ = document.getElementById('chatbot-window');
    const close = document.getElementById('chatbot-close');
    const input = document.getElementById('chatbot-input');
    const sendBtn = document.getElementById('chatbot-send');
    const messages = document.getElementById('chatbot-messages');
    const quickRepliesContainer = document.getElementById('chatbot-quick-replies');

    if (!toggle) return;

    // Quick replies
    QUICK_REPLIES.forEach(q => {
        const btn = document.createElement('button');
        btn.className = 'chatbot-quick-btn';
        btn.textContent = q;
        btn.addEventListener('click', () => {
            sendMessage(q);
        });
        quickRepliesContainer.appendChild(btn);
    });

    toggle.addEventListener('click', () => {
        const isOpen = window_.classList.contains('open');
        if (isOpen) {
            window_.classList.remove('open');
        } else {
            window_.classList.add('open');
        }
    });

    close.addEventListener('click', () => {
        window_.classList.remove('open');
    });

    sendBtn.addEventListener('click', () => {
        const text = input.value.trim();
        if (!text) return;
        sendMessage(text);
        input.value = '';
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const text = input.value.trim();
            if (!text) return;
            sendMessage(text);
            input.value = '';
        }
    });

    function sendMessage(text) {
        appendMessage(text, 'user');
        quickRepliesContainer.style.display = 'none';

        setTimeout(() => {
            const response = getBotResponse(text);
            appendMessage(response, 'bot');
        }, 600);
    }

    function appendMessage(text, sender) {
        const div = document.createElement('div');
        div.className = `chatbot-msg chatbot-msg-${sender}`;
        div.innerText = text;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    }
}

document.addEventListener('DOMContentLoaded', initChatbot);