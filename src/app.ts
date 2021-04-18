import ArbitrageTriangleWithinExchange, { ArbitrageTriangleWithinExchangeParams } from "./algorithms/ArbitrageTriangleWithinExchange";
import Bot from "./Bot";
import { errorLogTemplate, log } from "./common/helpers";
import config from "./config";
// ccxt.d.ts

process
.on('unhandledRejection', (reason, p) => {
    console.error(reason, '\x1b[34mUnhandled Rejection at Promise\x1b[0m', p);
})
.on('uncaughtException', err => {
    console.error(err, '\x1b[34mUncaught Exception thrown\x1b[0m');
    process.exit(1);
});


// add triggering by socket (additional lib per exchange, compatible with cctx)
// crawl over markets by default

// @TODO: consider:
// moving to new CPU worker (optionally behind proxy) if there is no other already running with given exchanges, otherwise add to queue   

const bot = new Bot(config);
startBot();

async function startBot() {
    bot.init().then(
        () => startArbitrageTriangleWithinExchangeAlgorithm(),
        err => log(errorLogTemplate(err))
    );
    bot.printProfileTime();
}

function startArbitrageTriangleWithinExchangeAlgorithm() {
    Object.entries(bot.exchanges).forEach(async ([key, exchange]) => {
        try {
            await exchange.loadMarkets();
            const validatedTriplets = ArbitrageTriangleWithinExchange.getValidatedTripletsOnExchange(exchange, config.currenciesToWatch);

            log(`\x1b[32mFound ${validatedTriplets.length} ArbitrageTriangleWithinExchange triplets on ${exchange.id}\x1b[0m`);
            console.table(validatedTriplets)
            // validatedTriplets.forEach((triplet, index) => log([index + 1, ...triplet].join(' ')));

            bot.cycle(
                validatedTriplets, 
                (params: ArbitrageTriangleWithinExchangeParams) => {
                    return new ArbitrageTriangleWithinExchange(params)
                }, element => ({
                    exchange: exchange,
                    bot: bot,
                    markets: [
                        exchange.markets[element[0]],
                        exchange.markets[element[1]],
                        exchange.markets[element[2]]
                    ],
                    balances: bot.balances[key],
                    showWarnings: false,
                    validateMarkets: false
                }),
                () => {
                    log( `\x1b[32mCycle ${exchange.id} ArbitrageTriangleWithinExchange\x1b[0m`)
                }
            );
        } catch (err) {
            log(errorLogTemplate(err));
            bot.printProfileTime();
        }
    });
}

// po 2 markety na 1 exchange, 1 transfer miedzy gieldami
// 2 markety na 1. exchange, 1 na 2. exchange, 1 transfer miedzy gieldami
// po 1 market na 1 exchange, 1 transfer miedzy gieldami

// @TODO: add checking
// {
// 	...bot.config.ignore,
// 	...bot.config.MARKET_EXCHANGE_KEY.ignore,
// 	...bot.config.MARKET_KEY.ignore,
// 	...bot.config.MARKET_EXCHANGE_KEY.MARKET_KEY.ignore
// }