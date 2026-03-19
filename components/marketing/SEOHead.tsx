import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title: string;
  description: string;
  path?: string;
  ogImage?: string;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  path = '',
  ogImage = 'https://maroon.alexlexington.com/og-image.png',
}) => {
  const fullTitle = `${title} | Maroon by Alex Lexington`;
  // Clean path URLs for SEO (no hash fragments)
  const pathMap: Record<string, string> = {
    'about': '/about',
    'how-it-works': '/how-it-works',
    'services-invest': '/services/invest',
    'services-indulge': '/services/indulge',
    'services-secure': '/services/secure',
    'pricing': '/pricing',
    'contact': '/contact',
  };
  const cleanPath = path ? (pathMap[path] || `/${path}`) : '';
  const url = `https://maroon.alexlexington.com${cleanPath}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
};

export default SEOHead;
