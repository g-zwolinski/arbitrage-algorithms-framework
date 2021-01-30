import ArbitrageTriangleWithinExchange from './algorithms/ArbitrageTriangleWithinExchange';
import ArbitrageBetweenExchanges from './algorithms/ArbitrageBetweenExchanges';
import ArbitrageTriangularBetweenExchanges from './algorithms/ArbitrageTriangularBetweenExchanges';
import { log, validationException } from './common/helpers';
import ccxt, { Balances, Exchange } from 'ccxt';

export interface BotConfig {
    profile: boolean;
    exchangesToWatch: string[];
    exchangeOptions: {
        [key: string /* exchange */]: any
    },
    defaultExchangeOptions: any;
    keys: {
        [key: string /* exchange */]: {
            apiKey: string;
            secret: string;
        }
    }
}

interface ExchangeBalance {
    free: {
        [key: string]: number;
    };
    used: {
        [key: string]: number;
    };
    total: {
        [key: string]: number;
    };
}

export default class Bot {
    config: BotConfig;
    exchanges: {
        [key: string]: Exchange
    } = {};
    balances: {
        [key: string]: Balances
    } = {};
	// check if market is active before running algoritm
	constructor(config: BotConfig) {
        this.config = config;
    }
    
	printProfileTime() {
        if (!this.config.profile) { return; }
        console.log(new Date().toLocaleString());
    }
    
    init() {
        ccxt.exchanges.forEach(async (exchange: string) => {
            if (this.config.exchangesToWatch.includes(exchange)) {
                this.validateExchange(exchange);
                this.exchanges[exchange] = new(ccxt)[exchange]({
                    ...this.config.defaultExchangeOptions,
                    ...this.config.exchangeOptions[exchange]
                });
                this.exchanges[exchange].apiKey = this.config.keys[exchange].apiKey;
                this.exchanges[exchange].secret = this.config.keys[exchange].secret;

                await this.fetchBalance(this.exchanges[exchange]).then(balance => {
                    this.balances[exchange] = balance;
                }, err => log(`${err.name} ${err.message}`));
            }
        })
    }

	// add triggering by socket (additional lib per exchange, compatible with cctx)
	// crawl over markets by default

	runAlgorithm(
		algoritm: ArbitrageTriangleWithinExchange | ArbitrageBetweenExchanges | ArbitrageTriangularBetweenExchanges
	) {
		// @TODO: consider:
		// moving to new CPU worker (optionally behind proxy - new keys needed? propably not in case proxy - before running algo we use public key) if there is no other already running with given exchanges, otherwise add to queue

		let result;
		do {
			try {
				result = algoritm.run();
			} catch (e) {
				console.log(e)
			}
		} while (result)
    }

    cycle(callback: any) {
        let results;
        do {
            results = callback();
        } while (results)
    }
    
    validateExchange(exchange: string) {
        if (!this.config.exchangesToWatch.includes(exchange)) {
            validationException('EXCHANGE', `${exchange} IS IGNORED`);
        }
    }

    async fetchBalanceAsync(exchange: Exchange) {
        let balance;
    
        try {
            balance = await exchange.fetchBalance();
        } catch (err) {
            log(err);
            await exports.fetchBalance(exchange);
        }
        return balance;
    }
    
    fetchBalance(exchange: Exchange) {
        return exchange.fetchBalance();
    }
}