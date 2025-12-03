'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';

export default function Tracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [config, setConfig] = useState(null);

    // Fetch Config for External IDs
    useEffect(() => {
        fetch('/api/site-config')
            .then(res => res.json())
            .then(data => setConfig(data))
            .catch(err => console.error('Failed to load analytics config', err));
    }, []);

    // Internal Tracking
    useEffect(() => {
        const trackPage = async () => {
            try {
                await fetch('/api/analytics/track', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        path: pathname,
                        referrer: document.referrer
                    })
                });
            } catch (e) {
                console.error('Tracking failed', e);
            }
        };

        trackPage();
    }, [pathname, searchParams]);

    if (!config) return null;

    return (
        <>
            {/* Google Analytics */}
            {config.analytics?.googleAnalyticsId && (
                <>
                    <Script
                        src={`https://www.googletagmanager.com/gtag/js?id=${config.analytics.googleAnalyticsId}`}
                        strategy="afterInteractive"
                    />
                    <Script id="google-analytics" strategy="afterInteractive">
                        {`
                            window.dataLayer = window.dataLayer || [];
                            function gtag(){dataLayer.push(arguments);}
                            gtag('js', new Date());
                            gtag('config', '${config.analytics.googleAnalyticsId}');
                        `}
                    </Script>
                </>
            )}

            {/* Microsoft Clarity */}
            {config.analytics?.clarityId && (
                <Script id="microsoft-clarity" strategy="afterInteractive">
                    {`
                        (function(c,l,a,r,i,t,y){
                            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                        })(window, document, "clarity", "script", "${config.analytics.clarityId}");
                    `}
                </Script>
            )}
        </>
    );
}
