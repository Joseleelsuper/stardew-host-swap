/**
 * Stardew Valley Host Swap Tool
 * Updated version (2025) to handle ZIP files and modern save structure
 * 
 * Este archivo es solo un punto de entrada que importa los módulos necesarios.
 * Todos los módulos están en la carpeta 'modules'.
 */

// Este código se ejecutará inmediatamente al cargar el script
console.log("Cargando Stardew Valley Host Swap Tool...");

// Importar el módulo principal
import './modules/main.js';

// Añadir un evento para saber cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM completamente cargado, verificando que todo esté listo");
});

// El resto del archivo ha sido refactorizado y movido a los módulos correspondientes.
// Este archivo ahora solo sirve como punto de entrada.

/* IMPORTANTE: Todo el código antiguo ha sido eliminado para evitar conflictos con la nueva estructura modular.
   Ver la carpeta modules/ para los archivos individuales:
   - config.js - Configuraciones y variables globales
   - fileHandler.js - Manejo de archivos
   - characterHandler.js - Procesamiento de personajes
   - dataProcessor.js - Procesamiento de datos
   - uiController.js - Controlador de UI
   - utils.js - Funciones de utilidad
   - main.js - Archivo principal de integración
*/
