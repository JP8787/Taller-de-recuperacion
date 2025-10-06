const fichasUrl = 'https://raw.githubusercontent.com/CesarMCuellarCha/apis/refs/heads/main/JUICIOS_ADSO.json';



export async function obtenerFichas() {
  const respuesta = await fetch(fichasUrl);
  const datos = await respuesta.json();
  const fichas = Array.isArray(datos?.fichas) ? datos.fichas : [];

  return fichas
    .filter((item) => item && item.codigo)
    .map((item) => ({
      codigo: item.codigo,
      url: normalizarUrl(item.url),
    }));
}
