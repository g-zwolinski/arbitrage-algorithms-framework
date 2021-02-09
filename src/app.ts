import ArbitrageTriangleWithinExchange, { ArbitrageTriangleWithinExchangeParams } from "./algorithms/ArbitrageTriangleWithinExchange";
import Bot from "./Bot";
import { errorLogTemplate, log } from "./common/helpers";
import config from "./config";
// ccxt.d.ts

process
.on('unhandledRejection', (reason, p) => {
    console.error(reason, 'Unhandled Rejection at Promise', p);
})
.on('uncaughtException', err => {
    console.error(err, 'Uncaught Exception thrown');
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
            const validatedTriplets = ArbitrageTriangleWithinExchange.getValidatedTripletsOnExchange(exchange);

            log(`Found ${validatedTriplets.length} ArbitrageTriangleWithinExchange triplets on ${exchange.id}`);
            validatedTriplets.forEach((triplet, index) => log([index + 1, ...triplet].join(' ')));

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
                    log( `Cycle ${exchange.id} ArbitrageTriangleWithinExchange`)
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