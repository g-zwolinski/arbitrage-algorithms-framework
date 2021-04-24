import Bot from "../Bot";
import { BaseError, Exchange } from 'ccxt';
export default class BotErrorHandler {
    static handleError: (bot: Bot, err: BaseError, exchange: Exchange, market?: string) => void;
}
