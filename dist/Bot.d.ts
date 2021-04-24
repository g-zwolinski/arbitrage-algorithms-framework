import ccxt, { Balances, Exchange } from 'ccxt';
import Algorithm from './algorithms/Algorithm';
import Telegram, { TelegramParams } from './misc/Telegram';
export interface BotConfig {
    keys: {
        [key: string]: {
            apiKey: string;
            secret: string;
        };
    };
    exchangesToWatch: string[];
    orderBookLimit: number;
    exchangeOptions: {
        [key: string]: any;
    };
    defaultExchangeOptions: any;
    currenciesToWatch: string[];
    makeOrders: boolean;
    parallelOrders: boolean;
    profile: boolean;
    logDetails: boolean;
    logAdditionalDetails: boolean;
    logWarnings: boolean;
    logAdditionalWarnings: boolean;
    logError: boolean;
    logErrorDetails: boolean;
    feesRate: number;
    zeroesFeesCorrection: boolean;
    correctAllFees: boolean;
    feesRoundType: 'ceil' | 'floor' | 'round';
    orderOptionsByExchange: {
        [key: string]: any;
    };
    defaultOrderOptions: any;
    enableProxy: boolean;
    changeProxyAfterEveryOrder: boolean;
    changeProxyAfterAnyNetworkError: boolean;
    proxies: string[];
    telegram?: TelegramParams;
}
export default class Bot {
    config: BotConfig;
    exchanges: {
        [key: string]: Exchange;
    };
    balances: {
        [key: string]: Balances;
    };
    cycleIndex: number;
    proxyIndex: number;
    telegram: Telegram;
    constructor(config: BotConfig);
    printProfileTime(): void;
    init(): Promise<void>;
    runAlgorithm(algorithm: Algorithm): Promise<unknown>;
    runAlgorithmOnIteratedElement(elementsArray: any, algorithm: any, paramsFromElement: any): Promise<void>;
    cycle: (toIterate: any[], algorithm: (params: any) => Algorithm, paramsFromElement: (element: any) => any, onCycleRun: () => any) => void;
    validateExchange(exchange: string): void;
    fetchBalanceAsync(exchange: Exchange): Promise<ccxt.Balances>;
    fetchBalance(exchange: Exchange): Promise<ccxt.Balances>;
    setExchangeProxy(exchange: Exchange, index?: number | null): void;
    makeOrder(exchange: Exchange, market: any, side: any, amount: any, price: any, additionalParams?: {}): any;
}
