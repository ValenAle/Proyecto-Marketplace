let allPosts = []; 
document.addEventListener('DOMContentLoaded', () => {
  init();
});

async function init() {
  const token = getToken();

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
          </div>
        </div>
      </div>
    `;
    col.querySelector('.post').addEventListener('click', () => openModal(post));
    container.appendChild(col);
  });
}

// SUPPORT VIEW DISPLAY
// SOPORTE
let ticketActivoId = null;

function configurarBtnSoporte() {
  const btn = document.getElementById('btn-support');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    toggleSupportView();
    await cargarTickets();
  });
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
        <button class="ticket-view-btn" onclick="abrirTicket(${ticket.id_ticket}, '${ticket.subject || ''}')">
          Ver <i class="bi bi-chevron-right"></i>
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

async function abrirTicket(id, subject) {
  ticketActivoId = id;
  document.getElementById('chat-ticket-title').textContent = `Consulta #${id} — ${subject}`;

  const chatSection = document.getElementById('support-chat-section');
  if (chatSection) chatSection.style.display = 'flex';

  await cargarMensajes(id);
  await cargarTickets();
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
  const alertBox    = document.getElementById('create-post-alert');

  if (!title || !description || !id_category) {
    alertBox.className   = 'alert alert-danger';
    alertBox.textContent = 'Título, descripción y categoría son obligatorios.';
    return;
  }

  const btn = document.getElementById('btn-create-post');
  btn.disabled     = true;
  btn.textContent  = 'Publicando...';

  try {
    const token = getToken();
    const res   = await fetch('/api/posts', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        Authorization:   `Bearer ${token}`,
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
  btn.addEventListener('click', () => {
    document.getElementById('terms-modal').style.display = 'flex';
  });
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

