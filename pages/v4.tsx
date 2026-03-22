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

    // 3. FileSystem Hook
    useEffect(() => {
        if (!isReady) return;
        
        // @ts-ignore
        window.TS_InitFS = async (p: string, f: any) => {
            await new Promise(resolve => setTimeout(resolve, 500));

            // @ts-ignore
            if (typeof IDBFS === 'undefined') {
                console.error("IDBFS is UNDEFINED. Build is missing -lidbfs.js flag!");
                f();
                return;
            }

            try {
                await EngineFS.Init(p);
                console.log("FileSystem Ready.");
                f();
            } catch (error) {
                console.error("FS Error:", error);
                f(); 
            }
        };
    }, [isReady]);

    // 4. Audio Context Unlocker (Required for Web Audio)
    useEffect(() => {
        const unlockAudio = () => {
            // Emscripten exposes the AudioContext via the Module object
            // @ts-ignore
            if (window.Module && window.Module.SDL2 && window.Module.SDL2.audioContext) {
                // @ts-ignore
                const audioCtx = window.Module.SDL2.audioContext;
                if (audioCtx.state === 'suspended') {
                    audioCtx.resume().then(() => {
                        console.log("AudioContext resumed successfully.");
                    }).catch((e: any) => console.error("Audio resume failed:", e));
                }
            } else {
                // Fallback standard web audio unlock
                // @ts-ignore
                if (window.SDL && window.SDL.audioContext && window.SDL.audioContext.state === 'suspended') {
                     // @ts-ignore
                     window.SDL.audioContext.resume().then(() => console.log("AudioContext resumed successfully."));
                }
            }
        };

        // Listen for user interaction
        window.addEventListener('click', unlockAudio, { once: true });
        window.addEventListener('keydown', unlockAudio, { once: true });
        window.addEventListener('touchstart', unlockAudio, { once: true });

        return () => {
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('keydown', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
        };
    }, []);

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
                            <canvas 
                                id='canvas' 
                                className='engineCanvas' 
                                style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'block'}} 
                                onContextMenu={(e)=>e.preventDefault()} 
                            />
                            
                            <div id="splash" style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', transition: 'opacity 1s ease'}}>
                                <Splash/>
                            </div>
                            
                            <Script src='./lib/RSDKv4.js' strategy="lazyOnload" />
                            <Script src='./modules/RSDKv4.js' strategy="lazyOnload" />
                        </>
                    ) : (
                        <div style={{color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%'}}>
                            <h2>Enabling High Performance Mode...</h2>
                            <p style={{color: '#888'}}>Reloading to enable Pthreads</p>
                        </div>
                    )}

                    {/* CONSOLE OUTPUT */}
                    <textarea 
                        ref={consoleRef} 
                        style={{
                            position: 'absolute', 
                            bottom: 0, 
                            left: 0, 
                            width: '100%', 
                            height: '150px', 
                            background: 'rgba(0,0,0,0.85)', 
                            color: '#00ff00', 
                            borderTop: '1px solid #333', 
                            border: 'none', 
                            fontSize: '12px', 
                            fontFamily: 'monospace', 
                            padding: '10px', 
                            resize: 'none', 
                            outline: 'none', 
                            zIndex: 9999
                        }} 
                        readOnly 
                    />

                </ThemeProvider>
            </div>
        </>
    )
}
