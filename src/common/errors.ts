import Bot from "../Bot";
import ccxt, { BaseError, Exchange } from 'ccxt';

export default class BotErrorHandler {
    static handleError = (bot: Bot, err: BaseError, exchange: Exchange, market = '') => {
        const changeProxy = bot.config.enableProxy && bot.config.changeProxyAfterAnyNetworkError && (
            err instanceof ccxt.RequestTimeout ||
            err instanceof ccxt.ExchangeNotAvailable ||
            err instanceof ccxt.NetworkError ||
            err instanceof ccxt.DDoSProtection
        );
    
        if (changeProxy) {
            bot.setExchangeProxy(exchange);
        }
    
        if(bot.config.logError) {
            // @TODO: format
            console.log(exchange.symbol, market, typeof err);
            if(!bot.config.logErrorDetails) console.log(err);
            return;
        }
    
        if (err !instanceof BaseError) {
            throw err;
        }
    }
}