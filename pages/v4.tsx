'use client'

import * as React from 'react'
import { useState, useEffect, useRef } from 'react'

import '@/app/globals.css'
import '@/app/engine.css'

import Head from 'next/head'
import Script from 'next/script'
import { ThemeProvider } from '@/app/controls/theme-provider'
import { Splash } from '@/app/controls/splash'
import EngineFS from '@/lib/EngineFS'

export default function V4() {
    const [isReady, setIsReady] = useState(false);
    const consoleRef = useRef<HTMLTextAreaElement>(null);

    // 1. Console Capture (Optional, but helps debug the worker)
    useEffect(() => {
        const originalLog = console.log;
        const originalError = console.error;

        const logToScreen = (msg: string) => {
            if (consoleRef.current) {
                consoleRef.current.value += msg + "\n";
                consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
            }
        };

        console.log = (...args) => { originalLog.apply(console, args); logToScreen(args.join(' ')); };
        console.error = (...args) => { originalError.apply(console, args); logToScreen("[ERR] " + args.join(' ')); };

        return () => { console.log = originalLog; console.error = originalError; };
    }, []);

    // 2. Security Check (The Gate)
    useEffect(() => {
        // If the browser says we are "Isolated", Pthreads will work.
        if (window.crossOriginIsolated) {
            console.log("Environment Secure (COOP/COEP). Loading Game...");
            setIsReady(true);
        } else {
            console.log("Environment Insecure. Waiting for Service Worker Reload...");
        }
    }, []);

    // 3. FileSystem Hook
    useEffect(() => {
        if (!isReady) return;
        // @ts-ignore
        window.TS_InitFS = async (p: string, f: any) => {
            console.log("Initializing FileSystem...");
            try {
                await EngineFS.Init(p);
                console.log("FS Ready. Starting Engine.");
                f();
            } catch (error) {
            }
        };
    }, [isReady]);

    return (
        <>
            <Head>
                <meta name='viewport' content='initial-scale=1, viewport-fit=cover' />
            </Head>
            <div className='enginePage' style={{position: 'relative', width: '100vw', height: '100vh', backgroundColor: 'black'}}>
                <ThemeProvider attribute='class' defaultTheme='dark' enableSystem>
                    
                    {/* 1. Load the Service Worker FIRST. It will reload the page if needed. */}
                    <Script src='coi-serviceworker.js' strategy="beforeInteractive" />

                    {/* 2. Only render Game & Scripts if Secure */}
                    {isReady ? (
                        <>
                            <Splash/>
                            <canvas className='engineCanvas' id='canvas' style={{display: 'block', width: '100%', height: '100%'}} />
                            
                            {/* Load Wrapper First, then Engine */}
                            <Script src='./lib/RSDKv4.js' strategy="lazyOnload" />
                            <Script src='./modules/RSDKv4.js' strategy="lazyOnload" />
                        </>
                    ) : (
                        // Loading Screen while waiting for reload
                        <div style={{color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%'}}>
                            <h2>Enabling High Performance Mode...</h2>
                        </div>
                    )}

                    {/* Mini Console for debugging Pthread errors */}
                    <textarea 
                        ref={consoleRef} 
                        style={{position: 'absolute', bottom: 0, left: 0, width: '100%', height: '100px', background: 'rgba(0,0,0,0.8)', color: 'lime', border: 'none', fontSize: '10px', zIndex: 9999}}
                        readOnly 
                    />

                </ThemeProvider>
            </div>
        </>
    )
}
