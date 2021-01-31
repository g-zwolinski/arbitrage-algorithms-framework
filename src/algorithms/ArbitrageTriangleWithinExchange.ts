import { Balances, Exchange, Market } from 'ccxt';
import Bot from '../Bot';
import { BUY, SELL, ASKS, BIDS } from '../common/constants';
import { log, validationException } from '../common/helpers';
import { Amount } from '../common/interfaces';
import { OrderType } from '../common/types';
import Algorithm from './Algorithm';
import {AlgorithmCommonParams} from './Algorithm';

export interface ArbitrageTriangleWithinExchangeParams extends AlgorithmCommonParams {
	exchange: Exchange,
	validateMarkets: boolean
}

export default class ArbitrageTriangleWithinExchange extends Algorithm {
	static ALGORITHM_TYPE = 'ArbitrageTriangleWithinExchange';
	DIRECTIONS_SEQUENCES = [
		{
			orders: [BUY, BUY, SELL],
			ordersbookSide: [ASKS, ASKS, BIDS]
		},
		{
			orders: [SELL, SELL, BUY],
			ordersbookSide: [BIDS, BIDS, ASKS]
		}
	];
	availableDirections: [];
	bot: Bot;
	exchange: Exchange;
	marketsTriplet: Market[];
	availableBalances: Balances;
	showWarnings = false;
	validateMarkets = true;
	// every minimum amount in every symbol
	minimum: {amount: Amount[], cost: Amount[], market: string}[];

	constructor(params: ArbitrageTriangleWithinExchangeParams) {
		super();

		const {bot, markets, balances, showWarnings, validateMarkets, exchange} = {...params};
		this.bot = bot;
		this.exchange = exchange;
		this.bot.printProfileTime();
		this.showWarnings = showWarnings;
		this.validateMarkets = validateMarkets;
		this.validate(markets, balances);
		this.bot.printProfileTime();
		this.marketsTriplet = markets;
		this.availableBalances = balances;

		this.onRun = this.onArbitrageTriangleWithinExchangeRun;
	}

	static validateMarkets(markets: Market[]) {
		if (markets.length !== 3) {
			this.throwValidationException('InvalidMarketsLength (should be equal to 3)');
		}

		if (markets[0].quote !== markets[1].base) {
			this.throwValidationException('InvalidMarkets (first market quote should be secound market base)');
		}

		if (markets[1].quote !== markets[2].quote) {
			this.throwValidationException('InvalidMarkets (second market quote should be third market base)');
		}

		if (markets[2].base !== markets[0].base) {
			this.throwValidationException('InvalidMarkets (third market base should be first market base)');
		}

		return true;
	}

	static getValidatedTripletsOnExchange(exchange: Exchange, showLoadingStatus: boolean = true) {
        const validatedTriplets: string[][] = [];
        let marketsNumber = Object.entries(exchange.markets).length;
        let i = 0;

        for (let marketA in exchange.markets) {
			if (showLoadingStatus) {
				log(`Loading ${exchange.id} ArbitrageTriangleWithinExchange ${((i / marketsNumber) * 100).toFixed()}%`);
			}
            i++;
            for (let marketB in exchange.markets) {
                for (let marketC in exchange.markets) {
					if(marketA === marketB || marketA === marketC || marketB === marketC) { continue; }
					
					const exchangeMarketA = exchange.markets[marketA];
					const exchangeMarketB = exchange.markets[marketB];
					const exchangeMarketC = exchange.markets[marketC];

					if(!exchangeMarketA.active || !exchangeMarketB.active || !exchangeMarketC.active) { continue; }
					
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
        
		return validatedTriplets;
	}

	static throwValidationException(message) {
		throw validationException(this.ALGORITHM_TYPE, message);
	}

	validateBalacnes(markets: Market[], balances: Balances) {
		// check fees

		// M0 BUY (C0 for C1)  | +C0 -C1
		// M1 BUY (C1 for C2)  | +C1 -C2
		// M2 SELL (C0 for C2) | -C0 +C2
	}

	validate(markets: Market[], balances: Balances) {
		if (this.validateMarkets) {
			ArbitrageTriangleWithinExchange.validateMarkets(markets);
		}
		this.validateBalacnes(markets, balances);
	}

	onArbitrageTriangleWithinExchangeRun: () => boolean = () => {
		// this.bot.printProfileTime();
		// @TODO: onRun
		// console.log(this.exchange.id, 'todo');
		// for test purpose
		return false;
	};

	fees(market: Market, amount: number, orderType: OrderType) {
		// @TODO: check if percentage during fees calculation
		// @TODO: validate if market can handle orderTpe
		return 0;
	}

	convert(amount, symbol, sourceMarket, targetMarket, orderType: OrderType) {
		// check in both way (maybe in other direction it will be cheaper)
	}

	// check if balances ar bigger than mins

	// dry run check (with min amounts)
	// dry run check (with max amounts - balances or in ordersbook amount)
	// if there is profit in at least one coin, try optimize (bisection 'oscilate') results

		// operates[3] = [...mins]
		// increments[3] = mins.map(min => min / 2)

		// optimize amounts

			// do while overall proift is bigger
				// for markets
					// make order amount bigger
						// operate = operate + increment
					// check if new overall proift is bigger
						// if yes - true (till max)
						// if no
							// increment = increment/2 (till operate < min or increment < 10 ^ MARKET_PRECISION)
}