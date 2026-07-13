let allPosts = []; 
let ticketActivoId = null;
let pollingUsuario = null;
document.addEventListener('DOMContentLoaded', () => {
  init();
});

async function init() {
  const token = getToken();
  console.log('Token encontrado:', token);
  
  if (!token) {
    window.location.href = '/';
    return;
  }

  configurarLogout();
  configurarCategorias();
  configurarBtnCrear();
  configurarTerminos();
  configurarBtnPerfil();
  configurarBtnSoporte();
  await cargarPosts();
  configurarVistaPorRol();
  configurarContadores();
  configurarBtnUsuarios();
}

function getToken() {
  return localStorage.getItem('fivox_token') || sessionStorage.getItem('fivox_token');
}

function clearAuth() {
  localStorage.removeItem('fivox_token');
  localStorage.removeItem('fivox_user');
  sessionStorage.removeItem('fivox_token');
  sessionStorage.removeItem('fivox_user');
}

function configurarLogout() {
  const btnLogout = document.getElementById('btn-logout');
  if (!btnLogout) return;

  btnLogout.addEventListener('click', () => {
    clearAuth();
    window.location.href = '/';
  });
}

async function cargarPosts() {
  try {
    const token = getToken();

    const response = await fetch('/api/posts', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener publicaciones');
    }

    const data = await response.json();
    const posts = Array.isArray(data) ? data : (data.data || []);

    allPosts = posts;
    renderPosts(allPosts);
    configurarBusqueda();
  } catch (error) {
    console.error(error);
    mostrarError('No se pudieron cargar las publicaciones.');
  }
}

function renderPosts(posts) {
  const container = document.getElementById('posts-container');
  if (!container) return;

  container.innerHTML = '';

  if (posts.length === 0) {
    container.innerHTML = `<p class="text-muted text-center w-100">No hay publicaciones disponibles.</p>`;
    return;
  }

  posts.forEach(post => {
    const userRaw = localStorage.getItem('fivox_user') || sessionStorage.getItem('fivox_user') || '{}';
    const user = JSON.parse(userRaw);
    const esAdmin = user.role === 'ADMIN';

    const col = document.createElement('div');
    col.className = 'col-12 col-sm-6 col-lg-3';
    col.innerHTML = `
      <div class="post">
        <div class="post-image">
          ${post.image_url
            ? `<img src="${post.image_url}" alt="${post.title}" style="width:100%;height:100%;object-fit:cover;">`
            : `<i class="bi bi-image"></i>`}
        </div>
        <div class="post-content">
          <h4>${post.title}</h4>
          <div class="post-footer">
            <span>${post.author}</span>
            ${esAdmin ? `
              <div class="post-admin-btns">
                <button class="btn-edit-post" onclick="editarPost(${post.id_post})">
                  <i class="bi bi-pencil-fill"></i>
                </button>
                <button class="btn-delete-post" onclick="eliminarPost(${post.id_post})">
                  <i class="bi bi-trash-fill"></i>
                </button>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
    col.querySelector('.post').addEventListener('click', (e) => {
      if (e.target.closest('.post-admin-btns')) return;
      openModal(post);
    });
    container.appendChild(col);
  });
}

function mostrarError(mensaje) {
  const container = document.getElementById('posts-container');
  if (container) {
    container.innerHTML = `<p class="text-danger text-center w-100">${mensaje}</p>`;
  }
}


// SUPPORT VIEW DISPLAY
// SOPORTE

function configurarBtnSoporte() {
  const btn      = document.getElementById('btn-support');
  const btnAdmin = document.getElementById('btn-support-admin');

  if (btn) {
    btn.addEventListener('click', async () => {
      toggleSupportView();
      await cargarTickets();
    });
  }

  if (btnAdmin) {
    btnAdmin.addEventListener('click', async () => {
      document.getElementById('admin-support-modal').classList.add('visible');
      await cargarTicketsAdmin();
    });
  }
}

function closeAdminSupportModal() {
  document.getElementById('admin-support-modal').classList.remove('visible');
}

let todosLosTicketsAdmin = [];

