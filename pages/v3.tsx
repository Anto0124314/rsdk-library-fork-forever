'use client'

import * as React from 'react'

import '@/app/globals.css'
import '@/app/engine.css'

// --------------------
// UI Component Imports
// --------------------

import Script from 'next/script'

import { ThemeProvider } from '@/app/controls/theme-provider'
import { Splash } from '@/app/controls/splash'

// ---------------
// Library Imports
// ---------------

import EngineFS from '@/lib/EngineFS'

// ----------------
// Favicon Loader
// ----------------

function loadFavicon(href: string) {
    let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
    }
    link.type = 'image/x-icon';
    link.href = href;
}

// ---------------------
// Component Definitions
// ---------------------

export default function V3() {
    React.useEffect(() => {
        // ---- Favicon ----
        loadFavicon('./icons/CD.ico');

        // ---- Viewport meta (App Router doesn't support next/head) ----
        let meta: HTMLMetaElement | null = document.querySelector("meta[name='viewport']");
        if (!meta) {
            meta = document.createElement('meta');
            meta.name = 'viewport';
            document.head.appendChild(meta);
        }
        meta.content = 'initial-scale=1, viewport-fit=cover';

        // ---- Engine FS init ----
        window.TS_InitFS = async (p: string, f: any) => {
            try {
                await EngineFS.Init(p);
                f();
            } catch (error) {
                console.error('EngineFS init failed:', error);
            }
        };
    }, []);

    return (
        <div className='enginePage'>
            <ThemeProvider attribute='class' defaultTheme='dark' enableSystem>
                <Splash />
                <canvas className='engineCanvas' id='canvas' />
            </ThemeProvider>
            <Script src='./coi-serviceworker.js' strategy='beforeInteractive' />
            <Script src='./lib/RSDKv3.js' />
            <Script src='./modules/RSDKv3.js' />
        </div>
    )
}
