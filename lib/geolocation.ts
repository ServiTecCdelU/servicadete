// "Si el navegador no lo permite, seguí igual": nunca bloquea la acción, en el peor
// caso manda sin coordenadas.
export function obtenerUbicacion(): Promise<{ lat?: number; lng?: number }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve({})
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve({}),
      { enableHighAccuracy: true, timeout: 4000, maximumAge: 30_000 },
    )
  })
}