async function cargarTicketsAdmin() {
  try {
    const token = getToken();
    const res = await fetch('/api/support/admin/tickets', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    todosLosTicketsAdmin = data.data || [];
    renderTicketsAdmin(todosLosTicketsAdmin);
  } catch (err) {
    console.error('Error al cargar tickets admin:', err);
  }
}

function renderTicketsAdmin(tickets) {
  const unread = tickets.filter(t => t.admin_replies < 2 && t.status === 'OPEN');
  const open = tickets.filter(t => t.admin_replies >= 2 && t.status === 'OPEN');
  const closed = tickets.filter(t => t.status === 'CLOSED');

  document.getElementById('count-unread').textContent = unread.length;
  document.getElementById('count-open').textContent = open.length;
  document.getElementById('count-closed').textContent = closed.length;

  renderColumnaAdmin('ticket-list-unread', unread);
  renderColumnaAdmin('ticket-list-open', open);
  renderColumnaAdmin('ticket-list-closed', closed);
}

function renderColumnaAdmin(containerId, tickets) {
  const list = document.getElementById(containerId);
  if (!list) return;

  list.innerHTML = '';

  if (tickets.length === 0) {
    list.innerHTML = `<p style="color:#9ba5b3;font-size:13px;">Sin tickets</p>`;
    return;
  }

  tickets.forEach(ticket => {
    const fecha = new Date(ticket.created_at).toLocaleDateString('es-AR');
    const card = document.createElement('div');
    card.className = 'admin-ticket-card';
    card.innerHTML = `
      <div class="admin-ticket-card-header">
        <h4>#${ticket.id_ticket}</h4>
        <button class="btn-ver">Ver</button>
      </div>
      <p class="ticket-subject">${ticket.subject || 'Sin asunto'}</p>
      <div class="ticket-meta">
        <span>${ticket.user_name}</span>
        <span>${fecha}</span>
      </div>
    `;
    card.querySelector('.btn-ver').addEventListener('click', () => abrirTicketAdmin(ticket));
    list.appendChild(card);
  });
}

function filtrarTicketsAdmin() {
  const query = document.getElementById('admin-ticket-search').value.trim().toLowerCase();
  const filtrados = todosLosTicketsAdmin.filter(t =>
    String(t.id_ticket).includes(query) ||
    (t.subject || '').toLowerCase().includes(query) ||
    (t.user_name || '').toLowerCase().includes(query)
  );
  renderTicketsAdmin(filtrados);
}

let ticketActivoAdminId = null;
let pollingAdmin = null;

async function abrirTicketAdmin(ticket) {
  ticketActivoAdminId = ticket.id_ticket;

  document.getElementById('admin-chat-title').textContent =
    `Consulta #${ticket.id_ticket} — ${ticket.subject || 'Sin asunto'}`;
  document.getElementById('admin-chat-subtitle').textContent =
    `${ticket.user_name} · ${ticket.status === 'CLOSED' ? 'Cerrado' : 'Abierto desde'} ${new Date(ticket.created_at).toLocaleDateString('es-AR')}`;

  document.getElementById('btn-cerrar-ticket-admin').style.display =
    ticket.status === 'OPEN' ? 'inline-flex' : 'none';

  aplicarEstadoInputAdmin(ticket.status);  

  document.getElementById('admin-chat-modal').classList.add('visible');

  await cargarMensajesAdmin(ticket.id_ticket);

  if (pollingAdmin) clearInterval(pollingAdmin);
  pollingAdmin = setInterval(() => actualizarTicketAbiertoAdmin(ticket.id_ticket), 4000);
}

function aplicarEstadoInputAdmin(status) {
  const cerrado = status === 'CLOSED';
  const inputAdmin = document.getElementById('admin-chat-input-msg');
  const chatInputAdminBox = document.querySelector('#admin-chat-modal .admin-chat-input');
  inputAdmin.disabled = cerrado;
  inputAdmin.placeholder = cerrado ? 'Este ticket está cerrado' : 'Escribí tu respuesta...';
  chatInputAdminBox.querySelector('button').disabled = cerrado;
}

async function actualizarTicketAbiertoAdmin(id) {
  if (ticketActivoAdminId !== id) return;

  try {
    const token = getToken();
    const res = await fetch('/api/support/admin/tickets', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    const tickets = data.data || [];
    const ticket = tickets.find(t => t.id_ticket === id);
    if (!ticket) return;

    document.getElementById('btn-cerrar-ticket-admin').style.display =
      ticket.status === 'OPEN' ? 'inline-flex' : 'none';
    aplicarEstadoInputAdmin(ticket.status);
    todosLosTicketsAdmin = tickets;
    renderTicketsAdmin(tickets);

    await cargarMensajesAdmin(id);
  } catch (err) {
    console.error('Error al actualizar ticket admin:', err);
  }
}

function closeAdminChatModal() {
  document.getElementById('admin-chat-modal').classList.remove('visible');
  ticketActivoAdminId = null;
  if (pollingAdmin) {
    clearInterval(pollingAdmin);
    pollingAdmin = null;
  }
}

async function cargarMensajesAdmin(id) {
  try {
    const token = getToken();
    const res   = await fetch(`/api/support/tickets/${id}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    renderMensajesAdmin(data.data || []);
  } catch (err) {
    console.error('Error al cargar mensajes:', err);
  }
}

function renderMensajesAdmin(messages) {
  const container = document.getElementById('admin-chat-messages');
  if (!container) return;

  const userRaw = localStorage.getItem('fivox_user') || sessionStorage.getItem('fivox_user') || '{}';
  const user = JSON.parse(userRaw);
  container.innerHTML = '';

  if (messages.length === 0) {
    container.innerHTML = `<p style="color:#6b7280;font-size:14px;text-align:center;">No hay mensajes aún.</p>`;
    return;
  }

  messages.forEach(msg => {
    const esDelAdmin = Number(msg.id_user) === Number(user.id_user);
    const div = document.createElement('div');
    div.className = `message ${esDelAdmin ? 'admin' : 'user'}`;
    div.textContent = msg.message;
    container.appendChild(div);
  });

  container.scrollTop = container.scrollHeight;
}

async function enviarMensajeAdmin() {
  if (!ticketActivoAdminId) return;

  const input   = document.getElementById('admin-chat-input-msg');
  const message = input.value.trim();
  if (!message) return;

  try {
    const token = getToken();
    const res   = await fetch(`/api/support/tickets/${ticketActivoAdminId}/messages`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message }),
    });
    const data = await res.json();
    if (data.ok) {
      input.value = '';
      await cargarMensajesAdmin(ticketActivoAdminId);
      await cargarTicketsAdmin();
    }
  } catch (err) {
    console.error('Error al enviar mensaje:', err);
  }
}

async function cerrarTicketAdmin() {
  if (!ticketActivoAdminId) return;
  if (!confirm('¿Seguro que querés cerrar este ticket?')) return;

  try {
    const token = getToken();
    const res   = await fetch(`/api/support/tickets/${ticketActivoAdminId}/close`, {
      method:  'PUT',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.ok) {
      document.getElementById('btn-cerrar-ticket-admin').style.display = 'none';
      mostrarToast('Ticket cerrado ✅');
      await cargarTicketsAdmin();
    }
  } catch (err) {
    console.error('Error al cerrar ticket:', err);
  }
}

function toggleSupportView() {
  const supportView = document.getElementById('support-view');
  const btn = document.getElementById('btn-support');
  const abierto = supportView.style.display === 'flex';

  if (abierto) {
    supportView.style.display = 'none';
    btn.classList.remove('active');
  } else {
    supportView.style.display = 'flex';
    btn.classList.add('active');
  }
}

function closeSupportView() {
  document.getElementById('support-view').style.display = 'none';
  document.getElementById('btn-support').classList.remove('active');
  document.querySelector('#support-chat-section .chat-input').style.display = 'none';
  ticketActivoId = null;
  if (pollingUsuario) {
    clearInterval(pollingUsuario);
    pollingUsuario = null;
  }
}

async function cargarTickets() {
  try {
    const token = getToken();
    const res   = await fetch('/api/support/tickets', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    renderTickets(data.data || []);
  } catch (err) {
    console.error('Error al cargar tickets:', err);
  }
}

function renderTickets(tickets) {
  const list = document.getElementById('ticket-list');
  if (!list) return;

  list.innerHTML = '';

  if (tickets.length === 0) {
    list.innerHTML = `<p style="color:#6b7280;font-size:14px;text-align:center;margin-top:20px;">No tenés consultas aún.</p>`;
    return;
  }

  tickets.forEach(ticket => {
    const statusMap = {
      'OPEN':   { label: 'Abierto',    cls: 'status-process' },
      'CLOSED': { label: 'Resuelto',   cls: 'status-resolved' },
    };
    const s = statusMap[ticket.status] || { label: ticket.status, cls: 'status-waiting' };
    const fecha = new Date(ticket.created_at).toLocaleDateString('es-AR');

    const card = document.createElement('div');
    card.className = `ticket-card${ticketActivoId === ticket.id_ticket ? ' active' : ''}`;
    card.innerHTML = `
      <div class="ticket-header">
        <h4>Consulta #${ticket.id_ticket}</h4>
        <button class="ticket-view-btn" onclick="abrirTicket(${ticket.id_ticket}, '${ticket.subject || ''}', '${ticket.status}')">          Ver <i class="bi bi-chevron-right"></i>
        </button>
      </div>
      <p>${ticket.subject || 'Sin asunto'}</p>
      <div class="ticket-footer">
        <span class="ticket-status ${s.cls}">
          <i class="bi bi-clock-fill"></i> ${s.label}
        </span>
        <span>${fecha}</span>
      </div>
    `;
    list.appendChild(card);
  });
}

async function abrirTicket(id, subject, status) {
  ticketActivoId = id;
  document.getElementById('chat-ticket-title').textContent = `Consulta #${id} — ${subject}`;

  const chatSection = document.getElementById('support-chat-section');
  if (chatSection) chatSection.style.display = 'flex';

  document.querySelector('#support-chat-section .chat-input').style.display = 'flex';
  aplicarEstadoInputUsuario(status);

  await cargarMensajes(id);
  await cargarTickets();

  if (pollingUsuario) clearInterval(pollingUsuario);
  pollingUsuario = setInterval(() => actualizarTicketAbiertoUsuario(id), 4000);
}

function aplicarEstadoInputUsuario(status) {
  const cerrado = status === 'CLOSED';
  const input = document.getElementById('chat-input-msg');
  const chatInputBox = document.querySelector('#support-chat-section .chat-input');
  input.disabled = cerrado;
  input.placeholder = cerrado ? 'Este ticket está cerrado' : 'Escribí tu mensaje...';
  chatInputBox.querySelector('button').disabled = cerrado;
}

async function actualizarTicketAbiertoUsuario(id) {
  if (ticketActivoId !== id) return;

  try {
    const token = getToken();
    const res = await fetch('/api/support/tickets', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    const tickets = data.data || [];
    const ticket = tickets.find(t => t.id_ticket === id);
    if (!ticket) return;

    aplicarEstadoInputUsuario(ticket.status);
    renderTickets(tickets);
    await cargarMensajes(id);
  } catch (err) {
    console.error('Error al actualizar ticket:', err);
  }
}

async function cargarMensajes(id) {
  try {
    const token = getToken();
    const res   = await fetch(`/api/support/tickets/${id}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    renderMensajes(data.data || []);
  } catch (err) {
    console.error('Error al cargar mensajes:', err);
  }
}

function renderMensajes(messages) {
  const container = document.getElementById('chat-messages');
  if (!container) return;

  const userRaw = localStorage.getItem('fivox_user') || sessionStorage.getItem('fivox_user') || '{}';
  const user = JSON.parse(userRaw);
  container.innerHTML = '';

  if (messages.length === 0) {
    container.innerHTML = `<p style="color:#6b7280;font-size:14px;text-align:center;">No hay mensajes aún.</p>`;
    return;
  }

  messages.forEach(msg => {
    const esPropio = Number(msg.id_user) === Number(user.id_user);
    const div = document.createElement('div');
    div.className = `message ${esPropio ? 'user' : 'admin'}`;
    div.textContent = msg.message;
    container.appendChild(div);
  });

  container.scrollTop = container.scrollHeight;
}

async function enviarMensaje() {
  if (!ticketActivoId) return;

  const input   = document.getElementById('chat-input-msg');
  const message = input.value.trim();
  if (!message) return;

  try {
    const token = getToken();
    const res   = await fetch(`/api/support/tickets/${ticketActivoId}/messages`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message }),
    });
    const data = await res.json();
    if (data.ok) {
      input.value = '';
      await cargarMensajes(ticketActivoId);
    }
  } catch (err) {
    console.error('Error al enviar mensaje:', err);
  }
}

function crearNuevoTicket() {
  document.getElementById('new-ticket-modal').style.display = 'flex';
  document.getElementById('ticket-subject').value = '';
  document.getElementById('ticket-first-message').value = '';
  document.getElementById('new-ticket-alert').className = 'd-none';
}

function closeNewTicketModal() {
  document.getElementById('new-ticket-modal').style.display = 'none';
}

async function confirmarNuevoTicket() {
  const subject = document.getElementById('ticket-subject').value.trim();
  const message = document.getElementById('ticket-first-message').value.trim();
  const alertBox = document.getElementById('new-ticket-alert');

  if (!subject) {
    alertBox.className   = 'alert alert-danger';
    alertBox.textContent = 'El asunto es obligatorio.';
    return;
  }

  const btn = document.getElementById('btn-create-ticket');
  btn.disabled    = true;
  btn.textContent = 'Creando...';

  try {
    const token = getToken();

    const res = await fetch('/api/support/tickets', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ subject }),
    });
    const data = await res.json();

    if (!res.ok || !data.ok) {
      alertBox.className   = 'alert alert-danger';
      alertBox.textContent = data.message || 'Error al crear la consulta.';
      return;
    }

    const id_ticket = data.data.id_ticket;

    // Si escribió un mensaje inicial, lo enviamos
    if (message) {
      await fetch(`/api/support/tickets/${id_ticket}/messages`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message }),
      });
    }

    closeNewTicketModal();
    await abrirTicket(id_ticket, subject);

  } catch (err) {
    console.error(err);
    alertBox.className   = 'alert alert-danger';
    alertBox.textContent = 'No se pudo conectar con el servidor.';
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Crear consulta';
  }
}

function openModal(post) {
  document.getElementById('modal-title').textContent       = post.title;
  document.getElementById('modal-author').textContent      = post.author;
  document.getElementById('modal-description').textContent = post.description;
  document.getElementById('modal-image').src               = post.image_url || '';
  document.getElementById('modal-image').style.display     = post.image_url ? 'block' : 'none';
  document.getElementById('modal-phone').textContent       = post.author_phone ? `📞 ${post.author_phone}` : '';
  document.getElementById('modal-email').textContent       = post.author_email ? `✉️ ${post.author_email}` : '';

  const avatarImg = document.getElementById('modal-author-avatar');
  if (post.author_avatar) {
    avatarImg.src = post.author_avatar;
    avatarImg.style.display = 'block';
  } else {
    avatarImg.style.display = 'none';
  }

  document.getElementById('post-modal').style.display = 'flex';
}
  
function configurarBusqueda() {
  const input  = document.querySelector('.search input');
  const btn    = document.querySelector('.search button');
  if (!input || !btn) return;

  input.addEventListener('input', () => {
    const query = input.value.trim().toLowerCase();
    const filtrados = allPosts.filter(post =>
      post.title.toLowerCase().includes(query)
    );
    renderPosts(filtrados);

    // Cambia el ícono según si hay texto o no
    btn.innerHTML = input.value.length > 0
      ? '<i class="bi bi-x-lg"></i>'
      : '<i class="bi bi-search"></i>';
  });

  btn.addEventListener('click', () => {
    input.value = '';
    btn.innerHTML = '<i class="bi bi-search"></i>';
    renderPosts(allPosts);
    input.focus();
  });
}

function configurarCategorias() {
  const cards = document.querySelectorAll('.home-card');

  cards.forEach(card => {
    card.addEventListener('click', () => {
      const categoria = card.dataset.category;
      const yaActiva  = card.classList.contains('active');

      // Quitar active de todas
      cards.forEach(c => c.classList.remove('active'));

      if (yaActiva) {
        // Si ya estaba activa, deseleccionar y mostrar todos
        renderPosts(allPosts);
      } else {
        // Activar la seleccionada y filtrar
        card.classList.add('active');
        const filtrados = allPosts.filter(post => post.category === categoria);
        renderPosts(filtrados);
      }
    });
  });
}

function closeModal() {
  document.getElementById('post-modal').style.display = 'none';
}

// CREAR POST MODAL 
function configurarBtnCrear() {
  const btn = document.getElementById('btn-open-create');
  if (!btn) return;
  btn.addEventListener('click', () => openCreateModal());
}

async function openCreateModal() {
  document.getElementById('create-post-modal').style.display = 'flex';
  await cargarCategorias();
}

function closeCreateModal() {
  document.getElementById('create-post-modal').style.display = 'none';
  document.getElementById('cp-title').value       = '';
  document.getElementById('cp-description').value = '';
  document.getElementById('cp-image').value       = '';
  document.getElementById('cp-category').value    = '';
  document.getElementById('create-post-alert').className = 'd-none';

  // Cerrar toast si existe
  const toast = document.querySelector('.fivox-toast');
  if (toast) {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }
}

async function cargarCategorias() {
  try {
    const token = getToken();
    const res   = await fetch('/api/posts/categories', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data  = await res.json();
    const select = document.getElementById('cp-category');

    select.innerHTML = '<option value="">Seleccioná una categoría</option>';
    data.data.forEach(cat => {
      select.innerHTML += `<option value="${cat.id_category}">${cat.name}</option>`;
    });
  } catch (err) {
    console.error('Error al cargar categorías:', err);
  }
}

async function submitPost() {
  const title       = document.getElementById('cp-title').value.trim();
  const description = document.getElementById('cp-description').value.trim();
  const image_url   = document.getElementById('cp-image').value.trim();
  const id_category = document.getElementById('cp-category').value;
  const alertBox = document.getElementById('create-post-alert');

  if (!title || !description || !id_category) {
    alertBox.className = 'alert alert-danger';
    alertBox.textContent = 'Título, descripción y categoría son obligatorios.';
    return;
  }

  const errorPost = validarPost(title, description);
  if (errorPost) {
    alertBox.className = 'alert alert-danger';
    alertBox.textContent = errorPost;
    return;
  }

  try {
    const token = getToken();
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, description, image_url, id_category }),
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      alertBox.className   = 'alert alert-danger';
      alertBox.textContent = data.message || 'Error al publicar.';
      return;
    }

    setTimeout(() => {
      closeCreateModal();
      cargarPosts();
      setTimeout(() => mostrarToast('¡Publicación creada con éxito! 🎉'), 300);
    }, 2000);

  } catch (err) {
    console.error(err);
    alertBox.className   = 'alert alert-danger';
    alertBox.textContent = 'No se pudo conectar con el servidor.';
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Publicar';
  }
}

function mostrarToast(mensaje) {
  const toast = document.createElement('div');
  toast.className = 'fivox-toast';
  toast.textContent = mensaje;
  document.body.appendChild(toast);

  setTimeout(() => toast.style.opacity = '1', 10);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function configurarTerminos() {
  const btn = document.getElementById('btn-terms');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    await abrirTerminos();
  });
}

async function abrirTerminos() {
  try {
    const token = getToken();
    const res   = await fetch('/api/terms', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    const userRaw = localStorage.getItem('fivox_user') || sessionStorage.getItem('fivox_user') || '{}';
    const user = JSON.parse(userRaw);
    const esAdmin = user.role === 'ADMIN';
    document.getElementById('btn-save-terms').style.display = esAdmin ? 'block' : 'none';

    if (esAdmin) {
      document.getElementById('terms-editor').value       = data.data?.content || '';
      document.getElementById('terms-view-section').style.display   = 'none';
      document.getElementById('terms-edit-section').style.display   = 'block';
    } else {
      document.getElementById('terms-content-text').innerText = data.data?.content || '';
      document.getElementById('terms-view-section').style.display   = 'block';
      document.getElementById('terms-edit-section').style.display   = 'none';
    }

    document.getElementById('terms-modal').style.display = 'flex';
  } catch (err) {
    console.error('Error al cargar términos:', err);
  }
}

async function guardarTerminos() {
  const content  = document.getElementById('terms-editor').value.trim();
  const alertBox = document.getElementById('terms-alert');

  if (!content) {
    alertBox.className   = 'alert alert-danger';
    alertBox.textContent = 'El contenido no puede estar vacío.';
    return;
  }

  const btn = document.getElementById('btn-save-terms');
  btn.disabled    = true;
  btn.textContent = 'Guardando...';

  try {
    const token = getToken();
    const res   = await fetch('/api/terms', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ content }),
    });
    const data = await res.json();

    if (!res.ok || !data.ok) {
      alertBox.className   = 'alert alert-danger';
      alertBox.textContent = data.message || 'Error al guardar.';
      return;
    }

    alertBox.className   = 'alert alert-success';
    alertBox.textContent = 'Términos actualizados correctamente.';

  } catch (err) {
    console.error(err);
    alertBox.className   = 'alert alert-danger';
    alertBox.textContent = 'No se pudo conectar con el servidor.';
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Guardar cambios';
  }
}

function closeTermsModal() {
  document.getElementById('terms-modal').style.display = 'none';
}

function configurarBtnPerfil() {
  const btn = document.getElementById('btn-open-profile');
  if (!btn) return;
  btn.addEventListener('click', () => openProfileModal());
}

let pendingChanges = {};

async function openProfileModal() {
  document.getElementById('profile-modal').style.display = 'flex';
  pendingChanges = {};

  try {
    const token = getToken();
    const res   = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    if (data.ok) {
      setFieldView('name',   data.data.name);
      setFieldView('email',  data.data.email);
      setFieldView('phone',  data.data.phone);
      setFieldView('avatar', data.data.avatar_url);

      document.getElementById('pf-name').value   = data.data.name || '';
      document.getElementById('pf-email').value  = data.data.email || '';
      document.getElementById('pf-phone').value  = data.data.phone || '';
      document.getElementById('pf-avatar').value = data.data.avatar_url || '';

      const img = document.getElementById('profile-avatar-img');
      if (data.data.avatar_url) {
        img.src = data.data.avatar_url;
        img.style.display = 'block';
      } else {
        img.style.display = 'none';
      }
    }
  } catch (err) {
    console.error('Error al cargar perfil:', err);
  }
}

function setFieldView(field, value) {
  const el = document.getElementById(`view-${field}`);
  if (el) el.textContent = value || (field === 'avatar' ? 'Sin definir' : '—');
}

function toggleEdit(field) {
  const wrapper = document.querySelector(`.profile-field[data-field="${field}"]`);
  wrapper.classList.toggle('editing');

  if (wrapper.classList.contains('editing')) {
    document.getElementById(`pf-${field}`).focus();
  }
}

function closeProfileModal() {
  document.getElementById('profile-modal').style.display = 'none';
  document.getElementById('profile-alert').className = 'd-none';
  document.getElementById('pf-old-password').value = '';
  document.getElementById('pf-new-password').value = '';

  document.querySelectorAll('.profile-field.editing').forEach(f => f.classList.remove('editing'));
}

async function saveAll() {
  const name       = document.getElementById('pf-name').value.trim();
  const email      = document.getElementById('pf-email').value.trim();
  const phone      = document.getElementById('pf-phone').value.trim();
  const avatar_url = document.getElementById('pf-avatar').value.trim();
  const oldPassword = document.getElementById('pf-old-password').value;
  const newPassword = document.getElementById('pf-new-password').value;
  const alertBox    = document.getElementById('profile-alert');

  if (!name || !email) {
    alertBox.className   = 'alert alert-danger';
    alertBox.textContent = 'Nombre y email son obligatorios.';
    return;
  }

  const btn = document.getElementById('btn-save-profile');
  btn.disabled    = true;
  btn.textContent = 'Guardando...';

  try {
    const token = getToken();

    const res = await fetch('/api/auth/profile', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, email, phone, avatar_url }),
    });
    const data = await res.json();

    if (!res.ok || !data.ok) {
      alertBox.className   = 'alert alert-danger';
      alertBox.textContent = data.message || 'Error al actualizar.';
      return;
    }

    // Si completó los campos de contraseña, cambiarla también
    if (oldPassword && newPassword) {
      const resPass = await fetch('/api/auth/password', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const dataPass = await resPass.json();

      if (!resPass.ok || !dataPass.ok) {
        alertBox.className   = 'alert alert-danger';
        alertBox.textContent = dataPass.message || 'Perfil guardado, pero falló el cambio de contraseña.';
        return;
      }
    }

    setFieldView('name', name);
    setFieldView('email', email);
    setFieldView('phone', phone);
    setFieldView('avatar', avatar_url);

    const img = document.getElementById('profile-avatar-img');
    if (avatar_url) {
      img.src = avatar_url;
      img.style.display = 'block';
    }

    document.querySelectorAll('.profile-field.editing').forEach(f => f.classList.remove('editing'));
    document.getElementById('pf-old-password').value = '';
    document.getElementById('pf-new-password').value = '';

    await cargarPosts(); // refresca los posts para que muestren los datos actualizados

    alertBox.className   = 'alert alert-success';
    alertBox.textContent = 'Perfil actualizado correctamente.';

  } catch (err) {
    console.error(err);
    alertBox.className   = 'alert alert-danger';
    alertBox.textContent = 'No se pudo conectar con el servidor.';
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Guardar cambios';
  }
}


function configurarVistaPorRol() {
  const userRaw = localStorage.getItem('fivox_user') || sessionStorage.getItem('fivox_user') || '{}';
  const user = JSON.parse(userRaw);
  const esAdmin = user.role === 'ADMIN';

  document.getElementById('btn-mis-servicios').style.display   = esAdmin ? 'none'  : 'block';
  document.getElementById('btn-admin-servicios').style.display = esAdmin ? 'block' : 'none';
  document.getElementById('btn-open-create').style.display     = esAdmin ? 'none'  : 'flex';
  document.getElementById('btn-usuarios').style.display = esAdmin ? 'block' : 'none';

  // Soporte: en admin va al sidebar, en usuario va como flotante
  document.getElementById('btn-support').style.display         = esAdmin ? 'none'  : 'flex';
  document.getElementById('btn-support-admin').style.display   = esAdmin ? 'block' : 'none';

  if (esAdmin) document.body.classList.add('is-admin');
}

// ADMIN — EDITAR POST
async function editarPost(id) {
  const post = allPosts.find(p => p.id_post === id);
  if (!post) return;

  document.getElementById('ep-title').value       = post.title;
  document.getElementById('ep-description').value = post.description;
  document.getElementById('ep-image').value       = post.image_url || '';
  document.getElementById('ep-id').value          = post.id_post;

  document.getElementById('edit-post-modal').style.display = 'flex';
}

function closeEditPostModal() {
  document.getElementById('edit-post-modal').style.display = 'none';
}

async function guardarEdicionPost() {
  const id          = document.getElementById('ep-id').value;
  const title       = document.getElementById('ep-title').value.trim();
  const description = document.getElementById('ep-description').value.trim();
  const image_url   = document.getElementById('ep-image').value.trim();
  const alertBox    = document.getElementById('edit-post-alert');

  if (!title || !description) {
  alertBox.className   = 'alert alert-danger';
  alertBox.textContent = 'Título y descripción son obligatorios.';
  return;
}

const errorEdit = validarPost(title, description);
if (errorEdit) {
  alertBox.className   = 'alert alert-danger';
  alertBox.textContent = errorEdit;
  return;
}

  try {
    const token = getToken();
    const res   = await fetch(`/api/posts/${id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title, description, image_url }),
    });
    const data = await res.json();

    if (!res.ok || !data.ok) {
      alertBox.className   = 'alert alert-danger';
      alertBox.textContent = data.message || 'Error al guardar.';
      return;
    }

    closeEditPostModal();
    await cargarPosts();
    mostrarToast('Publicación actualizada ✅');

  } catch (err) {
    console.error(err);
    alertBox.className   = 'alert alert-danger';
    alertBox.textContent = 'No se pudo conectar con el servidor.';
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Guardar cambios';
  }
}

// ADMIN — ELIMINAR POST
async function eliminarPost(id) {
  if (!confirm('¿Seguro que querés eliminar esta publicación?')) return;

  try {
    const token = getToken();
    const res   = await fetch(`/api/posts/${id}`, {
      method:  'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    if (!res.ok || !data.ok) {
      mostrarToast('Error al eliminar la publicación ❌');
      return;
    }

    await cargarPosts();
    mostrarToast('Publicación eliminada ✅');

  } catch (err) {
    console.error(err);
    mostrarToast('No se pudo conectar con el servidor ❌');
  }
}

function mostrarError(mensaje) {
  const container = document.getElementById('posts-container');
  if (container) {
    container.innerHTML = `<p class="text-danger text-center w-100">${mensaje}</p>`;
  }
}

function validarPost(title, description) {
  if (title.length < 25) {
    return 'El título debe tener al menos 25 caracteres.';
  }
  if (title.length > 45) {
    return `El título no puede superar los 45 caracteres. Actualmente tiene ${title.length}.`;
  }
  if (description.length < 90) {
    return 'La descripción debe tener al menos 90 caracteres.';
  }
  if (description.length > 300) {
    return `La descripción no puede superar los 300 caracteres. Actualmente tiene ${description.length}.`;
  }
  return null;
}

function configurarContadores() {
  const cpTitle = document.getElementById('cp-title');
  const cpDesc  = document.getElementById('cp-description');
  const epTitle = document.getElementById('ep-title');
  const epDesc  = document.getElementById('ep-description');

  if (cpTitle) cpTitle.addEventListener('input', () => {
    document.getElementById('cp-title-count').textContent = `${cpTitle.value.length}/45`;
  });
  if (cpDesc) cpDesc.addEventListener('input', () => {
    document.getElementById('cp-desc-count').textContent = `${cpDesc.value.length}/300`;
  });
  if (epTitle) epTitle.addEventListener('input', () => {
    document.getElementById('ep-title-count').textContent = `${epTitle.value.length}/45`;
  });
  if (epDesc) epDesc.addEventListener('input', () => {
    document.getElementById('ep-desc-count').textContent = `${epDesc.value.length}/300`;
  });
}

// ADMIN — USUARIOS
let todosLosUsuarios = [];

function configurarBtnUsuarios() {
  const btn = document.getElementById('btn-usuarios');
  if (!btn) return;
  btn.addEventListener('click', () => abrirUsersModal());
}

async function abrirUsersModal() {
  document.getElementById('users-modal').style.display = 'flex';
  document.getElementById('user-search').value = '';
  await cargarUsuarios();
}

function closeUsersModal() {
  document.getElementById('users-modal').style.display = 'none';
}

async function cargarUsuarios() {
  try {
    const token = getToken();
    const res   = await fetch('/api/users', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    todosLosUsuarios = data.data || [];
    renderUsuarios(todosLosUsuarios);
  } catch (err) {
    console.error('Error al cargar usuarios:', err);
  }
}

function renderUsuarios(usuarios) {
  const list = document.getElementById('users-list');
  if (!list) return;
  list.innerHTML = '';

  if (usuarios.length === 0) {
    list.innerHTML = `<p style="color:#6b7280;text-align:center;font-size:14px;">No hay usuarios con publicaciones.</p>`;
    return;
  }

  usuarios.forEach(user => {
    const initials = (user.user_name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    const card = document.createElement('div');
    card.style.cssText = `
      display:flex;align-items:center;gap:14px;
      padding:14px 16px;border-radius:16px;
      border:1px solid #e8edf5;background:white;
    `;
    card.innerHTML = `
      <div style="
        width:44px;height:44px;border-radius:50%;
        background:#ddf7f2;display:flex;align-items:center;
        justify-content:center;font-weight:600;font-size:14px;
        color:#20b39d;flex-shrink:0;overflow:hidden;
      ">
        ${user.avatar_url
          ? `<img src="${user.avatar_url}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'">`
          : initials}
      </div>
      <div style="flex:1;min-width:0;">
        <p style="font-weight:600;font-size:15px;color:#17212b;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${user.user_name}</p>
        <p style="font-size:13px;color:#6b7280;margin:2px 0 0;">${user.email} · <strong>${user.post_count}</strong> publicación${user.post_count !== 1 ? 'es' : ''}</p>
      </div>
      <div style="display:flex;gap:8px;flex-shrink:0;">
        <button class="btn-ver-posts" title="Ver publicaciones" style="
          width:34px;height:34px;border:none;border-radius:50%;
          background:#f0fdf9;color:#20b39d;cursor:pointer;font-size:16px;
          display:flex;align-items:center;justify-content:center;
        "><i class="bi bi-eye-fill"></i></button>
        <button class="btn-edit-user" title="Editar usuario" style="
          width:34px;height:34px;border:none;border-radius:50%;
          background:#e8f0ff;color:#3b82f6;cursor:pointer;font-size:14px;
          display:flex;align-items:center;justify-content:center;
        "><i class="bi bi-pencil-fill"></i></button>
        <button class="btn-delete-user" title="Eliminar usuario" style="
          width:34px;height:34px;border:none;border-radius:50%;
          background:#fee2e2;color:#ef4444;cursor:pointer;font-size:14px;
          display:flex;align-items:center;justify-content:center;
        "><i class="bi bi-trash-fill"></i></button>
      </div>
    `;

    card.querySelector('.btn-ver-posts').addEventListener('click', () => verPostsDeUsuario(user));
    card.querySelector('.btn-edit-user').addEventListener('click', () => abrirEditarUsuario(user));
    card.querySelector('.btn-delete-user').addEventListener('click', () => eliminarUsuario(user));

    list.appendChild(card);
  });
}

function filtrarUsuarios() {
  const query = document.getElementById('user-search').value.trim().toLowerCase();
  const filtrados = todosLosUsuarios.filter(u =>
    (u.user_name || '').toLowerCase().includes(query) ||
    (u.email     || '').toLowerCase().includes(query)
  );
  renderUsuarios(filtrados);
}

async function verPostsDeUsuario(user) {
  document.getElementById('user-posts-title').textContent    = `Publicaciones de ${user.user_name}`;
  document.getElementById('user-posts-subtitle').textContent = `${user.post_count} publicación${user.post_count !== 1 ? 'es' : ''} activa${user.post_count !== 1 ? 's' : ''}`;
  document.getElementById('user-posts-modal').style.display  = 'flex';
  document.getElementById('user-posts-list').innerHTML       = '<p style="color:#6b7280;text-align:center;">Cargando...</p>';

  try {
    const token = getToken();
    const res   = await fetch(`/api/users/${user.id_user}/posts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    renderPostsDeUsuario(data.data || []);
  } catch (err) {
    console.error('Error al cargar posts del usuario:', err);
  }
}

function renderPostsDeUsuario(posts) {
  const list = document.getElementById('user-posts-list');
  list.innerHTML = '';

  if (posts.length === 0) {
    list.innerHTML = `<p style="color:#6b7280;text-align:center;">Sin publicaciones.</p>`;
    return;
  }

  posts.forEach(post => {
    const card = document.createElement('div');
    card.style.cssText = `
      display:flex;gap:14px;padding:14px;
      border-radius:14px;border:1px solid #e8edf5;background:white;
    `;
    card.innerHTML = `
      <div style="
        width:70px;height:70px;border-radius:10px;
        overflow:hidden;flex-shrink:0;background:#ddf7f2;
        display:flex;align-items:center;justify-content:center;font-size:24px;
      ">
        ${post.image_url
          ? `<img src="${post.image_url}" style="width:100%;height:100%;object-fit:cover;">`
          : `<i class="bi bi-image" style="color:#20b39d;"></i>`}
      </div>
      <div style="flex:1;min-width:0;">
        <p style="font-weight:600;font-size:14px;color:#17212b;margin:0 0 4px;">${post.title}</p>
        <p style="font-size:12px;color:#3ed6bc;font-weight:600;margin:0 0 4px;">${post.category}</p>
        <p style="font-size:12px;color:#6b7280;margin:0;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">${post.description}</p>
      </div>
    `;
    list.appendChild(card);
  });
}

function closeUserPostsModal() {
  document.getElementById('user-posts-modal').style.display = 'none';
}

function abrirEditarUsuario(user) {
  document.getElementById('eu-id').value   = user.id_user;
  document.getElementById('eu-name').value = user.user_name;
  document.getElementById('edit-user-alert').className = 'd-none';
  document.getElementById('edit-user-modal').style.display = 'flex';
}

function closeEditUserModal() {
  document.getElementById('edit-user-modal').style.display = 'none';
}

async function guardarEdicionUsuario() {
  const id       = document.getElementById('eu-id').value;
  const name     = document.getElementById('eu-name').value.trim();
  const alertBox = document.getElementById('edit-user-alert');

  if (!name) {
    alertBox.className   = 'alert alert-danger';
    alertBox.textContent = 'El nombre es obligatorio.';
    return;
  }

  try {
    const token = getToken();
    const res   = await fetch(`/api/users/${id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();

    if (!res.ok || !data.ok) {
      alertBox.className   = 'alert alert-danger';
      alertBox.textContent = data.message || 'Error al guardar.';
      return;
    }

    closeEditUserModal();
    await cargarUsuarios();
    mostrarToast('Usuario actualizado ✅');

  } catch (err) {
    console.error(err);
    alertBox.className   = 'alert alert-danger';
    alertBox.textContent = 'No se pudo conectar con el servidor.';
  }
}

async function eliminarUsuario(user) {
  if (!confirm(`¿Seguro que querés deshabilitar a ${user.user_name}? También se desactivarán sus publicaciones.`)) return;

  try {
    const token = getToken();
    const res   = await fetch(`/api/users/${user.id_user}`, {
      method:  'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    if (!res.ok || !data.ok) {
      mostrarToast('Error al deshabilitar usuario ❌');
      return;
    }

    await cargarUsuarios();
    mostrarToast('Usuario deshabilitado ✅');

  } catch (err) {
    console.error(err);
    mostrarToast('No se pudo conectar con el servidor ❌');
  }
}
