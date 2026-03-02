declare namespace NodeJS {
    interface Process {

        defaultApp?: boolean;


        versions: NodeJS.ProcessVersions & {

            electron: string;

            chrome: string;
        };


        type?: 'browser' | 'renderer' | 'worker';


        resourcesPath: string;
    }
}


interface ImportMetaEnv {

    readonly VITE_DEV_SERVER_URL?: string;


    readonly VITE_API_URL?: string;


    readonly VITE_FIREBASE_API_KEY?: string;


    readonly VITE_FIREBASE_AUTH_DOMAIN?: string;


    readonly VITE_FIREBASE_PROJECT_ID?: string;


    readonly VITE_FIREBASE_STORAGE_BUCKET?: string;


    readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;


    readonly VITE_FIREBASE_APP_ID?: string;


    readonly PROD: boolean;


    readonly DEV: boolean;


    readonly MODE: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}


declare module '*.png' {
    const src: string;
    export default src;
}

declare module '*.svg' {
    const src: string;
    export default src;
}

declare module '*.ico' {
    const src: string;
    export default src;
}

declare module '*.icns' {
    const src: string;
    export default src;
}
