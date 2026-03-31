export {};

declare global {
    interface Window {
        TS_InitFS: (p: string, f: () => void) => Promise<void>;
        __engineConsoleAppend: (text: string) => void;
    }
}
