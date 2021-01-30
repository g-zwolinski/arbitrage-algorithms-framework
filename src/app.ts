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
        await exchange.loadMarkets();
        const validatedTriplets: string[][] = [];
        let marketsNumber = Object.entries(exchange.markets).length;
        let i = 0;

        for (let marketA in exchange.markets) {
            log(`Loading ${exchange.id} ArbitrageTriangleWithinExchange ${((i / marketsNumber) * 100).toFixed()}%`);
            i++;
            for (let marketB in exchange.markets) {
                for (let marketC in exchange.markets) {
                    if(marketA === marketB || marketA === marketC || marketB === marketC) { continue; }
                    try {
                        if (ArbitrageTriangleWithinExchange.validateMarkets([
                            exchange.markets[marketA],
                            exchange.markets[marketB],
                            exchange.markets[marketC]
                        ])) {
                            validatedTriplets.push([marketA, marketB, marketC]);
                        }
                    } catch {}
                }
            }
        }

        log(`Found ${validatedTriplets.length} ArbitrageTriangleWithinExchange triplets on ${exchange.id}`);
        validatedTriplets.forEach((triplet, index) => log([index + 1, ...triplet].join(' ')));

        bot.cycle(async () => {
            validatedTriplets.forEach(triplet => {
                let results;
                do {
                    results = false;
                    try {
                        results = bot.runAlgorithm(new ArbitrageTriangleWithinExchange({
                            exchange: exchange,
                            bot: bot,
                            markets: [
                                exchange.markets[triplet[0]],
                                exchange.markets[triplet[1]],
                                exchange.markets[triplet[2]]
                            ],
                            balances: bot.balances[key],
                            showWarnings: true,
                            validateMarkets: false
                        }));
                    } catch (err) {
                        log(`${err.name} ${err.message}`);
                        bot.printProfileTime();
                    }
                } while (results)
            });
        });
        bot.printProfileTime();
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