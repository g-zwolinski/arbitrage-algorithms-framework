import ArbitrageTriangleWithinExchange from "./algorithms/ArbitrageTriangleWithinExchangeParams";
import Bot from "./Bot";
import { log } from "./common/helpers";
import config from "./config";
// ccxt.d.ts

const bot = new Bot(config);
bot.init();
bot.printProfileTime();

Object.entries(bot.exchanges).forEach(async ([key, exchange]) => {
    try {
        await exchange.loadMarkets()
        for (let marketA in exchange.markets) {
            for (let marketB in exchange.markets) {
                for (let marketC in exchange.markets) {
                    if(marketA === marketB || marketA === marketC || marketB === marketC) continue
                    let results;
                    do {
                        bot.printProfileTime();
                        try {
                            results = bot.runAlgorithm(new ArbitrageTriangleWithinExchange({
                                exchange: exchange,
                                bot: bot,
                                markets: [
                                    exchange.markets[marketA],
                                    exchange.markets[marketB],
                                    exchange.markets[marketC]
                                ],
                                balances: bot.balances[key],
                                showWarnings: true
                            }));
                        } catch (err) {
                            log(`${err.name} ${err.message}`);
                            bot.printProfileTime();
                        }
                    } while (results)
                    bot.printProfileTime();
                }
            }
        }
    } catch (err) {
        log(`${err.name} ${err.message}`);
        bot.printProfileTime();
    }
});


// @TODO: add checking
// {
// 	...bot.config.ignore,
// 	...bot.config.MARKET_EXCHANGE_KEY.ignore,
// 	...bot.config.MARKET_KEY.ignore,
// 	...bot.config.MARKET_EXCHANGE_KEY.MARKET_KEY.ignore
// }