import { obtenerFichas } from './fichasADSO.js';
import { obtenerAprendicesFicha } from './aprendicesFicha.js';

const storageKey = 'usuario';
const loginMessageKey = 'mensajeLogin';

const selectFicha = document.getElementById('selectFicha');
const selectAprendiz = document.getElementById('selectAprendiz');
const etiquetaUsuario = document.getElementById('nombreUsuario');
const etiquetaPrograma = document.getElementById('programa');
const campoNombres = document.getElementById('nombres');
const campoApellidos = document.getElementById('apellidos');
const campoEstado = document.getElementById('estadoAprendiz');
const campoAprobados = document.getElementById('juiciosAprobados');
const campoPendientes = document.getElementById('juiciosPendientes');
const tablaResultados = document.getElementById('tablaResultados');
const botonSalir = document.getElementById('btnSalir');
const mensajeEstado = document.querySelector('[data-role="estado"]');
const resumenFicha = document.querySelector('[data-role="resumen-ficha"]');
const loader = document.getElementById('loader');

const cacheAprendices = new Map();
let fichas = [];
let aprendicesActuales = [];

const mostrarLoader = (visible) => {
  if (loader) {
    loader.style.display = visible ? 'flex' : 'none';
  }
};

const mostrarMensaje = (texto, variante = 'info') => {
  if (!mensajeEstado) {
    return;
  }

  if (!texto) {
    mensajeEstado.textContent = '';
    mensajeEstado.classList.add('is-hidden');
    mensajeEstado.removeAttribute('data-variant');
    return;
  }

  mensajeEstado.textContent = texto;
  mensajeEstado.classList.remove('is-hidden');
  mensajeEstado.setAttribute('data-variant', variante);
};

const limpiarTabla = () => {
  if (tablaResultados) {
    tablaResultados.innerHTML =
      '<tr><td colspan="5">Selecciona un aprendiz para ver el detalle.</td></tr>';
  }
};

const limpiarInfo = () => {
  campoNombres.textContent = '';
  campoApellidos.textContent = '';
  campoEstado.textContent = '';
  campoAprobados.textContent = '0';
  campoPendientes.textContent = '0';
  etiquetaPrograma.textContent = '';
  limpiarTabla();
};

const llenarResumenFicha = (codigo, cantidadAprendices, totalRegistros) => {
  if (!resumenFicha) {
    return;
  }

  if (!codigo) {
    resumenFicha.innerHTML = '';
    return;
  }

  resumenFicha.innerHTML = `
    <ul class="resumen-lista">
      <li class="resumen-lista__item">
        <span class="resumen-etiqueta">Ficha:</span>
        <span class="resumen-valor">${codigo}</span>
      </li>
      <li class="resumen-lista__item">
        <span class="resumen-etiqueta">Aprendices:</span>
        <span class="resumen-valor">${cantidadAprendices}</span>
      </li>
      <li class="resumen-lista__item">
        <span class="resumen-etiqueta">Registros:</span>
        <span class="resumen-valor">${totalRegistros}</span>
      </li>
    </ul>
  `;
};

const verificarSesion = () => {
  const usuario = localStorage.getItem(storageKey) || '';

  if (!usuario) {
    sessionStorage.setItem(
      loginMessageKey,
      'Debes ingresar con usuario y contrasena antes de continuar.'
    );
    window.location.replace('index.html');
    return false;
  }

  etiquetaUsuario.textContent = usuario;
  return true;
};

const llenarSelect = (select, placeholder, lista, formato) => {
  select.innerHTML = '';

  const opcion = document.createElement('option');
  opcion.value = '';
  opcion.textContent = placeholder;
  select.appendChild(opcion);

  lista.forEach((item) => {
    const option = document.createElement('option');
    option.value = item.documento;
    option.textContent = formato(item);
    select.appendChild(option);
  });
};

const calcularJuicios = (competencias) => {
  let aprobados = 0;
  let pendientes = 0;

  competencias.forEach((competencia) => {
    competencia.resultados.forEach((resultado) => {
      const texto = (resultado.juicio || '').toUpperCase();

      if (texto === 'APROBADO') {
        aprobados += 1;
      } else if (texto === 'POR EVALUAR') {
        pendientes += 1;
      }
    });
  });

  return { aprobados, pendientes };
};

