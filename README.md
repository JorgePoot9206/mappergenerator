# ZoneMapper 🗺️

**Mapea cualquier imagen con IA.** Sube una foto de tu casa, oficina, estacionamiento o cualquier espacio y marca automáticamente cada zona para explorarla de forma interactiva.

🔗 **Demo en vivo:** [zonemapper.kaanmkt.com](https://zonemapper.kaanmkt.com)

---

## ¿Qué es ZoneMapper?

ZoneMapper es una herramienta web que convierte cualquier imagen en un mapa interactivo de zonas. Puedes usar inteligencia artificial (Anthropic Claude o Google Gemini) para detectar las zonas automáticamente, o trazarlas tú mismo de forma manual.

**Casos de uso:**
- Plano de una casa → identificar sala, cocina, cuartos, baños
- Estacionamiento → marcar cada cajón o sección
- Oficina → etiquetar áreas de trabajo, salas, recepción
- Mapa geográfico → identificar regiones, ciudades, fronteras
- Cualquier imagen con espacios o zonas diferenciadas

---

## Funcionalidades

- **Detección automática con IA** — usa Anthropic Claude o Google Gemini para identificar zonas en segundos
- **Mapeo manual** — traza y nombra zonas a mano con total control
- **3 estilos visuales** — polígonos semitransparentes, etiquetas flotantes o tooltips al hacer hover
- **Panel de detalles** — haz clic en cualquier zona para ver y editar su información
- **Edición inline** — renombra zonas con doble clic directamente sobre la imagen
- **Notas persistentes** — guarda notas por zona en localStorage, sin necesidad de cuenta
- **Rate limits** — control de uso por IA para evitar sobrecostos
- **Exportar en 3 formatos:**
  - JSON puro con todas las zonas y notas
  - Widget HTML standalone (sin dependencias, funciona con copy-paste)
  - Componente React + TypeScript listo para importar
- **Página `/help`** con documentación interactiva y previews en vivo de cada tipo de integración

---

## Tech Stack

- **Next.js 14** con App Router
- **TypeScript**
- **Tailwind CSS**
- **Anthropic Claude API** (`claude-sonnet`)
- **Google Gemini API**

---

## Instalación local

### 1. Clona el repositorio

```bash
git clone https://github.com/JorgePoot9206/zonemapper.git
cd zonemapper
```

### 2. Instala las dependencias

```bash
npm install
```

### 3. Configura las variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AI...
```

> Nunca subas este archivo a GitHub. Ya está incluido en el `.gitignore`.

### 4. Corre el servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## Variables de entorno

| Variable | Descripción | Requerida |
|---|---|---|
| `ANTHROPIC_API_KEY` | API key de Anthropic Claude | Sí (para IA con Claude) |
| `GEMINI_API_KEY` | API key de Google Gemini | Sí (para IA con Gemini) |

Obtén tu API key de Anthropic en [console.anthropic.com](https://console.anthropic.com) y la de Gemini en [aistudio.google.com](https://aistudio.google.com).

---

## Deploy en Vercel

### Opción A — Deploy automático

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/tu-usuario/zonemapper)

### Opción B — Manual

1. Importa el repositorio en [vercel.com/new](https://vercel.com/new)
2. En la sección **Environment Variables**, agrega:
   - `ANTHROPIC_API_KEY`
   - `GEMINI_API_KEY`
3. Haz clic en **Deploy**

### Subdominio personalizado

Para usar `zonemapper.kaanmkt.com`:

1. En Vercel → tu proyecto → **Settings → Domains**
2. Agrega `zonemapper.kaanmkt.com`
3. En tu panel de DNS agrega un registro `CNAME`:
   ```
   zonemapper → cname.vercel-dns.com
   ```

---

## Cómo integrar las zonas en tu web

Una vez que generes tus zonas en ZoneMapper, puedes exportarlas e integrarlas en cualquier proyecto.

### Con HTML vanilla

Exporta el **Widget HTML** y pégalo directamente en tu página. No requiere dependencias:

```html
<!-- Pega el contenido del archivo zonemap-widget.html aquí -->
<!-- o usa un iframe: -->
<iframe src="./zonemap-widget.html" width="100%" height="500px" frameborder="0"></iframe>
```

### Con React / Next.js

Exporta el **Componente React** y cópialo a tu proyecto:

```tsx
import ZoneMap from './ZoneMap'
import data from './zonemap-data.json'

export default function MyPage() {
  return (
    <ZoneMap
      data={data}
      onZoneClick={(zone) => console.log(zone)}
    />
  )
}
```

### Con el JSON directamente

```js
import data from './zonemap-data.json'

data.zones.forEach(zone => {
  console.log(zone.name, zone.position, zone.description)
})
```

Consulta la página [/help](https://zonemapper.kaanmkt.com/help) para documentación completa con ejemplos interactivos en vivo.

---

## Estructura del proyecto

```
zonemapper/
├── app/
│   ├── layout.tsx          # Layout global + SEO metadata
│   ├── page.tsx            # App principal
│   ├── help/
│   │   └── page.tsx        # Documentación e integración
│   ├── api/
│   │   └── analyze/
│   │       └── route.ts    # API route → llama a Claude / Gemini
│   ├── sitemap.ts          # Sitemap automático
│   └── robots.ts           # robots.txt automático
├── components/
│   ├── ZoneMap.tsx         # Componente principal del mapa
│   ├── ZonePanel.tsx       # Panel lateral de detalles
│   └── ExportMenu.tsx      # Menú de exportación
├── public/
│   └── og-image.png        # Imagen Open Graph (1200×630px)
├── .env.example
├── .env.local              # ← No se sube a GitHub
└── README.md
```

---

## Contribuir

¡Las contribuciones son bienvenidas! Si encuentras un bug o tienes una idea:

1. Abre un **Issue** describiendo el problema o la mejora
2. Haz un **Fork** del repositorio
3. Crea una rama: `git checkout -b feature/mi-mejora`
4. Haz commit de tus cambios: `git commit -m 'feat: descripción'`
5. Push a tu rama: `git push origin feature/mi-mejora`
6. Abre un **Pull Request**

---

## Licencia

MIT © [kaanmkt.com](https://kaanmkt.com)
