"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ArbitrageTriangleWithinExchange_1 = __importDefault(require("./algorithms/ArbitrageTriangleWithinExchange"));
const Bot_1 = __importDefault(require("./Bot"));
const helpers_1 = require("./common/helpers");
const config_1 = require("./common/config");
const localConfig = require("./config.local.example.json");
// ccxt.d.ts
process
    .on('unhandledRejection', (reason, p) => {
    console.error(reason, '\x1b[34mUnhandled Rejection at Promise\x1b[0m', p);
})
    .on('uncaughtException', err => {
    console.error(err, '\x1b[34mUncaught Exception thrown\x1b[0m');
    process.exit(1);
});
// add triggering by socket (additional lib per exchange, compatible with ccxt)
// crawl over markets by default
// @TODO: consider:
// moving to new CPU worker (optionally behind robin rounded proxy) if there is no other already running with given exchanges, otherwise add to queue   
const bot = new Bot_1.default(config_1.config(localConfig));
startBot();
function startBot() {
    return __awaiter(this, void 0, void 0, function* () {
        bot.init().then(() => startArbitrageTriangleWithinExchangeAlgorithm(), err => helpers_1.log(helpers_1.errorLogTemplate(err)));
        bot.printProfileTime();
    });
}
function startArbitrageTriangleWithinExchangeAlgorithm() {
    Object.entries(bot.exchanges).forEach(([key, exchange]) => __awaiter(this, void 0, void 0, function* () {
        try {
            yield exchange.loadMarkets();
            const validatedTriplets = ArbitrageTriangleWithinExchange_1.default.getValidatedTripletsOnExchange(exchange, bot.config.currenciesToWatch);
            helpers_1.log(`\x1b[32mFound ${validatedTriplets.length} ArbitrageTriangleWithinExchange triplets on ${exchange.id}\x1b[0m`);
            console.table(validatedTriplets);
            bot.cycle(validatedTriplets, (params) => {
                return new ArbitrageTriangleWithinExchange_1.default(params);
            }, element => ({
                exchange: exchange,
                bot: bot,
                markets: [
                    exchange.markets[element[0]],
                    exchange.markets[element[1]],
                    exchange.markets[element[2]]
                ],
                balances: bot.balances[key],
                validateMarkets: false
            }), () => {
                helpers_1.log(`\x1b[32mCycle ${exchange.id} ArbitrageTriangleWithinExchange\x1b[0m`);
            });
        }
        catch (err) {
            helpers_1.log(helpers_1.errorLogTemplate(err));
            bot.printProfileTime();
        }
    }));
}
// @TODO: add checking
// {
// 	...bot.config.ignore,
// 	...bot.config.MARKET_EXCHANGE_KEY.ignore,
// 	...bot.config.MARKET_KEY.ignore,
// 	...bot.config.MARKET_EXCHANGE_KEY.MARKET_KEY.ignore
// }
//# sourceMappingURL=example.js.map