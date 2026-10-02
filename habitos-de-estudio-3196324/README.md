# habitos de estudio 3196324 — FOCO 25 (P0)

> Aplicación web minimalista de concentración y hábitos de estudio con técnica Pomodoro (25/5), compromiso analógico anti-distracción del celular y bitácora semanal.

## 📦 Estructura del Proyecto

```text
habitos-de-estudio-3196324/
├── index.html        # Estructura semántica HTML5 con diseño móvil optimizado
├── styles.css        # Paleta vintage cálida (pergamino, tinta, terracota)
├── app.js            # Lógica completa: temporizador, Web Audio API, persistencia local y gráficos
└── README.md         # Documentación de instalación y control de versiones
```

## 🚀 Instrucciones para Git y Primer Commit

Para preparar el repositorio local y subir la primera versión funcional a GitHub:

```bash
# 1. Posicionarse en la carpeta del proyecto
cd habitos-de-estudio-3196324

# 2. Inicializar el repositorio Git
git init

# 3. Preparar todos los archivos para el commit
git add .

# 4. Crear el commit oficial con el mensaje exacto solicitado:
git commit -m "P0: primera version generada con IA"

# 5. (Opcional) Vincular con tu repositorio remoto de GitHub
git remote add origin https://github.com/TU_USUARIO/habitos-de-estudio-3196324.git
git branch -M main
git push -u origin main
```

## ✨ Funcionalidades P0 Incluidas

1. **Temporizador Pomodoro 25/5**:
   - 25 minutos de estudio profundo + 5 minutos de descanso.
   - Controles de Iniciar, Pausar, Reiniciar y cambio de modo instantáneo.
   - Esfera circular táctil con progreso en tiempo real.

2. **Registro de Sesiones por Materia**:
   - Selección o ingreso de materias (Matemáticas, Historia, Programación, etc.).
   - Registro automático al terminar el tiempo o registro manual inmediato.
   - Persistencia local en el navegador mediante `localStorage`.

3. **Resumen y Gráfico Visual Semanal**:
   - Total de minutos acumulados de lunes a domingo.
   - Identificación automática del **Día más productivo (día récord)**.
   - Desglose porcentual y temporal por materia.
   - Historial editable de las últimas sesiones.

4. **Toque Innovador ("Foco Analógico")**:
   - Selector de compromiso anti-distracción antes de comenzar (ej. *"Acepto no tocar el celular por los próximos 25 min"*).
   - Generador nativo de tictac mecánico analógico y campana de meditación con Web Audio API (100% offline, sin dependencias pesadas).
