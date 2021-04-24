import { Balances, Exchange, Market, MinMax } from 'ccxt';
import Bot from '../Bot';
import { Amount } from '../common/interfaces';
import { BidsOrAsks, BuyOrSell, OrderType } from '../common/types';
import Algorithm from './Algorithm';
import { AlgorithmCommonParams } from './Algorithm';
import { BigNumber } from "bignumber.js";
export interface ArbitrageTriangleWithinExchangeParams extends AlgorithmCommonParams {
    exchange: Exchange;
    validateMarkets: boolean;
    minimumsCorrectionTries?: number;
}
interface DIRECTIONS_SEQUENCE {
    orders: BuyOrSell[];
    ordersbookSide: BidsOrAsks[];
}
export default class ArbitrageTriangleWithinExchange extends Algorithm {
    static ALGORITHM_TYPE: string;
    DIRECTIONS_SEQUENCES: DIRECTIONS_SEQUENCE[];
    availableDirections: DIRECTIONS_SEQUENCE[];
    bot: Bot;
    exchange: Exchange;
    marketsTriplet: Market[];
    availableBalances: Balances;
    validateMarkets: boolean;
    orderBooks: {
        [key: string]: {
            bids: number[][];
            asks: number[][];
        };
    };
    minimum: {
        amount: Amount[];
        cost: Amount[];
        market: string;
    }[];
    minimumsCorrectionTries: any;
    constructor(params: ArbitrageTriangleWithinExchangeParams);
    static validateMarkets(markets: Market[]): boolean;
    isBalanceSufficientForOrder(order: BuyOrSell, balance: number, marketLimits: {
        amount: MinMax;
        price: MinMax;
        cost?: MinMax;
    }): boolean;
    validateBalances(markets: Market[], balances: Balances): boolean;
    static getValidatedTripletsOnExchange(exchange: Exchange, toWatch?: string[], showLoadingStatus?: boolean, showLoadingErrors?: boolean, checkBalances?: boolean): string[][];
    static throwValidationException(message: any): void;
    validate(markets: Market[], balances: Balances): void;
    getOrderBooks(): Promise<void>;
    getPrecision(market: Market, of: string): any;
    getQuantity(market: Market, total: BigNumber, ordersbookSide: BidsOrAsks): {
        quantity: BigNumber;
        price: number;
    };
    onArbitrageTriangleWithinExchangeRun(): Promise<unknown>;
    makeOrder(market: any, side: any, amount: any, price: any, additionalParams?: {}): any;
    getCost(market: Market, amount: BigNumber, ordersbookSide: BidsOrAsks): {
        total: BigNumber;
        price: number;
    };
    getMinCost(market: Market, ordersbookSide: BidsOrAsks): {
        total: BigNumber;
        price: number;
    };
    fees(market: Market, amount: number, price: number, buyOrSell: BuyOrSell, orderType?: OrderType): any;
    calculateFeeFallback(fees: any, market: any, side: any, amount: any, price: any, takerOrMaker?: string): any;
}
export {};
