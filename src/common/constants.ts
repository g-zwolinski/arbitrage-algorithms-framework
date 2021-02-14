import { BidsOrAsks } from "./types";

export const BUY = 'buy';
export const SELL = 'sell';
export const ASKS = 'asks';
export const BIDS = 'bids';

export const buyOrSellByBidsOrAsks = {
	[ASKS]: BUY,
	[BIDS]: SELL
}

export const bidsOrAsksByBuyOrSell = {
	[BUY]: ASKS,
	[SELL]: BIDS
}