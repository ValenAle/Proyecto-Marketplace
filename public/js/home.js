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

function openModal(post) {
  document.getElementById('modal-title').textContent       = post.title;
  document.getElementById('modal-author').textContent      = post.author;
  document.getElementById('modal-description').textContent = post.description;
  document.getElementById('modal-image').src               = post.image_url || '';
  document.getElementById('modal-image').style.display     = post.image_url ? 'block' : 'none';
  document.getElementById('post-modal').style.display      = 'flex';
}

function closeModal() {
  document.getElementById('post-modal').style.display = 'none';
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