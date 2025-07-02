'use client';

import Head from 'next/head';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  author?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile' | 'organization';
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  noIndex?: boolean;
  noFollow?: boolean;
  canonical?: string;
  structuredData?: object;
}

export default function SEOHead({
  title = 'Collaborative Publishing Platform',
  description = 'A modern platform for collaborative content creation and publishing',
  keywords = ['collaborative', 'publishing', 'content', 'writing', 'team'],
  author = 'Your Organization',
  image = '/og-image.jpg',
  url,
  type = 'website',
  publishedTime,
  modifiedTime,
  section,
  tags = [],
  noIndex = false,
  noFollow = false,
  canonical,
  structuredData,
}: SEOHeadProps) {
  const fullTitle = title === 'Collaborative Publishing Platform' ? title : `${title} | Collaborative Publishing Platform`;
  const fullUrl = url ? `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}${url}` : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const fullImage = image.startsWith('http') ? image : `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}${image}`;

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      <meta name="author" content={author} />
      
      {/* Robots */}
      <meta name="robots" content={`${noIndex ? 'noindex' : 'index'}, ${noFollow ? 'nofollow' : 'follow'}`} />
      
      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:site_name" content="Collaborative Publishing Platform" />
      <meta property="og:locale" content="en_US" />
      
      {/* Open Graph Article specific */}
      {type === 'article' && (
        <>
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {section && <meta property="article:section" content={section} />}
          {tags.map((tag, index) => (
            <meta key={index} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
      <meta name="twitter:site" content="@yourtwitterhandle" />
      <meta name="twitter:creator" content="@yourtwitterhandle" />
      
      {/* Additional Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#3B82F6" />
      <meta name="msapplication-TileColor" content="#3B82F6" />
      
      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/site.webmanifest" />
      
      {/* Structured Data */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      )}
      
      {/* Default Structured Data for Organization */}
      {!structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Collaborative Publishing Platform",
              "description": description,
              "url": fullUrl,
              "logo": `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/logo.png`,
              "sameAs": [
                "https://twitter.com/yourtwitterhandle",
                "https://linkedin.com/company/yourcompany"
              ]
            }),
          }}
        />
      )}
    </Head>
  );
}

// Predefined SEO configurations for common pages
export const SEOConfigs = {
  home: {
    title: 'Collaborative Publishing Platform',
    description: 'Create, collaborate, and publish content with your team. A modern platform for seamless content creation.',
    keywords: ['collaborative', 'publishing', 'content', 'writing', 'team', 'collaboration'],
    type: 'website' as const,
  },
  
  login: {
    title: 'Sign In',
    description: 'Sign in to your Collaborative Publishing Platform account to access your workspace.',
    keywords: ['login', 'sign in', 'authentication', 'account'],
    type: 'website' as const,
    noIndex: true,
  },
  
  register: {
    title: 'Create Account',
    description: 'Join the Collaborative Publishing Platform and start creating content with your team.',
    keywords: ['register', 'sign up', 'create account', 'join'],
    type: 'website' as const,
    noIndex: true,
  },
  
  dashboard: {
    title: 'Dashboard',
    description: 'Your collaborative workspace. Manage posts, organizations, and team members.',
    keywords: ['dashboard', 'workspace', 'manage', 'posts', 'organizations'],
    type: 'website' as const,
  },
  
  search: {
    title: 'Search',
    description: 'Search across posts, users, and organizations in the Collaborative Publishing Platform.',
    keywords: ['search', 'find', 'posts', 'users', 'organizations'],
    type: 'website' as const,
  },
}; 