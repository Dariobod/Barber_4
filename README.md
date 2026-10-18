# The Pip's Barber — Versión 4 (`Barber_4` · Híbrido Web 2D + Estudio Virtual 3D)

Sitio web oficial e interactivo de **The Pip's Barber** (Pipa · Studio · Corte & Barba), combinando:
1. **Web Principal Clásica (`/`)**: Basada en `Barber_2`, ultraliviana, con agenda **Setmore** en vivo, carrusel de videos *Puertas Adentro*, presentación de Pipa, servicios y preguntas frecuentes.
2. **Transición *"Abrir las puertas del estudio"* y Botón Flotante**: Accesos desde el botón flotante `💈 ESTUDIO 3D`, la portada (Hero), el menú y el banner de *Puertas Adentro*, que activan una animación de puertas dobles de barbería en perspectiva 3D con sonido de campanilla de recepción.
3. **Estudio Virtual 3D (`/estudio-3d/`)**: Basado en `Barber_3` con **Three.js**, donde el visitante puede caminar por la barbería, sentarse en el sillón central, alternar entre luz natural de día y luz artificial de noche, interactuar con herramientas (máquina, tijeras, rociador, aro ETHEOS, tocadiscos con la música de *02 - Pipa en Acción*, mate, timbre, cilindros de peluquería) y volver en cualquier momento a la web clásica (`← Web Clásica`).

---

## 🚀 Enlaces del Proyecto

- **Producción (Cloudflare Pages)**: [https://barber-pips-4.pages.dev/](https://barber-pips-4.pages.dev/)
- **Estudio 3D directo**: [https://barber-pips-4.pages.dev/estudio-3d/](https://barber-pips-4.pages.dev/estudio-3d/)
- **Repositorio GitHub**: [https://github.com/Dariobod/Barber_4](https://github.com/Dariobod/Barber_4) (`main`)

---

## 💻 Ejecución Local

```bash
npm start
```
Abre [http://localhost:3004](http://localhost:3004) en tu navegador.

---

## 📦 Despliegue Continuo (CI/CD)

El proyecto **`barber-pips-4`** en Cloudflare Pages está conectado nativamente a la rama `main` de `Dariobod/Barber_4`. Para publicar cambios:

```bash
git add .
git commit -m "Descripción del cambio"
git push origin main
```
