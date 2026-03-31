'use client'

import * as React from 'react'

import '@/app/globals.css'
import '@/app/engine.css'

import Head from 'next/head'
import Script from 'next/script'

import { ThemeProvider } from '@/app/controls/theme-provider'
import { Splash } from '@/app/controls/splash'

import EngineFS from '@/lib/EngineFS'

export default function V5U() {
    const [consoleVisible, setConsoleVisible] = React.useState(false);
    const [consoleLines, setConsoleLines] = React.useState<string[]>([]);
    const consoleEndRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        window.__engineConsoleAppend = (text: string) => {
            setConsoleLines(prev => {
                const next = [...prev, text];
                if (next.length > 500) next.splice(0, next.length - 500);
                return next;
            });
        };

        window.TS_InitFS = async (p: string, f: any) => {
            try {
                await EngineFS.Init(p);
                f();
            } catch (error) {
                console.error('EngineFS init failed:', error);
            }
        };
    }, []);

    React.useEffect(() => {
        if (consoleEndRef.current && consoleVisible) {
            consoleEndRef.current.scrollIntoView({ behavior: 'auto' });
        }
    }, [consoleLines, consoleVisible]);

    React.useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === '`' || e.key === '~') {
                e.preventDefault();
                setConsoleVisible(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, []);

    const getLineClass = (line: string): string => {
        if (line.includes('[ERROR]') || line.includes('ERROR') || line.includes('Exception') || line.includes('[FATAL]'))
            return 'engine-console-line--error';
        if (line.includes('WARNING') || line.includes('WARN'))
            return 'engine-console-line--warning';
        if (line.includes('MSZSetup:'))
            return 'engine-console-line--info';
        if (line.includes('->'))
            return 'engine-console-line--success';
        if (line.includes('TRANSITIONING'))
            return 'engine-console-line--highlight';
        if (line.includes('[STATUS]'))
            return 'engine-console-line--status';
        return '';
    };

    return (
        <>
            <Head>
                <meta name='viewport' content='initial-scale=1, viewport-fit=cover' />
            </Head>
            <div className='enginePage'>
                <ThemeProvider attribute='class' defaultTheme='dark' enableSystem>
                    <Splash />
                    <canvas className='engineCanvas' id='canvas' />

                    {consoleVisible && (
                        <div className='engine-console'>
                            <div className='engine-console-resize' />
                            <div className='engine-console-header'>
                                <span className='engine-console-title'>Engine Console</span>
                                <div className='engine-console-buttons'>
                                    <button
                                        className='engine-console-btn'
                                        onClick={() => setConsoleLines([])}
                                    >
                                        Clear
                                    </button>
                                    <button
                                        className='engine-console-btn'
                                        onClick={() => setConsoleVisible(false)}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                            <div className='engine-console-output'>
                                {consoleLines.map((line, i) => (
                                    <div
                                        key={i}
                                        className={`engine-console-line ${getLineClass(line)}`}
                                    >
                                        <span className='engine-console-line-number'>
                                            {String(i).padStart(4, '0')}
                                        </span>
                                        {line}
                                    </div>
                                ))}
                                <div ref={consoleEndRef} />
                            </div>
                        </div>
                    )}
                </ThemeProvider>
                <Script src='coi-serviceworker.js' />
                <Script src='./lib/RSDKv5U.js' />
                <Script src='./modules/RSDKv5U.js' />
            </div>
        </>
    )
}
