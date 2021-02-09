import { Balances, Market } from "ccxt";
import Bot from "../Bot";

export interface AlgorithmCommonParams {
	bot: Bot;
	markets: Market[];
	balances: Balances;
	showWarnings: boolean;
}

export default class Algorithm {
	onRun: (params: any) => Promise<any> = () => new Promise(() => false);

	run = async (params?: any): Promise<boolean> => {
		return await this.onRun(params);
	}
}