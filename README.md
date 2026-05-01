# Alpha Running Club 🏃‍♂️⚡️

Plataforma web oficial del **Alpha Running Club** basada en Santa Rosa de Copán, Honduras. Este proyecto combina ciencia deportiva, comunidad y tecnología para ofrecer a los corredores herramientas de precisión y un seguimiento detallado de su progreso.

Desarrollado bajo la filosofía de **"Focused Professionalism"**: diseño minimalista, alto rendimiento y utilidad técnica.

## 🚀 Tecnologías

Este proyecto utiliza un stack moderno enfocado en la velocidad y la escalabilidad:

- **Frontend:** [Astro](https://astro.build/) (Arquitectura de Islas para máxima velocidad).
- **Interactividad:** [React](https://reactjs.org/) (Para las calculadoras científicas).
- **Estilos:** [Tailwind CSS](https://tailwindcss.com/) (Diseño adaptativo y Dark Mode).
- **Backend:** [Supabase](https://supabase.com/) (Base de datos PostgreSQL y Auth).
- **Automatización:** [GitHub Actions](https://github.com/features/actions) (Cron jobs para sincronización de datos).
- **API:** [Strava API](https://developers.strava.com/) (Extracción de métricas de rendimiento).

## ✨ Características Principales

### 1. Alpha Coach (Laboratorio de Rendimiento)
Herramientas integradas para el entrenamiento inteligente:
- **Calculadora VDOT:** Basada en las fórmulas de Jack Daniels para determinar ritmos de entrenamiento precisos.
- **Zonas de Esfuerzo:** Implementación de la **Fórmula de Karvonen** para personalizar zonas cardíacas (Z1-Z5) utilizando la frecuencia cardíaca en reposo.

### 2. Sincronización Inteligente de Datos
Superamos las limitaciones de la API de Strava mediante un pipeline de datos propio:
- Automatización mediante **GitHub Actions** que extrae actividades periódicamente.
- Persistencia en **Supabase** para mantener un historial infinito del club, permitiendo rankings anuales y totales precisos.

### 3. Comunidad y Crónicas
- **Métricas del Club:** Visualización de kilómetros totales, desnivel acumulado y récords locales.
- **Crónicas de Carreras:** Galería multimedia y resúmenes de eventos con impacto social en la comunidad.

## 🛠 Instalación y Configuración

1. **Clonar el repositorio:**
   ```bash
   git clone [https://github.com/tu-usuario/alpha-running-club.git](https://github.com/tu-usuario/alpha-running-club.git)
   cd alpha-running-club