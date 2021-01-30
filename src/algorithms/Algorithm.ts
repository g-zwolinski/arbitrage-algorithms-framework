import { Balances, Market } from "ccxt";
import Bot from "../Bot";

export interface AlgorithmCommonParams {
	bot: Bot;
	markets: Market[];
	balances: Balances;
	showWarnings: boolean;
}

export default class Algorithm {
	onRun: (params: any) => boolean = () => false;

	run = (params?: any): boolean => {
		return this.onRun(params);
	}
}