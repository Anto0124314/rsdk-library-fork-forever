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

    // 1. Console Hook
    useEffect(() => {
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        const logToScreen = (type: string, msg: string) => {
            if (consoleRef.current) {
                consoleRef.current.value += `[${type}] ${msg}\n`;
                consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
            }
        };

        console.log = (...args) => { originalLog.apply(console, args); logToScreen("LOG", args.join(' ')); };
        console.error = (...args) => { originalError.apply(console, args); logToScreen("ERR", args.join(' ')); };
        console.warn = (...args) => { originalWarn.apply(console, args); logToScreen("WRN", args.join(' ')); };

        return () => { 
            console.log = originalLog; 
            console.error = originalError; 
            console.warn = originalWarn;
        };
    }, []);

    // 2. Security Gate
    useEffect(() => {
        if (window.crossOriginIsolated) {
            console.log("Environment Secure (COOP/COEP Active).");
            setIsReady(true);
        } else {
            console.log("Environment Insecure. Waiting for Service Worker Reload...");
        }
    }, []);

    // 3. FileSystem Hook (With Pthread Ready Wait)
    useEffect(() => {
        if (!isReady) return;
        
        // @ts-ignore
        window.TS_InitFS = async (p: string, f: any) => {
            // --- FIX: Wait for Pthread pool to fully initialize ---
            // Without this delay, FS.syncfs fires before the workers are ready,
            // causing the callback to get lost (deadlock).
            // RSDKv5U avoids this by initing FS from C++ (after threads are running).
            console.log("Waiting for Pthread pool...");
            await new Promise(resolve => setTimeout(resolve, 500));

            // --- DEBUG: Check if IDBFS is available ---
            // @ts-ignore
            if (typeof IDBFS === 'undefined') {
                console.error("IDBFS is UNDEFINED. Build is missing -lidbfs.js flag!");
                // Fallback: Start game without persistent storage
                f();
                return;
            } else {
                console.log("IDBFS is available.");
            }

            console.log("Initializing FileSystem...");
            try {
                await EngineFS.Init(p);
                console.log("FileSystem Ready.");
                f();
            } catch (error) {
                console.error("FS Error:", error);
                // Start game anyway even if FS fails
                f();
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
                    
                    <Script src='coi-serviceworker.js' strategy="beforeInteractive" />

                    {isReady ? (
                        <>
                            <canvas id='canvas' className='engineCanvas' style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'block'}} onContextMenu={(e)=>e.preventDefault()} />
                            <div style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none'}}><Splash/></div>
                            
                            <Script src='./lib/RSDKv4.js' strategy="lazyOnload" />
                            <Script src='./modules/RSDKv4.js' strategy="lazyOnload" />
                        </>
                    ) : (
                        <div style={{color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%'}}>
                            <h2>Enabling High Performance Mode...</h2>
                            <p style={{color: '#888'}}>Reloading to enable Pthreads</p>
                        </div>
                    )}

                    <textarea 
                        ref={consoleRef} 
                        style={{position: 'absolute', bottom: 0, left: 0, width: '100%', height: '150px', background: 'rgba(0,0,0,0.85)', color: '#00ff00', borderTop: '1px solid #333', border: 'none', fontSize: '12px', fontFamily: 'monospace', padding: '10px', resize: 'none', outline: 'none', zIndex: 9999}} 
                        readOnly 
                    />

                </ThemeProvider>
            </div>
        </>
    )
}
