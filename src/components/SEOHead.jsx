import React from "react";
import { Helmet } from "react-helmet";

export default function SEOHead({ 
  title = "Yến Sào Khang Long", 
  description = "Yến sào cao cấp, chất lượng tốt nhất", 
  canonical,
  ogImage,
  schema 
}) {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      {canonical && <link rel="canonical" href={canonical} />}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
}