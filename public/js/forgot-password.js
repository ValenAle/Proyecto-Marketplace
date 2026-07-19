document.addEventListener('DOMContentLoaded', () => {

  const API_URL  = '/api/password';
  const alertBox = document.getElementById('alert-box');
  let emailGuardado = '';
  let codigoGuardado = '';

  window.enviarCodigo = async () => {
    const email = document.getElementById('fp-email').value.trim();
    if (!email) { showAlert('Ingresá tu email.', 'danger'); return; }

    setLoading('btn-send-code', true, 'Enviando...');
    clearAlert();

    try {
      const res  = await fetch(`${API_URL}/forgot`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) { showAlert(data.message, 'danger'); return; }

      emailGuardado = email;
      document.getElementById('fp-email-display').textContent = email;
      showStep('step-code');
      showAlert('Código enviado. Revisá tu bandeja de entrada.', 'success');

    } catch (err) {
      showAlert('No se pudo conectar con el servidor.', 'danger');
    } finally {
      setLoading('btn-send-code', false, '<i class="bi bi-send me-2"></i> Enviar código');
    }
  };

  window.verificarCodigo = async () => {
    const code = document.getElementById('fp-code').value.trim();
    if (!code || code.length < 6) { showAlert('Ingresá el código de 6 dígitos.', 'danger'); return; }

    setLoading('btn-verify-code', true, 'Verificando...');
    clearAlert();

    try {
      const res  = await fetch(`${API_URL}/verify`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: emailGuardado, code }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) { showAlert(data.message, 'danger'); return; }

      codigoGuardado = code;
      showStep('step-password');
      clearAlert();

    } catch (err) {
      showAlert('No se pudo conectar con el servidor.', 'danger');
    } finally {
      setLoading('btn-verify-code', false, '<i class="bi bi-check-circle me-2"></i> Verificar código');
    }
  };

  window.resetPassword = async () => {
    const newPassword     = document.getElementById('fp-new-password').value;
    const confirmPassword = document.getElementById('fp-confirm-password').value;

    if (!newPassword || !confirmPassword) { showAlert('Completá ambos campos.', 'danger'); return; }
    if (newPassword.length < 6) { showAlert('La contraseña debe tener al menos 6 caracteres.', 'danger'); return; }
    if (newPassword !== confirmPassword) { showAlert('Las contraseñas no coinciden.', 'danger'); return; }

    setLoading('btn-reset', true, 'Cambiando...');
    clearAlert();

    try {
      const res  = await fetch(`${API_URL}/reset`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: emailGuardado, code: codigoGuardado, newPassword }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) { showAlert(data.message, 'danger'); return; }

      showAlert('¡Contraseña actualizada! Redirigiendo al login...', 'success');
      setTimeout(() => window.location.href = '/', 2000);

    } catch (err) {
      showAlert('No se pudo conectar con el servidor.', 'danger');
    } finally {
      setLoading('btn-reset', false, '<i class="bi bi-lock-fill me-2"></i> Cambiar contraseña');
    }
  };

  window.volverAlEmail = () => {
    showStep('step-email');
    clearAlert();
  };

  function showStep(stepId) {
    ['step-email', 'step-code', 'step-password'].forEach(id => {
      document.getElementById(id).style.display = id === stepId ? 'block' : 'none';
    });
  }

  function showAlert(message, type) {
    alertBox.className   = `alert alert-${type}`;
    alertBox.textContent = message;
  }

  function clearAlert() {
    alertBox.className   = 'd-none';
    alertBox.textContent = '';
  }

  function setLoading(btnId, loading, html) {
    const btn = document.getElementById(btnId);
    btn.disabled   = loading;
    btn.innerHTML  = loading ? '<span class="spinner-border spinner-border-sm me-2"></span>' + html : html;
  }

});