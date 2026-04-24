import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aviso de Privacidad y Uso de IA | ZoneMapper",
  description:
    "Información sobre cómo ZoneMapper utiliza Google Gemini y Claude de Anthropic, políticas de privacidad y uso de datos.",
};

// ─────────────────────────────────────────────────────────────
//  Re-usable primitives
// ─────────────────────────────────────────────────────────────

function Section({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 ${className}`}
    >
      {children}
    </section>
  );
}

function SectionTitle({
  icon,
  children,
  color = "text-white",
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <h2 className={`flex items-center gap-2.5 text-xl font-bold mb-5 ${color}`}>
      <span className="text-2xl leading-none">{icon}</span>
      {children}
    </h2>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2 mt-5 first:mt-0">
      {children}
    </h3>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-slate-300 text-sm leading-relaxed">
      <span className="text-slate-500 mt-0.5 flex-shrink-0">•</span>
      <span>{children}</span>
    </li>
  );
}

function BulletList({ children }: { children: React.ReactNode }) {
  return <ul className="space-y-1.5">{children}</ul>;
}

function HighlightBox({
  color,
  children,
}: {
  color: "amber" | "blue" | "green" | "red";
  children: React.ReactNode;
}) {
  const styles: Record<typeof color, string> = {
    amber: "bg-amber-950/40 border-amber-800/60 text-amber-300",
    blue:  "bg-blue-950/40  border-blue-800/60  text-blue-300",
    green: "bg-emerald-950/40 border-emerald-800/60 text-emerald-300",
    red:   "bg-red-950/40   border-red-800/60   text-red-300",
  };
  return (
    <div className={`border rounded-xl px-4 py-3 text-sm leading-relaxed ${styles[color]}`}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Model priority badge
// ─────────────────────────────────────────────────────────────

function ModelBadge({
  priority,
  model,
  note,
  color,
}: {
  priority: number;
  model: string;
  note: string;
  color: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span
        className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${color}`}
      >
        {priority}
      </span>
      <div>
        <span className="text-sm font-semibold text-white">{model}</span>
        <span className="text-slate-400 text-xs ml-2">{note}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Page
// ─────────────────────────────────────────────────────────────

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10 pb-20">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-slate-500 text-sm mb-4">
        <a href="/" className="hover:text-slate-300 transition-colors">App</a>
        <span>›</span>
        <span className="text-slate-300">Aviso de Privacidad</span>
      </div>

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-3">
          Aviso de Privacidad y Uso de IA
        </h1>
        <p className="text-slate-400 text-base leading-relaxed">
          ZoneMapper utiliza modelos de IA de <strong className="text-slate-200">Google Gemini</strong> y{" "}
          <strong className="text-slate-200">Claude de Anthropic</strong> para analizar imágenes. Esta página
          explica cómo funciona cada servicio, sus políticas de privacidad y cómo manejamos tus datos.
        </p>
      </div>

      <div className="space-y-6">

        {/* ── Our storage policy ─────────────────────────────── */}
        <Section>
          <SectionTitle icon="🔒" color="text-emerald-400">
            Nuestra Política de Almacenamiento
          </SectionTitle>
          <HighlightBox color="green">
            <strong>ZoneMapper no almacena ninguna imagen, análisis ni dato personal</strong> en bases de
            datos propias. Todo el procesamiento ocurre en tiempo real directamente entre tu navegador y
            las APIs de los proveedores de IA. Una vez que cierras la página, no existe ningún registro
            de tu actividad en nuestros servidores.
          </HighlightBox>
          <div className="mt-4">
            <BulletList>
              <Bullet>Las imágenes que subes <strong className="text-white">no se guardan</strong> en ningún servidor propio.</Bullet>
              <Bullet>Los resultados del análisis de zonas <strong className="text-white">no se almacenan</strong> en ninguna base de datos.</Bullet>
              <Bullet>No hay registro de usuarios, cuentas ni historial de sesiones.</Bullet>
              <Bullet>Solo utilizamos una cookie anónima y cifrada para el control de límite de uso (rate limit). No contiene información personal y expira en 24 horas.</Bullet>
            </BulletList>
          </div>
        </Section>

        {/* ── Gemini ─────────────────────────────────────────── */}
        <Section>
          <SectionTitle icon="✦" color="text-blue-400">
            Google Gemini (Capa Gratuita — Free Tier)
          </SectionTitle>

          <SubTitle>Sistema de modelos en cascada</SubTitle>
          <p className="text-slate-400 text-sm mb-3">
            Para maximizar la disponibilidad, la app intenta los modelos de Gemini en orden de prioridad
            y, si todos fallan, recurre automáticamente a Claude como respaldo final.
          </p>
          <div className="divide-y divide-slate-800">
            <ModelBadge
              priority={1}
              model="Gemini 2.5 Flash"
              note="Balance entre velocidad y precisión — primera opción"
              color="bg-blue-600 text-white"
            />
            <ModelBadge
              priority={2}
              model="Gemini 3 Flash"
              note="Respaldo de alta velocidad si el primero no responde"
              color="bg-blue-800 text-blue-200"
            />
            <ModelBadge
              priority={3}
              model="Claude (Anthropic)"
              note="Respaldo final si ambos modelos de Gemini fallan"
              color="bg-orange-700 text-orange-100"
            />
          </div>

          <SubTitle>Estabilidad y errores</SubTitle>
          <BulletList>
            <Bullet>
              Dependemos directamente de la infraestructura de Google. Pueden presentarse
              interrupciones ajenas a ZoneMapper.
            </Bullet>
            <Bullet>
              Es posible que experimentes errores temporales (<strong className="text-white">503 / 504</strong>) si los
              servidores de Google están saturados o en mantenimiento.
            </Bullet>
            <Bullet>
              El tiempo de respuesta puede variar según la demanda global del modelo.
            </Bullet>
          </BulletList>

          <SubTitle>Privacidad y uso de datos</SubTitle>
          <HighlightBox color="amber">
            <strong>⚠ Aviso importante — Capa Gratuita de Google Gemini:</strong> Según las políticas de
            Google para el Free Tier de su API, Google{" "}
            <strong>puede utilizar las imágenes y textos enviados para entrenar y mejorar sus modelos</strong>{" "}
            de inteligencia artificial.
          </HighlightBox>
          <div className="mt-3">
            <BulletList>
              <Bullet>
                <strong className="text-white">No subas imágenes con información sensible:</strong> fotos de
                rostros, documentos de identidad, información médica, datos financieros ni contenido confidencial.
              </Bullet>
              <Bullet>
                Usa imágenes genéricas como planos arquitectónicos, layouts de oficina, mapas o
                fotografías sin datos personales.
              </Bullet>
              <Bullet>
                Consulta la{" "}
                <a
                  href="https://ai.google.dev/gemini-api/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline underline-offset-2"
                >
                  política completa de Google Gemini API
                </a>{" "}
                para más información.
              </Bullet>
            </BulletList>
          </div>
        </Section>

        {/* ── Claude ─────────────────────────────────────────── */}
        <Section>
          <SectionTitle icon="◬" color="text-orange-400">
            Claude de Anthropic (API de Pago)
          </SectionTitle>

          <SubTitle>Modelos utilizados</SubTitle>
          <div className="divide-y divide-slate-800">
            <ModelBadge
              priority={1}
              model="Claude Sonnet 4.5"
              note="Modelo de análisis principal cuando el usuario elige Claude directamente"
              color="bg-orange-600 text-white"
            />
            <ModelBadge
              priority={2}
              model="Claude Sonnet 4.5"
              note="Respaldo automático cuando todos los modelos de Gemini fallan (hasta 2 análisis/hora)"
              color="bg-orange-800 text-orange-200"
            />
          </div>

          <SubTitle>Privacidad y uso de datos</SubTitle>
          <HighlightBox color="green">
            <strong>✓ Anthropic NO utiliza los datos de la API para entrenar sus modelos.</strong>{" "}
            A diferencia de la capa gratuita de Gemini, la API de pago de Anthropic tiene una política
            explícita: los inputs y outputs enviados a través de la API{" "}
            <strong>no se utilizan para entrenamiento</strong> de ningún modelo de IA.
          </HighlightBox>
          <div className="mt-3">
            <BulletList>
              <Bullet>
                Las imágenes procesadas por Claude <strong className="text-white">no se almacenan permanentemente</strong> ni
                se usan para entrenar modelos.
              </Bullet>
              <Bullet>
                Anthropic puede retener datos temporalmente para monitoreo de seguridad y
                prevención de abuso (trust &amp; safety), pero no para fines de entrenamiento.
              </Bullet>
              <Bullet>
                Aún así, recomendamos no enviar imágenes con información personal sensible como
                buena práctica general.
              </Bullet>
              <Bullet>
                Consulta la{" "}
                <a
                  href="https://www.anthropic.com/legal/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-400 hover:text-orange-300 underline underline-offset-2"
                >
                  política de privacidad de Anthropic
                </a>{" "}
                para más información.
              </Bullet>
            </BulletList>
          </div>

          <SubTitle>Estabilidad del servicio</SubTitle>
          <BulletList>
            <Bullet>
              La API de Anthropic ofrece alta disponibilidad. Los errores por fallas del modelo
              son poco frecuentes.
            </Bullet>
            <Bullet>
              Cuando Claude se usa como respaldo de Gemini, el límite es de{" "}
              <strong className="text-white">2 análisis por hora</strong> para esta modalidad.
            </Bullet>
            <Bullet>
              Si ambos proveedores están fuera de servicio, se mostrará un aviso de
              indisponibilidad temporal.
            </Bullet>
          </BulletList>
        </Section>

        {/* ── Upgrade CTA ────────────────────────────────────── */}
        <Section className="border-indigo-800/60 bg-indigo-950/30">
          <SectionTitle icon="🚀" color="text-indigo-300">
            ¿Necesitas más privacidad o mayor capacidad de análisis?
          </SectionTitle>
          <p className="text-slate-300 text-sm leading-relaxed mb-4">
            La versión pública de ZoneMapper opera bajo los límites del Free Tier de Gemini y con
            cuotas reducidas de Claude. Si tu caso de uso requiere:
          </p>
          <BulletList>
            <Bullet>Mayor privacidad garantizada (sin uso de datos para entrenamiento en todos los modelos)</Bullet>
            <Bullet>Límites de análisis más altos o sin restricciones por hora</Bullet>
            <Bullet>Acceso prioritario a modelos de mayor capacidad</Bullet>
            <Bullet>Uso en entornos empresariales o con imágenes confidenciales</Bullet>
          </BulletList>
          <div className="mt-5 p-4 bg-indigo-900/30 border border-indigo-700/50 rounded-xl flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <p className="text-indigo-200 text-sm font-medium">Contáctanos para acceso a la versión con IA de pago</p>
              <p className="text-slate-400 text-xs mt-0.5">
                Conversemos sobre un acceso personalizado que se ajuste a tus necesidades.
              </p>
            </div>
            <a
              href="mailto:contacto@kaanmkt.com"
              className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              contacto@kaanmkt.com
            </a>
          </div>
        </Section>

        {/* ── Comparison table ───────────────────────────────── */}
        <Section>
          <SectionTitle icon="⚖" color="text-indigo-400">
            Comparación Rápida de Privacidad
          </SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left text-slate-400 font-medium py-2 pr-4">Aspecto</th>
                  <th className="text-center text-blue-400 font-medium py-2 px-4">Google Gemini</th>
                  <th className="text-center text-orange-400 font-medium py-2 pl-4">Claude</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {[
                  ["Usa datos para entrenar modelos", "⚠ Sí (Free Tier)", "✓ No (API de pago)"],
                  ["Almacenamiento permanente", "Según política Google", "No para entrenamiento"],
                  ["Retención temporal (seguridad)", "Sí", "Sí (trust & safety)"],
                  ["Imágenes sensibles", "⚠ No recomendado", "No recomendado"],
                  ["Almacenamiento en ZoneMapper", "✓ Ninguno", "✓ Ninguno"],
                ].map(([aspect, gemini, claude]) => (
                  <tr key={aspect}>
                    <td className="text-slate-300 py-2.5 pr-4">{aspect}</td>
                    <td className={`text-center py-2.5 px-4 ${gemini.startsWith("⚠") ? "text-amber-400" : "text-blue-300"}`}>
                      {gemini}
                    </td>
                    <td className={`text-center py-2.5 pl-4 ${claude.startsWith("✓") ? "text-emerald-400" : "text-slate-300"}`}>
                      {claude}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* ── Rate limits ────────────────────────────────────── */}
        <Section>
          <SectionTitle icon="⏱" color="text-slate-300">
            Límites de Uso
          </SectionTitle>
          <BulletList>
            <Bullet>
              <strong className="text-white">Gemini:</strong> hasta <strong className="text-white">6 análisis por hora</strong> por usuario.
            </Bullet>
            <Bullet>
              <strong className="text-white">Claude (directo):</strong> hasta <strong className="text-white">1 análisis por hora</strong> por usuario.
            </Bullet>
            <Bullet>
              <strong className="text-white">Claude (respaldo de Gemini):</strong> hasta <strong className="text-white">2 análisis por hora</strong> cuando Gemini falla automáticamente.
            </Bullet>
            <Bullet>
              Los límites se controlan mediante una cookie anónima y un registro temporal en memoria del servidor.
              Se restablecen automáticamente al transcurrir la hora.
            </Bullet>
          </BulletList>
        </Section>

        {/* ── Footer note ────────────────────────────────────── */}
        <p className="text-center text-slate-500 text-xs leading-relaxed px-4">
          Al continuar utilizando ZoneMapper, aceptas haber leído y comprendido este aviso sobre el uso de
          inteligencia artificial y las políticas de privacidad de los proveedores integrados.
          <br />
          Última actualización: abril 2026.
        </p>

      </div>
    </main>
  );
}
