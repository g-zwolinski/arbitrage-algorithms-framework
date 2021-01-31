import ArbitrageTriangleWithinExchange from './algorithms/ArbitrageTriangleWithinExchange';
import ArbitrageBetweenExchanges from './algorithms/ArbitrageBetweenExchanges';
import ArbitrageTriangularBetweenExchanges from './algorithms/ArbitrageTriangularBetweenExchanges';
import { errorLogTemplate, log, validationException } from './common/helpers';
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
                }, err => log(errorLogTemplate(err)));
            }
        })
    }

	async runAlgorithm(
		algoritm: ArbitrageTriangleWithinExchange | ArbitrageBetweenExchanges | ArbitrageTriangularBetweenExchanges
	) {
		let result;
		do {
			try {
				result = algoritm.run();
			} catch (e) {
				log(errorLogTemplate(e));
			}
        } while (result)
    }

	cycle: (
		toIterate: any[], 
        algorithm: (params) => ArbitrageTriangleWithinExchange | ArbitrageBetweenExchanges | ArbitrageTriangularBetweenExchanges,
        paramsFromElement: (element: any) => any,
        onCycleRun: () => any
	) => boolean = (toIterate, algorithm, paramsFromElement, onCycleRun = () => null) => {
        onCycleRun();

		toIterate.forEach(async element => {
            log(`${element}`);
            await this.runAlgorithm(algorithm(paramsFromElement(element)));
		});
		return this.cycle(toIterate, algorithm, paramsFromElement, onCycleRun);
	}
    
    validateExchange(exchange: string) {
        if (!this.config.exchangesToWatch.includes(exchange)) {
            validationException('EXCHANGE', `${exchange} IS IGNORED`);
        }
    }

    async fetchBalanceAsync(exchange: Exchange) {
        let balance: Balances;
    
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