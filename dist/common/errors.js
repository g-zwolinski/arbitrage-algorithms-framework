"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const ccxt_1 = __importStar(require("ccxt"));
class BotErrorHandler {
}
exports.default = BotErrorHandler;
BotErrorHandler.handleError = (bot, err, exchange, market = '') => {
    const changeProxy = bot.config.enableProxy && bot.config.changeProxyAfterAnyNetworkError && (err instanceof ccxt_1.default.RequestTimeout ||
        err instanceof ccxt_1.default.ExchangeNotAvailable ||
        err instanceof ccxt_1.default.NetworkError ||
        err instanceof ccxt_1.default.DDoSProtection);
    if (changeProxy) {
        bot.setExchangeProxy(exchange);
    }
    if (bot.config.logError) {
        // @TODO: format
        console.log(exchange.symbol, market, typeof err);
        if (!bot.config.logErrorDetails)
            console.log(err);
        return;
    }
    if (err instanceof ccxt_1.BaseError) {
        throw err;
    }
};
//# sourceMappingURL=errors.js.map