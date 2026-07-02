import { PageHeader } from '../../components/common/PageHeader';
import { SeoMetadata } from '../../components/seo/SeoMetadata';
import { Card } from '../../components/ui/card';
import { LegalBackLink } from './LegalBackLink';

const effectiveDate = '19 de junio de 2026';
const contactEmail = 'neyqofinanzaspersonales@gmail.com';

const sections = [
  {
    title: '1. Aceptación de los términos',
    body: [
      'Al crear una cuenta o usar Neyqo aceptas estos términos de uso. Si no estás de acuerdo, no debes usar la aplicación.',
      'Neyqo puede actualizar estos términos para reflejar cambios del producto, requisitos legales o integraciones externas. Cuando los cambios sean importantes, haremos esfuerzos razonables para avisarte dentro de la aplicación o por los medios de contacto disponibles.',
    ],
  },
  {
    title: '2. Qué es Neyqo',
    body: [
      'Neyqo es una herramienta de finanzas personales diseñada para ayudarte a registrar cuentas, categorías, presupuestos, movimientos programados, transacciones y revisiones de movimientos detectados desde correos bancarios cuando activas una sincronización.',
      'Neyqo no es una entidad financiera, banco, asesor financiero, asesor fiscal ni asesor legal. La información mostrada en la aplicación es organizativa y no debe tomarse como recomendación profesional.',
    ],
  },
  {
    title: '3. Tu cuenta y tus responsabilidades',
    body: [
      'Debes proporcionar información verdadera y mantener protegidas tus credenciales de acceso. Eres responsable de la actividad que ocurra en tu cuenta.',
      'También eres responsable de revisar la exactitud de la información financiera que registres, importes o confirmes en Neyqo antes de tomar decisiones con base en ella.',
    ],
  },
  {
    title: '4. Sincronización con proveedores externos',
    body: [
      'La conexión con Gmail u otros proveedores es opcional y debe iniciarse desde la sección de sincronización de Neyqo. El inicio de sesión normal y la sincronización de correos son flujos separados.',
      'Las integraciones dependen de la disponibilidad, permisos, políticas y funcionamiento de cada proveedor. Puedes revocar el acceso de Gmail desde tu cuenta de Google o desde las opciones que Neyqo habilite para administrar conexiones.',
    ],
  },
  {
    title: '5. Uso permitido',
    body: [
      'Debes usar Neyqo solo para fines personales y legales. No debes intentar acceder a cuentas ajenas, interferir con el servicio, evadir controles de seguridad, extraer datos de forma abusiva ni usar la aplicación para actividades fraudulentas.',
      'Podemos suspender o limitar el acceso si detectamos un uso que ponga en riesgo a otros usuarios, la seguridad del servicio o el cumplimiento de estos términos.',
    ],
  },
  {
    title: '6. Disponibilidad y cambios del servicio',
    body: [
      'Neyqo puede cambiar, pausar o retirar funcionalidades, especialmente integraciones externas que dependen de terceros. Aunque buscamos mantener el servicio disponible, no garantizamos disponibilidad continua ni ausencia total de errores.',
      'Te recomendamos conservar respaldos o registros alternos de cualquier información financiera importante.',
    ],
  },
  {
    title: '7. Limitación de responsabilidad',
    body: [
      'Neyqo se ofrece como herramienta de organización. En la medida permitida por la ley aplicable, no seremos responsables por decisiones financieras, pérdidas, errores de proveedores externos, interrupciones del servicio o información ingresada incorrectamente por el usuario.',
      'Nada en estos términos limita derechos que no puedan limitarse bajo la ley aplicable.',
    ],
  },
  {
    title: '8. Contacto',
    body: [
      `Si tienes preguntas sobre estos términos, puedes escribirnos a ${contactEmail}.`,
    ],
  },
];

export function TermsPage() {
  return (
    <div className="mx-auto grid max-w-4xl gap-6 px-4 py-12 md:px-8">
      <SeoMetadata
        title="Términos y condiciones | Neyqo"
        description="Consulta las condiciones de uso de Neyqo, la app de finanzas personales."
        path="/terms"
      />
      <PageHeader
        title="Términos y condiciones"
        description="Condiciones de uso de Neyqo Finanzas Personales para usuarios de la aplicación web."
      />
      <Card className="grid gap-6 text-sm leading-7 text-subtle">
        <div className="rounded-md border border-border bg-muted/40 p-4">
          <p className="font-medium text-text">Fecha de vigencia: {effectiveDate}</p>
          <p className="mt-2">
            Estos términos explican las reglas básicas para usar Neyqo. No sustituyen asesoría legal, financiera o fiscal
            personalizada.
          </p>
        </div>

        {sections.map((section) => (
          <section key={section.title} className="grid gap-2">
            <h2 className="text-base font-semibold text-text">{section.title}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}
      </Card>
      <LegalBackLink />
    </div>
  );
}
