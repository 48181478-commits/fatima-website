(function () {
  'use strict';

  var loginForm = document.getElementById('loginForm');
  if (!loginForm) return;

  var errorBox = document.getElementById('errorBox');

  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    errorBox.hidden = true;
    var btn = document.getElementById('btnLogin');
    btn.disabled = true;
    btn.textContent = 'Entrando…';
    try {
      var { error } = await db.auth.signInWithPassword({
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value,
      });
      if (error) throw error;
      window.location.href = 'panel.html';
    } catch (err) {
      errorBox.textContent = 'Correo o contraseña incorrectos.';
      errorBox.hidden = false;
      btn.disabled = false;
      btn.textContent = 'Iniciar sesión';
    }
  });

  db.auth.getSession().then(function (result) {
    if (result.data.session) window.location.href = 'panel.html';
  });
})();
