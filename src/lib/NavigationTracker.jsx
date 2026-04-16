import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { pagesConfig } from '@/pages.config';

export default function NavigationTracker() {
    const location = useLocation();
    const { Pages, mainPage } = pagesConfig;
    const mainPageKey = mainPage ?? Object.keys(Pages)[0];

    // Post navigation changes to parent window
    useEffect(() => {
        window.parent?.postMessage({
            type: "app_changed_url",
            url: window.location.href
        }, '*');
    }, [location]);

    // Log user activity when navigating to a page
    useEffect(() => {
        // Extract page name from pathname
        const pathname = location.pathname;
        let pageName;
        
        if (pathname === '/' || pathname === '') {
            pageName = mainPageKey;
        } else {
            // Remove leading slash and get the first segment
            const pathSegment = pathname.replace(/^\//, '').split('/')[0];
            
            // Try case-insensitive lookup in Pages config
            const pageKeys = Object.keys(Pages);
            const matchedKey = pageKeys.find(
                key => key.toLowerCase() === pathSegment.toLowerCase()
            );
            
            pageName = matchedKey || null;
        }

        if (!pageName) return;
        // Only log activity when the user is authenticated. In self-host mode
        // we avoid global auth gating, so we probe auth here and fail silently.
        (async () => {
            try {
                const authed = await base44.auth.isAuthenticated();
                if (!authed) return;
                await base44.appLogs.logUserInApp(pageName);
            } catch {
                // Silently fail - logging shouldn't break the app
            }
        })();
    }, [location, Pages, mainPageKey]);

    return null;
}
