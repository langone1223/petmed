# PetMed - Sistema de Gestión Clínica y Mascotas

PetMed es una plataforma integral diseñada para conectar a dueños de mascotas con profesionales veterinarios. Permite llevar un control detallado de las fichas clínicas, validaciones médicas profesionales, historial de tratamientos, y cuenta con un simulador de rastreo GPS en tiempo real para las mascotas.

## Requisitos Previos

Antes de ejecutar el proyecto, asegúrate de tener instalado en tu computadora:
- [Node.js](https://nodejs.org/es/) (Versión 18 o superior recomendada)
- Git (Opcional, para control de versiones)

## Instalación y Configuración

Sigue estos pasos para instalar y ejecutar la aplicación en tu entorno local:

### 1. Clonar o acceder al proyecto
Abre tu terminal y navega a la carpeta principal del proyecto:
```bash
cd ruta/hasta/el/proyecto/mascotas
```

### 2. Instalar dependencias
Ejecuta el siguiente comando para descargar todos los paquetes necesarios de Node.js:
```bash
npm install
```

### 3. Configurar la Base de Datos
El proyecto utiliza **Prisma** con una base de datos SQLite (ideal para desarrollo local, no requiere instalación adicional). Para inicializar la base de datos y crear las tablas necesarias, ejecuta:
```bash
npx prisma db push
```
*Si tienes algún problema con la base de datos o quieres reiniciarla de cero en el futuro, puedes usar `npx prisma db push --accept-data-loss`.*

### 4. Generar el Cliente de Prisma
Para que el código de la aplicación se conecte correctamente a la base de datos:
```bash
npx prisma generate
```

### 5. Ejecutar la Aplicación
Finalmente, para arrancar el servidor de desarrollo, ejecuta:
```bash
npm run dev
```

El terminal mostrará un mensaje indicando que el servidor está listo. 

### 6. Acceder desde el Navegador
Abre tu navegador de preferencia (Chrome, Firefox, Safari) e ingresa la siguiente URL:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## Funcionalidades Principales

*   **Registro Dual:** Separación clara entre cuentas de "Dueño de Mascota" y "Veterinario".
*   **Perfiles Validados:** Los veterinarios se registran con su Matrícula Profesional (MP) y firman digitalmente las fichas clínicas.
*   **Gestión de Mascotas:** Los dueños pueden cargar sus mascotas, pero la edición de ciertos datos clínicos elimina la validación del veterinario para evitar alteraciones.
*   **Historial Clínico PRO:** Una línea de tiempo estructurada que detalla el diagnóstico, exámenes físicos, medicación exacta, indicaciones del profesional y el peso del animal.
*   **Simulador GPS:** Un módulo exclusivo para el dueño que simula en tiempo real la ubicación de la mascota usando geolocalización.
