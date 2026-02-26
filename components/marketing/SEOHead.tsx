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
  const url = `https://maroon.alexlexington.com${path ? `/#${path}` : ''}`;

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
