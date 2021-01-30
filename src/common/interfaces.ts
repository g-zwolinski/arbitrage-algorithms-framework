import { BidsOrAsks } from "./types";

export interface Amount {
	symbol: string;
	amount: number;
}

export interface Order {
	price: number;
	amount: number;
	type: BidsOrAsks;
}

// interface TriangleCone {
// 	market: Market;
// 	directions: BidsOrAsks[];
// }

// export interface Market {
// 	quote: string;
// 	base: string;
// 	orders: Order[];
// 	// feesCurrencies
// 	// 0.002 = 0.2%
//     taker: number; // should be considered
//     maker: number; // should be ignored (algoritms use existing orders)
//     percentage: boolean;
// 	limits: {
// 		cost: {
// 			min: number;
// 			max: number;
// 		}
// 		amount: {
// 			min: number;
// 			max: number;
// 		}
// 	}
// 	precision: {
// 		cost: number;
// 		amount: number;
// 	}
// }

export interface ValidationException {
	message: string;
	name: string;
}