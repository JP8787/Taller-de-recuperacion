const password = '06102025';
const storageKey = 'usuario';
const loginMessageKey = 'mensajeLogin';

const mostrarMensaje = (elemento, texto) => {
  if (!elemento) {
    return;
  }

  if (texto) {
    elemento.textContent = texto;
    elemento.classList.remove('is-hidden');
  } else {
    elemento.textContent = '';
    elemento.classList.add('is-hidden');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const formulario = document.getElementById('loginForm');
  const campoUsuario = document.getElementById('usuario');
  const campocontraseña = document.getElementById('contraseña');
  const mensaje = document.getElementById('mensajeLogin');

  const mensajePrevio = sessionStorage.getItem(loginMessageKey) || '';
  if (mensajePrevio) {
    mostrarMensaje(mensaje, mensajePrevio);
    sessionStorage.removeItem(loginMessageKey);
  }

  formulario?.addEventListener('submit', (event) => {
    event.preventDefault();

    const usuario = campoUsuario?.value?.trim() || '';
    const contraseña = campocontraseña?.value?.trim() || '';

    if (!usuario) {
      mostrarMensaje(mensaje, 'Ingresa tu nombre.');
      campoUsuario?.focus();
      return;
    }

    if (contraseña !== password) {
      mostrarMensaje(mensaje, 'La contraseña es incorrecta.');
      campocontraseña?.focus();
      return;
    }

    localStorage.setItem(storageKey, usuario);
    mostrarMensaje(mensaje, 'Ingreso exitoso.');
    window.location.href = 'juiciosAprendicesFicha.html';
  });
});
