(function () {
  'use strict';

  var usuarioEmail = document.getElementById('usuarioEmail');
  var btnLogout = document.getElementById('btnLogout');
  if (!btnLogout) return;

  db.auth.getSession().then(function (result) {
    if (!result.data.session) {
      window.location.href = 'admin.html';
      return;
    }
    if (usuarioEmail) usuarioEmail.textContent = result.data.session.user.email;
  });

  btnLogout.addEventListener('click', async function () {
    await db.auth.signOut();
    window.location.href = 'admin.html';
  });
})();
