import { useEffect } from 'react';

const siteUrl = 'https://neyqo.xyz';
const defaultImageUrl = `${siteUrl}/og-image.png`;

type SeoMetadataProps = {
  title: string;
  description: string;
  path?: string;
  noIndex?: boolean;
};

function upsertMeta(selector: string, attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.append(element);
  }

  element.content = content;
}

function updateCanonical(path?: string) {
  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

  if (!path) {
    canonical?.remove();
    return;
  }

  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.append(canonical);
  }

  canonical.href = `${siteUrl}${path}`;
}

export function SeoMetadata({ title, description, path, noIndex = false }: SeoMetadataProps) {
  useEffect(() => {
    const canonicalUrl = path ? `${siteUrl}${path}` : siteUrl;
    const robots = noIndex
      ? 'noindex, nofollow, noarchive'
      : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

    document.title = title;
    upsertMeta('meta[name="description"]', 'name', 'description', description);
    upsertMeta('meta[name="robots"]', 'name', 'robots', robots);
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', title);
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', description);
    upsertMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
    upsertMeta('meta[property="og:image"]', 'property', 'og:image', defaultImageUrl);
    upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image', defaultImageUrl);
    updateCanonical(noIndex ? undefined : path);
  }, [description, noIndex, path, title]);

  return null;
}
