export declare const errorLogTemplate: (e: Error) => string;
export declare function log(message: any, type?: 'log' | 'warn', run?: boolean): void;
export declare const validationException: (algorithmType: string, message: string) => {
    message: string;
    name: string;
};
export declare const floatRound: (value: number, precision: number, type: 'ceil' | 'floor' | 'round') => number;
