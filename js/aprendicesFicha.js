const normalizarUrl = (url) =>
  typeof url === 'string' ? url.replace('/refs/heads/', '/') : '';

const limpiar = (valor) =>
  valor === undefined || valor === null ? '' : String(valor).trim();

const normalizarClave = (texto) =>
  limpiar(texto)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

const obtenerCampo = (registro, clave) => {
  if (!registro) {
    return '';
  }

  if (clave in registro) {
    return registro[clave];
  }

  const claveNormalizada = normalizarClave(clave);
  const llave = Object.keys(registro).find(
    (key) => normalizarClave(key) === claveNormalizada
  );

  return llave ? registro[llave] : '';
};

const agruparAprendices = (registros) => {
  const aprendices = new Map();

  registros.forEach((registro) => {
    const documento = limpiar(obtenerCampo(registro, 'Numero de Documento'));
    if (!documento) {
      return;
    }

    const tipoDocumento = limpiar(obtenerCampo(registro, 'Tipo de Documento'));
    const nombres = limpiar(obtenerCampo(registro, 'Nombre'));
    const apellidos = limpiar(obtenerCampo(registro, 'Apellidos'));
    const programa =
      limpiar(obtenerCampo(registro, 'Programa')) ||
      limpiar(obtenerCampo(registro, 'PROGRAMA'));
    const estado = limpiar(obtenerCampo(registro, 'Estado'));
    const competenciaNombre = limpiar(obtenerCampo(registro, 'Competencia'));

    if (!aprendices.has(documento)) {
      aprendices.set(documento, {
        id: documento,
        documento,
        tipoDocumento,
        nombres,
        apellidos,
        programa,
        estado,
        competencias: new Map(),
      });
    }

    const aprendiz = aprendices.get(documento);

    if (!aprendiz.competencias.has(competenciaNombre)) {
      aprendiz.competencias.set(competenciaNombre, {
        nombre: competenciaNombre,
        resultados: [],
      });
    }

    const competencia = aprendiz.competencias.get(competenciaNombre);

    const resultadoNombre = limpiar(
      obtenerCampo(registro, 'Resultado de Aprendizaje')
    );
    const juicio = limpiar(
      obtenerCampo(registro, 'Juicio de Evaluacion') ||
        obtenerCampo(registro, 'Juicio de Evaluación')
    );
    const funcionario = limpiar(
      obtenerCampo(registro, 'Funcionario que registro el juicio evaluativo')
    );
    const fechaCompleta = limpiar(
      obtenerCampo(registro, 'Fecha y Hora del Juicio Evaluativo')
    );
    const [fecha, ...restoHora] = fechaCompleta.split(/\s+/);
    const hora = restoHora.join(' ').trim();

    competencia.resultados.push({
      nombre: resultadoNombre,
      juicio,
      fecha: fecha || '',
      hora,
      instructor: funcionario,
    });
  });

  return Array.from(aprendices.values())
    .map((aprendiz) => ({
      ...aprendiz,
      competencias: Array.from(aprendiz.competencias.values()),
    }))
    .sort((a, b) =>
      `${a.nombres} ${a.apellidos}`.localeCompare(
        `${b.nombres} ${b.apellidos}`,
        'es'
      )
    );
};

export async function obtenerAprendicesFicha(urlFicha) {
  const url = normalizarUrl(urlFicha);
  if (!url) {
    throw new Error('La URL de la ficha no es valida.');
  }

  const respuesta = await fetch(url);
  if (!respuesta.ok) {
    throw new Error('No fue posible obtener los aprendices de la ficha.');
  }

  const registros = await respuesta.json();
  if (!Array.isArray(registros)) {
    throw new Error('El formato de los datos recibidos no es valido.');
  }

  return {
    totalRegistros: registros.length,
    aprendices: agruparAprendices(registros),
  };
}