const mostrarAprendiz = (aprendiz) => {
  if (!aprendiz) {
    limpiarInfo();
    return;
  }

  campoNombres.textContent = aprendiz.nombres || '';
  campoApellidos.textContent = aprendiz.apellidos || '';
  campoEstado.textContent = aprendiz.estado || 'Sin dato';
  etiquetaPrograma.textContent = aprendiz.programa || '';

  const totales = calcularJuicios(aprendiz.competencias || []);
  campoAprobados.textContent = String(totales.aprobados);
  campoPendientes.textContent = String(totales.pendientes);

  if (!tablaResultados) {
    return;
  }

  if (!aprendiz.competencias || !aprendiz.competencias.length) {
    limpiarTabla();
    return;
  }

  const filas = [];

  aprendiz.competencias.forEach((competencia) => {
    competencia.resultados.forEach((resultado, indice) => {
      const primeraColumna =
        indice === 0
          ? `<td rowspan="${competencia.resultados.length}">${
              competencia.nombre || 'Competencia'
            }</td>`
          : '';

      const fila = `
        <tr>
          ${primeraColumna}
          <td>${resultado.nombre || 'Sin informacion'}</td>
          <td>${resultado.juicio || 'Sin informacion'}</td>
          <td>${resultado.fecha || ''} ${resultado.hora || ''}</td>
          <td>${resultado.instructor || ''}</td>
        </tr>
      `;

      filas.push(fila);
    });
  });

  tablaResultados.innerHTML = filas.join('');
};

const cargarAprendices = async (codigo) => {
  if (!codigo) {
    return { aprendices: [], totalRegistros: 0 };
  }

  if (cacheAprendices.has(codigo)) {
    return cacheAprendices.get(codigo);
  }

  const ficha = fichas.find((item) => String(item.codigo) === String(codigo));

  if (!ficha) {
    throw new Error('La ficha seleccionada no existe.');
  }

  const datos = await obtenerAprendicesFicha(ficha.url);
  cacheAprendices.set(codigo, datos);

  return datos;
};

const manejarCambioFicha = async (event) => {
  const codigo = event.target.value;

  aprendicesActuales = [];
  llenarSelect(selectAprendiz, 'Seleccione un aprendiz', [], () => '');
  selectAprendiz.disabled = true;
  limpiarInfo();
  llenarResumenFicha('', 0, 0);

  if (!codigo) {
    mostrarMensaje('Selecciona una ficha para continuar.');
    return;
  }

  mostrarLoader(true);
  mostrarMensaje('Cargando aprendices...', 'info');

  try {
    const datosFicha = await cargarAprendices(codigo);
    aprendicesActuales = datosFicha.aprendices || [];

    if (!aprendicesActuales.length) {
      mostrarMensaje('Esta ficha no tiene aprendices registrados.', 'alerta');
      llenarResumenFicha(codigo, 0, datosFicha.totalRegistros || 0);
      return;
    }

    llenarSelect(
      selectAprendiz,
      'Seleccione un aprendiz',
      aprendicesActuales,
      (item) => `${item.documento} - ${item.nombres} ${item.apellidos}`
    );

    selectAprendiz.disabled = false;
    llenarResumenFicha(
      codigo,
      aprendicesActuales.length,
      datosFicha.totalRegistros || 0
    );
    mostrarMensaje('Selecciona un aprendiz para ver el detalle.', 'info');
  } catch (error) {
    console.error(error);
    mostrarMensaje('No fue posible cargar los aprendices.', 'alerta');
  } finally {
    mostrarLoader(false);
  }
};

const manejarCambioAprendiz = (event) => {
  const documento = event.target.value;

  if (!documento) {
    limpiarInfo();
    return;
  }

  const aprendiz = aprendicesActuales.find(
    (item) => String(item.documento) === String(documento)
  );

  if (!aprendiz) {
    mostrarMensaje('No se encontro informacion del aprendiz.', 'alerta');
    limpiarInfo();
    return;
  }

  mostrarMensaje('Consulta actualizada.', 'exito');
  mostrarAprendiz(aprendiz);
};

const salir = () => {
  localStorage.removeItem(storageKey);
  sessionStorage.setItem(loginMessageKey, 'Sesion finalizada correctamente.');
  window.location.replace('index.html');
};

const iniciar = async () => {
  if (!verificarSesion()) {
    return;
  }

  limpiarInfo();
  mostrarMensaje('Cargando fichas...', 'info');
  mostrarLoader(true);
  llenarSelect(selectFicha, 'Seleccione una ficha', [], () => '');
  llenarSelect(selectAprendiz, 'Seleccione un aprendiz', [], () => '');
  selectAprendiz.disabled = true;

  try {
    fichas = await obtenerFichas();

    if (!fichas.length) {
      mostrarMensaje('No se encontraron fichas disponibles.', 'alerta');
      return;
    }

    fichas.forEach((ficha) => {
      const option = document.createElement('option');
      option.value = ficha.codigo;
      option.textContent = ficha.codigo;
      selectFicha.appendChild(option);
    });

    mostrarMensaje('Selecciona una ficha para comenzar.', 'info');
  } catch (error) {
    console.error(error);
    mostrarMensaje('No fue posible cargar las fichas.', 'alerta');
  } finally {
    mostrarLoader(false);
  }

  selectFicha.addEventListener('change', manejarCambioFicha);
  selectAprendiz.addEventListener('change', manejarCambioAprendiz);
  botonSalir.addEventListener('click', salir);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciar);
} else {
  iniciar();
}

