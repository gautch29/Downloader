// Type declarations for zt-film-api
declare module 'zt-film-api' {
    export default class ZTP {
        static useBaseURL(url?: string): Promise<void>;
        static search(category: string, query: string): Promise<any[]>;
    }
}

