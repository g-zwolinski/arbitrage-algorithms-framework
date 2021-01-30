import Algorithm from './Algorithm';

export default class ArbitrageBetweenExchanges extends Algorithm {
	// BUY C0 FOR C1 -> transfer C0 -> SELL C0 FOR C1 -> transfer C1
	// SELL C0 FOR C1 -> transfer C1 -> BUY C0 FOR C1 -> transfer C0

	// check markets on exchanges pair (if transfer costs are less than difference)
}