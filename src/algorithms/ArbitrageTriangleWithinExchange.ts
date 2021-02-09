import { Balances, Exchange, Market, MinMax, OrderBook } from 'ccxt';
import Bot from '../Bot';
import { BUY, SELL, ASKS, BIDS } from '../common/constants';
import { log, validationException } from '../common/helpers';
import { Amount } from '../common/interfaces';
import { BidsOrAsks, BuyOrSell, OrderType } from '../common/types';
import Algorithm from './Algorithm';
import {AlgorithmCommonParams} from './Algorithm';

export interface ArbitrageTriangleWithinExchangeParams extends AlgorithmCommonParams {
	exchange: Exchange,
	validateMarkets: boolean
}

interface DIRECTIONS_SEQUENCE {
	orders: BuyOrSell[],
	ordersbookSide: BidsOrAsks[]
}

export default class ArbitrageTriangleWithinExchange extends Algorithm {
	static ALGORITHM_TYPE = 'ArbitrageTriangleWithinExchange';
	DIRECTIONS_SEQUENCES: DIRECTIONS_SEQUENCE[] = [
		{
			orders: [BUY, BUY, SELL],
			ordersbookSide: [ASKS, ASKS, BIDS]
		},
		{
			orders: [SELL, SELL, BUY],
			ordersbookSide: [BIDS, BIDS, ASKS]
		}
	];
	availableDirections: DIRECTIONS_SEQUENCE[] = [];
	bot: Bot;
	exchange: Exchange;
	marketsTriplet: Market[];
	availableBalances: Balances;
	showWarnings = false;
	validateMarkets = true;
	orderBooks: {
		[key: string]: {
			bids: number[][],
			asks: number[][],
		}
	} = {};
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
        try {
			this.validate(markets, balances);
        } catch (err) {
			log(`${err.name} ${err.message}`);
		}
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

	isBalanceSufficientForOrder(order: BuyOrSell, balance: number, marketLimits: { amount: MinMax, price: MinMax, cost?: MinMax },) {
		return order === BUY
			? balance >= (marketLimits.cost && marketLimits.cost.min ? marketLimits.cost.min : 0)
			: balance >= marketLimits.amount.min;
	}

	validateBalances(markets: Market[], balances: Balances) {
		// @TODO: check again after getting orders and price
		log('validateBalances');

		let isDirAvailable = {
			0: true,
			1: true
		};

		[0, 1].forEach(dirIndex => {
			this.DIRECTIONS_SEQUENCES[dirIndex].orders.forEach((order: BuyOrSell, index) => {
				const isBuy = order === BUY;
				const quoteOrBase = isBuy ? 'quote': 'base'
				const isSufficient = this.isBalanceSufficientForOrder(
					order,
					balances.free[markets[index][quoteOrBase]],
					markets[index].limits
				);
	
				if(this.showWarnings && !isSufficient) {
					log(
						`Balance ${balances.free[markets[index][quoteOrBase]]} ${markets[index].quote} under market ${markets[index].symbol} MIN ${markets[index].limits[isBuy ? 'cost' : 'amount'].min} ${isBuy ? 'cost' : 'amount'} limit`
					);
				}
	
				isDirAvailable[dirIndex] = isDirAvailable[dirIndex] && isSufficient;
			})

			if (isDirAvailable[dirIndex]) {
				this.availableDirections.push(this.DIRECTIONS_SEQUENCES[0]);
			}
		})
		
		if (this.availableDirections.length === 0) {
			ArbitrageTriangleWithinExchange.throwValidationException(
				`Balances insufficient for ${markets[0].symbol} ${markets[1].symbol} ${markets[2].symbol}`
			);
		}

		return this.availableDirections.length > 0;

		// check fees

		// M0 BUY (C0 for C1)  | +C0 -C1
		// M1 BUY (C1 for C2)  | +C1 -C2
		// M2 SELL (C0 for C2) | -C0 +C2
	}

	// @TODO: add checking balances
	static getValidatedTripletsOnExchange(exchange: Exchange, showLoadingStatus: boolean = true, showLoadingErrors: boolean = false, checkBalances = false) {
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
                    } catch (err) {
						if (showLoadingErrors) {
							log(`Loading ${exchange.id} ArbitrageTriangleWithinExchange ${err.name} ${err.message}`);
						}
					}
                }
            }
        }
        
		return validatedTriplets;
	}

	static throwValidationException(message) {
		throw validationException(this.ALGORITHM_TYPE, message);
	}

	validate(markets: Market[], balances: Balances) {
		if (this.validateMarkets) {
			ArbitrageTriangleWithinExchange.validateMarkets(markets);
		}
		
		if (!this.validateBalances(markets, balances)) {
			log('Balances insufficient');
			ArbitrageTriangleWithinExchange.throwValidationException(
				`Balances insufficient for ${markets[0].symbol} ${markets[1].symbol} ${markets[2].symbol}`
			);
		}
	}

	async getOrderBooks(){
		log('getOrderBooks');
		await Promise.all(this.marketsTriplet.map(async market => {
			log('getOrderBook ' + this.exchange.name);
			let orderbook = await this.exchange.fetchL2OrderBook(market.symbol, this.bot.config.orderBookLimit)
			this.orderBooks[market.symbol] = {[ASKS]: orderbook[ASKS], [BIDS]: orderbook[BIDS]};
			log('fetchL2OrderBook ' + market.symbol + ' ' + this.orderBooks[market.symbol]);
		}))
	}

	async onArbitrageTriangleWithinExchangeRun() {
		this.bot.printProfileTime();

		return new Promise(async resolve => {
			log(`onArbitrageTriangleWithinExchangeRun ${this.marketsTriplet.map(market => market.symbol).join(' ')}`)
			await this.getOrderBooks();
			// console.log(this.orderBooks[this.marketsTriplet[0].symbol].asks[0], this.orderBooks[this.marketsTriplet[0].symbol].bids[0])
			resolve(true);
		})
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