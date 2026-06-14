document.addEventListener('DOMContentLoaded', () => {

    const API_URL = '/api';
  
    const form     = document.getElementById('login-form');
    const btnLogin = document.getElementById('btn-login');
    const alertBox = document.getElementById('alert-box');
    const remember = document.getElementById('remember');
  
    if (localStorage.getItem('fivox_token') || sessionStorage.getItem('fivox_token')) {
      window.location.href = '/home';
    }
  
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
  
      const email    = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
  
      if (!email || !password) {
        showAlert('Por favor completá todos los campos.', 'danger');
        return;
      }
  
      setLoading(true);
      clearAlert();
  
      try {
        const res = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
  
        const data = await res.json();
  
        if (!res.ok || !data.ok) {
          showAlert(data.message || 'Error al iniciar sesión.', 'danger');
          return;
        }
  
        const storage = remember.checked ? localStorage : sessionStorage;
        storage.setItem('fivox_token', data.data.token);
        storage.setItem('fivox_user', JSON.stringify(data.data.user));
  
        showAlert(`¡Bienvenido/a, ${data.data.user.name || data.data.user.email}! 🎉`, 'success');
        setTimeout(() => window.location.href = '/home', 1000);
  
      } catch (err) {
        console.error(err);
        showAlert('No se pudo conectar con el servidor. Verificá que el backend esté corriendo.', 'danger');
      } finally {
        setLoading(false);
      }
    });
  
    function showAlert(message, type) {
      alertBox.className = `alert alert-${type} alert-msg`;
      alertBox.textContent = message;
    }
  
    function clearAlert() {
      alertBox.className = 'd-none';
      alertBox.textContent = '';
    }
  
    function setLoading(loading) {
      btnLogin.disabled = loading;
      btnLogin.innerHTML = loading
        ? '<span class="spinner-border spinner-border-sm me-2"></span> Ingresando...'
        : '<i class="bi bi-box-arrow-in-right me-2"></i> Ingresar';
    }
  
  });