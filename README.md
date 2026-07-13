# HealthLab Beta 1.0 RC1.1

Hotfix de despliegue para asegurar que GitHub Pages/Safari cargan el HTML y recursos nuevos.

Comprobación visual: el encabezado muestra `RC1.1`; el bloque de sueño muestra puntuación Apple 0–100; los tipos de entrenamiento muestran emojis.

# HealthLab — Beta 1.0 RC1

Aplicación web progresiva para el registro adaptativo de salud, sueño y entrenamiento.

## Publicación en GitHub Pages
Sube todos los archivos y carpetas de este paquete a la raíz del repositorio oficial. GitHub Pages debe desplegar la rama `main` desde `/ (root)`.

## Actualización en iPhone/iPad
Tras publicar, abre HealthLab en Safari y recarga. Si la versión instalada conserva la interfaz anterior, cierra la app desde el selector de aplicaciones, vuelve a abrirla y recarga Safari. El service worker de RC1 usa una caché nueva.

## Prueba RC1
Usar durante 7 días. Solo se corrigen bloqueos o datos incorrectos. Las ideas nuevas pasan al Backlog.

## Privacidad y copias
Los datos permanecen en `localStorage` del navegador. Exporta una copia completa desde Ajustes de forma periódica.

## Documentación
- `docs/BLUEPRINT.md`
- `docs/ROADMAP.md`
- `docs/CHANGELOG.md`
- `docs/BACKLOG.md`
