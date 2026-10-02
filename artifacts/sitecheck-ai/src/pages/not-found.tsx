import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

export default function NotFound() {
  const { locale } = useLanguage();
  const copy = {
    nl: { title: 'Pagina niet gevonden', text: 'Deze pagina bestaat niet of is verplaatst.', home: 'Terug naar SiteCheck AI' },
    en: { title: 'Page not found', text: 'This page does not exist or has moved.', home: 'Back to SiteCheck AI' },
    de: { title: 'Seite nicht gefunden', text: 'Diese Seite existiert nicht oder wurde verschoben.', home: 'Zurück zu SiteCheck AI' },
    fr: { title: 'Page introuvable', text: 'Cette page n’existe pas ou a été déplacée.', home: 'Retour à SiteCheck AI' },
    es: { title: 'Página no encontrada', text: 'Esta página no existe o se ha movido.', home: 'Volver a SiteCheck AI' },
  }[locale];

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">{copy.title}</h1>
          </div>
          <p className="mt-4 text-sm text-gray-600">{copy.text}</p>
          <a className="inline-flex mt-6 text-sm font-medium text-blue-600 hover:underline" href={`/${locale}`}>
            {copy.home}
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
