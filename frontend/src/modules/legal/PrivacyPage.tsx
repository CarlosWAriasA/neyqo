import { PageHeader } from '../../components/common/PageHeader';
import { SeoMetadata } from '../../components/seo/SeoMetadata';
import { Card } from '../../components/ui/card';
import { LegalBackLink } from './LegalBackLink';

const effectiveDate = '19 de junio de 2026';
const contactEmail = 'neyqofinanzaspersonales@gmail.com';

const sections = [
  {
    title: '1. Información que recopilamos',
    body: [
      'Recopilamos datos de cuenta como nombre, correo electrónico, credenciales protegidas y datos necesarios para iniciar sesión, proteger tu cuenta y prestarte soporte.',
      'También almacenamos la información financiera que registras o confirmas en Neyqo, como cuentas, categorías, presupuestos, transacciones, movimientos programados, reglas de importación y transacciones detectadas.',
    ],
  },
  {
    title: '2. Datos de Gmail y sincronización de correos',
    body: [
      'La sincronización con Gmail es opcional y requiere tu consentimiento explícito desde la sección de sincronización. Neyqo no solicita permisos de lectura de correo durante el inicio de sesión, registro, recuperación de contraseña u onboarding.',
      'Cuando conectas Gmail, Neyqo solicita acceso de solo lectura para detectar correos bancarios o de tarjetas y ayudarte a identificar posibles movimientos financieros. La aplicación busca usar la menor cantidad de información necesaria para mostrarte transacciones detectadas y reglas de asociación.',
      'Neyqo no envía correos, no borra correos, no modifica tu buzón y no usa datos de Gmail para publicidad.',
    ],
  },
  {
    title: '3. Cómo usamos la información',
    body: [
      'Usamos tus datos para operar la aplicación, autenticar tu cuenta, guardar tus preferencias, mostrar tu información financiera, asociar correos bancarios con cuentas o categorías y mejorar la seguridad y estabilidad del servicio.',
      'Los datos obtenidos desde APIs de Google se usan únicamente para funciones visibles y solicitadas por el usuario dentro de Neyqo, como la detección de movimientos financieros desde correos bancarios.',
    ],
  },
  {
    title: '4. Uso limitado de datos de Google',
    body: [
      'El uso y transferencia de información recibida desde APIs de Google se limita a proporcionar o mejorar funcionalidades visibles para el usuario dentro de Neyqo.',
      'No vendemos datos de Google, no los usamos para anuncios, no los transferimos a plataformas publicitarias o intermediarios de datos y no permitimos que personas lean contenido de correos salvo cuando sea necesario por seguridad, cumplimiento legal o soporte solicitado por el usuario y permitido por las políticas aplicables.',
    ],
  },
  {
    title: '5. Almacenamiento y seguridad',
    body: [
      'Aplicamos medidas técnicas razonables para proteger tus datos. Los tokens externos de proveedores como Google deben almacenarse cifrados y no deben registrarse en logs ni exponerse al navegador más allá de lo necesario para completar el flujo autorizado.',
      'Ningún sistema es completamente infalible. Si detectamos un incidente que afecte tus datos, tomaremos medidas razonables para investigarlo, mitigarlo y comunicarlo cuando corresponda.',
    ],
  },
  {
    title: '6. Compartición de información',
    body: [
      'No vendemos tus datos personales ni financieros. Podemos compartir información solo cuando sea necesario para operar el servicio, cumplir obligaciones legales, proteger la seguridad de Neyqo o atender solicitudes autorizadas por ti.',
      'Los proveedores externos, como Google, mantienen sus propias políticas y controles sobre las cuentas que conectas.',
    ],
  },
  {
    title: '7. Retención, eliminación y revocación',
    body: [
      'Conservamos tus datos mientras tu cuenta esté activa o mientras sean necesarios para prestar el servicio, cumplir obligaciones legales, resolver disputas o proteger la seguridad del sistema.',
      'Puedes revocar el acceso de Neyqo a Gmail desde la configuración de seguridad de tu cuenta de Google. También puedes escribirnos para solicitar ayuda con eliminación o revisión de tus datos en Neyqo.',
    ],
  },
  {
    title: '8. Tus controles',
    body: [
      'Puedes revisar y actualizar información dentro de la aplicación cuando las funciones estén disponibles. También puedes contactarnos para solicitar acceso, corrección o eliminación de datos asociados a tu cuenta, sujeto a límites técnicos, legales y de seguridad.',
    ],
  },
  {
    title: '9. Cambios a esta política',
    body: [
      'Podemos actualizar esta política para reflejar cambios del producto, requisitos legales o integraciones externas. Publicaremos la versión actualizada en esta página e indicaremos su fecha de vigencia.',
    ],
  },
  {
    title: '10. Contacto',
    body: [
      `Si tienes preguntas sobre privacidad o uso de datos, puedes escribirnos a ${contactEmail}.`,
    ],
  },
];

export function PrivacyPage() {
  return (
    <div className="mx-auto grid max-w-4xl gap-6 px-4 py-12 md:px-8">
      <SeoMetadata
        title="Política de privacidad | Neyqo"
        description="Conoce cómo Neyqo recopila, usa y protege tus datos personales y financieros."
        path="/privacy"
      />
      <PageHeader
        title="Política de privacidad"
        description="Cómo Neyqo Finanzas Personales recopila, usa y protege información de usuarios e integraciones."
      />
      <Card className="grid gap-6 text-sm leading-7 text-subtle">
        <div className="rounded-md border border-border bg-muted/40 p-4">
          <p className="font-medium text-text">Fecha de vigencia: {effectiveDate}</p>
          <p className="mt-2">
            Esta política explica cómo tratamos datos personales, financieros y datos de Gmail cuando decides conectar la
            sincronización de correos.
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
