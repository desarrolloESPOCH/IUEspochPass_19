/**
 * Normaliza una cadena de texto eliminando tildes, diacríticos y convirtiendo a minúsculas
 * para comparaciones de búsqueda insensibles a mayúsculas, minúsculas y acentos.
 */
export function normalizarTexto(texto: string | null | undefined): string {
  if (texto === null || texto === undefined) return '';
  return String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Comprueba si un texto fuente contiene el texto de búsqueda ignorando tildes y mayúsculas/minúsculas.
 */
export function incluyeTexto(fuente: string | null | undefined, busqueda: string | null | undefined): boolean {
  if (!busqueda || busqueda.trim() === '') return true;
  if (!fuente) return false;
  return normalizarTexto(fuente).includes(normalizarTexto(busqueda));
}
