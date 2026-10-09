// Único helper de fetch al API. Lanza Error con .status y .message en fallos.
export async function api(ruta, { method = 'GET', body, headers = {} } = {}) {
  const opciones = { method, credentials: 'same-origin', headers: { ...headers } };

  if (body instanceof FormData) {
    opciones.body = body;
  } else if (body !== undefined) {
    opciones.headers['Content-Type'] = 'application/json';
    opciones.body = JSON.stringify(body);
  }

  const res = await fetch(`/api${ruta}`, opciones);
  const datos = res.status === 204 ? null : await res.json().catch(() => null);

  if (!res.ok) {
    const error = new Error(datos?.error || `Error ${res.status}`);
    error.status = res.status;
    error.code = datos?.code;
    throw error;
  }

  return datos;
}
