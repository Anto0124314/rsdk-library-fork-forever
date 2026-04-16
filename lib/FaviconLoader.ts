export class FaviconLoader {
    private static observer: MutationObserver | null = null;
    private static currentFavicon: string = '';
    private static basePath: string = '';
    private static updateTimeout: NodeJS.Timeout | null = null;

    // Mapping of game identifiers to favicon paths
    private static faviconMap: Record<string, string> = {
        'Sonic Mania': 'icons/smania.ico',
        'Sonic CD': 'icons/scd.ico',
        'Sonic 1': 'icons/s1.ico',
        'Sonic 2': 'icons/s2.ico',
        'Sonic 3 & Knuckles': 'icons/s3k.ico',
        'Sonic 3': 'icons/s3k.ico',
        'Sonic the Hedgehog': 'icons/s1.ico',
        'Sonic the Hedgehog 2': 'icons/s2.ico',
        'Sonic the Hedgehog 3': 'icons/s3k.ico',
        'Sonic 2 Absolute': 'icons/s2a.ico'
        'Sonic Forever': 'icons/s1f.ico'
    };

    private static defaultFavicon: string = 'favicon.ico';

    static init() {
        
        
        // Detect base path
        this.detectBasePath();
        
        // Initial check
        this.updateFavicon();

        // Watch for title changes using multiple methods
        this.startWatching();

        
    }

    private static detectBasePath() {
        // Try to get from HTML base tag first
        const baseTag = document.querySelector('base');
        if (baseTag?.href) {
            const url = new URL(baseTag.href);
            this.basePath = url.pathname;
            
            return;
        }

        // Get from current location
        const path = window.location.pathname;
        
        // GitHub Pages detection
        if (window.location.hostname.includes('github.io')) {
            const segments = path.split('/').filter(s => s);
            if (segments.length > 0 && !segments[0].includes('.')) {
                // First segment is likely the repo name
                this.basePath = '/' + segments[0] + '/';
                
                return;
            }
        }

        // Default
        this.basePath = '/';
        
    }

    private static startWatching() {
        // Method 1: MutationObserver on title element
        this.observer = new MutationObserver(() => {
            this.scheduleUpdate();
        });

        const titleElement = document.querySelector('title');
        if (titleElement) {
            this.observer.observe(titleElement, {
                childList: true,
                characterData: true,
                subtree: true
            });
        }

        this.observer.observe(document.head, {
            childList: true,
            subtree: true
        });

        // Method 2: Poll for changes (fallback)
        let lastTitle = document.title;
        setInterval(() => {
            if (document.title !== lastTitle) {
                lastTitle = document.title;
                this.scheduleUpdate();
            }
        }, 500);

        
    }

    private static scheduleUpdate() {
        // Debounce updates to avoid excessive changes
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }
        
        this.updateTimeout = setTimeout(() => {
            this.updateFavicon();
        }, 100);
    }

    private static resolveIconPath(relativePath: string): string {
        const cleanPath = relativePath.replace(/^\/+/, '');
        let fullPath = this.basePath + cleanPath;
        
        // Ensure no double slashes
        fullPath = fullPath.replace(/\/+/g, '/');
        
        return fullPath;
    }

    static updateFavicon() {
        const title = document.title;
        let faviconRelativePath = this.defaultFavicon;
        let matchedKey = '';

        

        // Sort keys by length (longest first) for most specific match
        const sortedKeys = Object.keys(this.faviconMap).sort((a, b) => b.length - a.length);
        
        for (const key of sortedKeys) {
            if (title.toLowerCase().includes(key.toLowerCase())) {
                faviconRelativePath = this.faviconMap[key];
                matchedKey = key;
                break;
            }
        }

        const resolvedPath = this.resolveIconPath(faviconRelativePath);

        // Always update to force refresh
        if (resolvedPath !== this.currentFavicon || true) {
            
            this.setFavicon(resolvedPath);
            this.currentFavicon = resolvedPath;
        }
    }

    private static setFavicon(path: string) {

        // Remove ALL existing favicon-related links
        const selectors = [
            'link[rel="icon"]',
            'link[rel="shortcut icon"]',
            'link[rel="apple-touch-icon"]',
            'link[rel="apple-touch-icon-precomposed"]'
        ];
        
        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                
                el.remove();
            });
        });

        // Add cache buster to force reload
        const cacheBuster = '?v=' + Date.now();
        const pathWithCache = path + cacheBuster;

        // Create new favicon links
        const createLink = (rel: string, type?: string) => {
            const link = document.createElement('link');
            link.rel = rel;
            if (type) link.type = type;
            link.href = pathWithCache;
            document.head.appendChild(link);
            
            return link;
        };

        createLink('icon', 'image/x-icon');
        createLink('shortcut icon', 'image/x-icon');
        createLink('apple-touch-icon');

        // Force favicon refresh in some browsers
        setTimeout(() => {
            const links = document.querySelectorAll('link[rel*="icon"]');
            links.forEach((link: Element) => {
                const htmlLink = link as HTMLLinkElement;
                const href = htmlLink.href;
                htmlLink.href = '';
                setTimeout(() => {
                    htmlLink.href = href;
                }, 10);
            });
        }, 100);
    }

    static destroy() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }
        
    }

    static addMapping(title: string, faviconPath: string) {
        this.faviconMap[title] = faviconPath;
        this.updateFavicon();
    }

    static removeMapping(title: string) {
        delete this.faviconMap[title];
        this.updateFavicon();
    }

    static getMappings(): Record<string, string> {
        return { ...this.faviconMap };
    }

    static setDefaultFavicon(path: string) {
        this.defaultFavicon = path;
        this.updateFavicon();
    }

    static setBasePath(path: string) {
        this.basePath = path.endsWith('/') ? path : path + '/';
        this.updateFavicon();
    }

    static getBasePath(): string {
        return this.basePath;
    }

    // Manual trigger for debugging
    static forceUpdate() {
        this.updateFavicon();
    }
}

export default FaviconLoader;
