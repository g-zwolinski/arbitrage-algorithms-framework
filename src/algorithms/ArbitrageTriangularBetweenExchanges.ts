import Algorithm from './Algorithm';

export default class ArbitrageTriangularBetweenExchanges extends Algorithm {
	// BUY C0 FOR C1 -> SELL C0 FOR C2 -> transfer C2 -> BUY C0 FOR C2 -> transfer C0
	// SELL C0 FOR C1 -> BUY C2 FOR C1 -> transfer C2 -> BUY C0 FOR C2 -> transfer C0

	// check currency on exchanges pair (if transfer costs are less than difference)
}