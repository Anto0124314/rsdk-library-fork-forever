export {};

declare global {
    interface Window {
        TS_InitFS: (p: string, f: () => void) => Promise<void>;
        __engineConsoleAppend: (text: string) => void;
        Module?: {
            print: (text: string) => void;
            printErr: (text: string) => void;
            setStatus: (text: string) => void;
            canvas: HTMLCanvasElement;
        };
    }
}
