'use client'

import * as React from 'react'
import { useEffect, useRef, useState } from 'react'

import '@/app/globals.css'
import '@/app/engine.css'

import Head from 'next/head'
import Script from 'next/script'
import { ThemeProvider } from '@/app/controls/theme-provider'
import { Splash } from '@/app/controls/splash'
import EngineFS from '@/lib/EngineFS'

export default function V4() {
    const consoleRef = useRef<HTMLTextAreaElement>(null);
    const [isVisible, setIsVisible] = useState(true);
    const [isReady, setIsReady] = useState(false); // <--- NEW STATE

    // ---------------------------------------------------------
    // 1. Security Check Hook (The Gate)
    // ---------------------------------------------------------
    useEffect(() => {
        // Check if we are in a Secure Context (Pthreads allowed)
        if (typeof window !== 'undefined' && window.crossOriginIsolated) {
            setIsReady(true); // Allow game to load
        } else {
            console.log("Page is not cross-origin isolated. Waiting for COI Service Worker...");
            // The coi-serviceworker script (loaded below) will handle the reload.
            // We just wait here.
        }
    }, []);

    // ---------------------------------------------------------
    // 2. Console Hook
    // ---------------------------------------------------------
    useEffect(() => {
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;

        const appendToVirtualConsole = (type: string, args: any[]) => {
            if (consoleRef.current) {
                const message = args.map(arg => {
                    try {
                        if (arg instanceof Error) return `${arg.name}: ${arg.message}\n${arg.stack}`;
                        return (typeof arg === 'object') ? JSON.stringify(arg) : String(arg);
                    } catch (e) {
                        return String(arg);
                    }
                }).join(' ');
                const timestamp = new Date().toLocaleTimeString().split(' ')[0];
                consoleRef.current.value += `[${timestamp}] [${type}] ${message}\n`;
                consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
            }
        };

        console.log = (...args) => { originalLog.apply(console, args); appendToVirtualConsole('LOG', args); };
        console.warn = (...args) => { originalWarn.apply(console, args); appendToVirtualConsole('WRN', args); };
        console.error = (...args) => { originalError.apply(console, args); appendToVirtualConsole('ERR', args); };
        
        window.addEventListener('error', (e) => appendToVirtualConsole('CRASH', [e.message]));

        return () => {
            console.log = originalLog;
            console.warn = originalWarn;
            console.error = originalError;
        };
    }, []);

    // ---------------------------------------------------------
    // 3. FileSystem Hook (Only runs if Ready)
    // ---------------------------------------------------------
    useEffect(() => {
        if (!isReady) return; // Don't init FS until secure

        // @ts-ignore
        window.TS_InitFS = async (p: string, f: any) => {
            console.log("Initializing FileSystem...");
            try {
                await EngineFS.Init(p);
                console.log("FileSystem Initialized.");
                f();
            } catch (error) {
                console.error("FS Init Failed:", error);
            }
        };
    }, [isReady]);

    return (
        <>
            <Head>
                <meta name='viewport' content='initial-scale=1, viewport-fit=cover' />
            </Head>
            
            <div className='enginePage' style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: 'black' }}>
                <ThemeProvider attribute='class' defaultTheme='dark' enableSystem>
                    
                    {/* Always load COI Service Worker first */}
                    <Script src='coi-serviceworker.js' strategy="beforeInteractive" />

                    {/* ONLY Render Game Components if Secure */}
                    {isReady ? (
                        <>
                            <canvas 
                                id='canvas' 
                                className='engineCanvas' 
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, display: 'block' }} 
                                onContextMenu={(e) => e.preventDefault()}
                            />
                            
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, pointerEvents: 'none' }}>
                                <Splash/>
                            </div>

                            {/* Load Game Scripts Only Now */}
                            <Script src='./lib/RSDKv4.js' strategy="lazyOnload" />
                            <Script src='./modules/RSDKv4.js' strategy="lazyOnload" />
                        </>
                    ) : (
                        // Loading Screen while waiting for Page Reload
                        <div style={{ 
                            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            color: 'white', fontFamily: 'monospace', zIndex: 999 
                        }}>
                            <h2>Enabling High Performance Mode (Reloading)...</h2>
                        </div>
                    )}

                    {/* Console (Always visible for debugging) */}
                    <div style={{ 
                        position: 'absolute', bottom: 0, left: 0, width: '100%', height: '25vh', 
                        backgroundColor: 'rgba(0, 0, 0, 0.9)', borderTop: '2px solid #333', zIndex: 9999, 
                        display: isVisible ? 'flex' : 'none', flexDirection: 'column' 
                    }}>
                        <textarea 
                            id="output" 
                            ref={consoleRef}
                            readOnly
                            style={{ flex: 1, backgroundColor: 'transparent', color: '#00ff00', border: 'none', resize: 'none', padding: '10px' }}
                        />
                    </div>

                </ThemeProvider>
            </div>
        </>
    )
}
