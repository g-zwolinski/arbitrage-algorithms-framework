import { errorLogTemplate, log, validationException } from './common/helpers';
import ccxt, { Balances, Exchange } from 'ccxt';
import Algorithm from './algorithms/Algorithm';
import Telegram, { TelegramParams } from './misc/Telegram';
import { BUY, SELL } from './common/constants';

export interface BotConfig {
    keys: {
        [key: string /* exchange */]: {
            apiKey: string;
            secret: string;
        }
    };
    exchangesToWatch: string[];
    orderBookLimit: number;
    exchangeOptions: {
        [key: string /* exchange */]: any
    };
    defaultExchangeOptions: any;
    currenciesToWatch: string[];

    makeOrders: boolean;
    parallelOrders: boolean;

    profile: boolean;
    logDetails: boolean;
    logAdditionalDetails: boolean;
    logWarnings: boolean;
    logAdditionalWarnings: boolean;
    logError: boolean;
    logErrorDetails: boolean;

    // ccxt calculate_fees correction
    feesRate: number;
    zeroesFeesCorrection: boolean;
    correctAllFees: boolean;
    feesRoundType: 'ceil' | 'floor' |'round';

    orderOptionsByExchange: {
        [key: string /* exchange */]: any
    };
    defaultOrderOptions: any;

    enableProxy: boolean;
    changeProxyAfterEveryOrder: boolean;
    changeProxyAfterAnyNetworkError: boolean;
    proxies: string[];

    telegram?: TelegramParams
}

export default class Bot {
    config: BotConfig;
    exchanges: {
        [key: string]: Exchange
    } = {};
    balances: {
        [key: string]: Balances
    } = {};
    cycleIndex = 0;
    proxyIndex = 0;

    telegram: Telegram;

	constructor(config: BotConfig) {
        this.config = config;
        this.telegram = new Telegram(this.config.telegram);
        this.telegram.sendMessage('Bot started');
    }
    
	printProfileTime() {
        if (!this.config.profile) { return; }
        console.log("\x1b[47m\x1b[30m%s\x1b[0m", new Date().toLocaleString().padEnd(100, ' '));
    }
    
    async init() {
        const self = this;
        return new Promise<void>(async (resolve, reject) => {
            await Promise.all (ccxt.exchanges.map ((exchange) => (async function () {
                if (self.config.exchangesToWatch.includes(exchange)) {
                    self.validateExchange(exchange);
                    self.exchanges[exchange] = new (ccxt)[exchange]({
                        ...self.config.defaultExchangeOptions,
                        ...self.config.exchangeOptions[exchange]
                    });
                    self.exchanges[exchange].apiKey = self.config.keys[exchange].apiKey;
                    self.exchanges[exchange].secret = self.config.keys[exchange].secret;
    
                    try {
                        self.balances[exchange] = await self.fetchBalance(self.exchanges[exchange]);
                    } catch (err) {
                        log(errorLogTemplate(err));
                    }
                }
            })()));
            resolve();
        })
    }

	async runAlgorithm(
		algorithm: Algorithm
	) {
        return new Promise(resolve => {
            algorithm.run().then(res => resolve(res));
        }) 
    }

    async runAlgorithmOnIteratedElement(elementsArray, algorithm, paramsFromElement) {
        const element = elementsArray[this.cycleIndex];
        console.log('\x1b[45m%s\x1b[0m', `RUNNING: ${element}`.padEnd(100, ' '));

        let runningAlgorithm;
        try {
            runningAlgorithm = algorithm(paramsFromElement(element));
        } catch (err) {
            log(errorLogTemplate(err));
        }

        let result = runningAlgorithm ? await this.runAlgorithm(runningAlgorithm) : false;
        if (!result) {
            this.cycleIndex = this.cycleIndex + 1;
        }
    }
    
	cycle: (
		toIterate: any[], 
        algorithm: (params) => Algorithm,
        paramsFromElement: (element: any) => any,
        onCycleRun: () => any
	) => void = async (toIterate, algorithm, paramsFromElement, onCycleRun = () => null) => {
        this.cycleIndex = 0;
        const cycleMaxIndex = toIterate.length;
        onCycleRun();

        do {
            await this.runAlgorithmOnIteratedElement(toIterate, algorithm, paramsFromElement);
        } while (this.cycleIndex < cycleMaxIndex)

		process.nextTick(() => {
            this.cycle(toIterate, algorithm, paramsFromElement, onCycleRun)
        });
	}
    
    validateExchange(exchange: string) {
        // @TODO: add validaiton (check if exchange has every required method)
        if (!this.config.exchangesToWatch.includes(exchange)) {
            validationException('EXCHANGE', `${exchange} IS IGNORED`);
        }
    }

    async fetchBalanceAsync(exchange: Exchange) {
        let balance: Balances;
    
        try {
            balance = await exchange.fetchBalance();
        } catch (err) {
            log(errorLogTemplate(err));
            await exports.fetchBalance(exchange);
        }
        return balance;
    }
    
    fetchBalance(exchange: Exchange) {
        return exchange.fetchBalance();
    }

    setExchangeProxy(exchange: Exchange, index: number | null = null) {
        this.proxyIndex = index === null ? this.proxyIndex + 1 : index;
        this.proxyIndex = this.proxyIndex === this.config.proxies.length ? 0 : this.proxyIndex;
        exchange.proxy = this.config.proxies[this.proxyIndex];
    }

	makeOrder(exchange: Exchange, market, side, amount, price, additionalParams = {}) {
		// @wip
		if (!this.config.makeOrders) false;
		// @TODO: send Telegram notification after order
		// @TODO: setExchangeProxy if config.changeProxyAfterEveryOrder
		if (side === BUY) {
			return exchange.createLimitBuyOrder(market, amount, price, {
				...additionalParams,
				...this.config.defaultOrderOptions,
				...this.config.orderOptionsByExchange[exchange.id]
			});
		}
		if (side === SELL) {
			return exchange.createLimitSellOrder(market, amount, price, {
				...additionalParams,
				...this.config.defaultOrderOptions,
				...this.config.orderOptionsByExchange[exchange.id]
			});
		}
		return false;
	}
}