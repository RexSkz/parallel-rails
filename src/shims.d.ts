declare global {
    const sounds: any;

    type WindowG = typeof import('./Global').default;
    type WindowDebug = import('./types').DebugApi;

    interface Window {
        _G?: WindowG;
        Debug?: WindowDebug;
    }
}

export {};
