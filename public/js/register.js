document.addEventListener('DOMContentLoaded', () => {

    const API_URL = '/api';
    const form        = document.getElementById('register-form');
    const btnRegister = document.getElementById('btn-register');
    const alertBox    = document.getElementById('alert-box');
  
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
  
      const name     = document.getElementById('name').value.trim();
      const email    = document.getElementById('email').value.trim();
      const phone    = document.getElementById('phone').value.trim();
      const password = document.getElementById('password').value;

      if (!name || !email || !phone || !password) {
        showAlert('Por favor completá todos los campos.', 'danger');
        return;
      }
  
      if (password.length < 6) {
        showAlert('La contraseña debe tener al menos 6 caracteres.', 'danger');
        return;
      }
  
      setLoading(true);
      clearAlert();
  
      try {
        const res = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, phone }),
        });
  
        const data = await res.json();
  
        if (!res.ok || !data.ok) {
          showAlert(data.message || 'Error al registrarse.', 'danger');
          return;
        }
  
        sessionStorage.setItem('fivox_token', data.data.token);
        sessionStorage.setItem('fivox_user', JSON.stringify(data.data.user));
  
        showAlert('¡Cuenta creada! Redirigiendo...', 'success');
        setTimeout(() => window.location.href = '/home', 1500);
  
      } catch (err) {
        console.error(err);
        showAlert('No se pudo conectar con el servidor.', 'danger');
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
      btnRegister.disabled = loading;
      btnRegister.innerHTML = loading
        ? '<span class="spinner-border spinner-border-sm me-2"></span> Registrando...'
        : '<i class="bi bi-person-plus me-2"></i> Registrarme';
    }
  
  });