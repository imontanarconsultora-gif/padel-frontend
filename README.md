# PadelWeb — Frontend ASP.NET Core Razor Pages
## Desarrollado por IMontanar · Sistemas & Consultoría

---

## Estructura del proyecto

```
PadelWeb/
├── Pages/
│   ├── Shared/
│   │   ├── _Layout.cshtml        # Layout público (header con logos + footer IMontanar)
│   │   └── _AdminLayout.cshtml   # Layout admin con sidebar y logo IMontanar
│   ├── Index.cshtml              # Página de reservas (pública)
│   ├── Cancelar.cshtml           # Página de cancelación (pública)
│   └── Admin/
│       ├── Dashboard.cshtml      # Estadísticas y resumen
│       ├── Turnos.cshtml         # ABM de turnos
│       ├── Alumnas.cshtml        # ABM de alumnas
│       ├── Reservas.cshtml       # Listado de reservas
│       ├── Config.cshtml         # Configuración y exportar CSVs
│       └── AdminModels.cs        # PageModels de todas las páginas admin
│
├── wwwroot/
│   ├── css/
│   │   ├── site.css              # Estilos globales (variables, botones, tablas, modals)
│   │   └── admin.css             # Estilos del panel admin (sidebar, topbar, stats)
│   ├── js/
│   │   ├── site.js               # Utilidades globales (apiCall, toast, modal helpers)
│   │   └── admin.js              # Lógica del admin (cargarTurnos, cargarAlumnas, etc.)
│   └── img/
│       └── logo-imontanar.png    # Logo de IMontanar (aparece en header y sidebar)
│
├── Program.cs                    # Setup de la app
├── appsettings.json              # Configuración (ApiUrl, ClubNombre, ClubLogoUrl)
└── PadelWeb.csproj
```

---

## Levantar en desarrollo

```bash
cd PadelWeb
dotnet run
# App en: https://localhost:5001
# o:      http://localhost:5000
```

Asegurate de tener la API (PadelApi) corriendo también:
```bash
# En otra terminal:
cd PadelApi/PadelApi.Api
dotnet run
```

---

## Configuración (appsettings.json)

| Clave         | Descripción                                  | Ejemplo                              |
|---------------|----------------------------------------------|--------------------------------------|
| `ApiUrl`      | URL base de la API .NET con Neon             | `https://tu-api.railway.app`         |
| `ClubNombre`  | Nombre del club que se muestra en el header  | `Club Pádel Sunchales`               |
| `ClubLogoUrl` | URL del logo del club (opcional)             | `/img/logo-club.png`                 |

Para producción, usar variables de entorno:
```
ApiUrl=https://tu-api.railway.app
ClubNombre=Club Pádel Sunchales
```

---

## Rutas disponibles

| Ruta               | Descripción                          |
|--------------------|--------------------------------------|
| `/`                | Página pública de reservas           |
| `/cancelar?token=` | Página pública de cancelación        |
| `/admin/dashboard` | Panel admin — estadísticas           |
| `/admin/turnos`    | Panel admin — gestión de turnos      |
| `/admin/alumnas`   | Panel admin — gestión de alumnas     |
| `/admin/reservas`  | Panel admin — listado de reservas    |
| `/admin/config`    | Panel admin — configuración y export |

---

## Agregar logo del club

En `appsettings.json`:
```json
{
  "ClubLogoUrl": "/img/logo-club.png"
}
```

Copiar el logo a `wwwroot/img/logo-club.png` y el header lo muestra automáticamente en lugar del placeholder.

---

## Deploy en Railway (junto con la API)

1. Subir este proyecto a GitHub (puede ser el mismo repo que PadelApi, en carpeta separada)
2. Railway → New Service → Deploy from GitHub → seleccionar la carpeta `PadelWeb`
3. Variables de entorno:
   ```
   ApiUrl=https://tu-api.railway.app
   ClubNombre=Tu Club
   ASPNETCORE_ENVIRONMENT=Production
   ```
4. Railway detecta el proyecto .NET automáticamente
