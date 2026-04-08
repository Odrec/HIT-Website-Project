'use client'

import Script from 'next/script'

export function MatomoScript() {
  const matomoUrl = process.env.NEXT_PUBLIC_MATOMO_URL
  const siteId = process.env.NEXT_PUBLIC_MATOMO_SITE_ID

  if (!matomoUrl || !siteId) return null

  const baseUrl = matomoUrl.endsWith('/') ? matomoUrl : `${matomoUrl}/`

  return (
    <Script id="matomo-tracking" strategy="afterInteractive">
      {`
        var _paq = window._paq = window._paq || [];
        _paq.push(['disableCookies']);
        _paq.push(['trackPageView']);
        _paq.push(['enableLinkTracking']);
        (function() {
          var u="${baseUrl}";
          _paq.push(['setTrackerUrl', u+'matomo.php']);
          _paq.push(['setSiteId', '${siteId}']);
          var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
          g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
        })();
      `}
    </Script>
  )
}
