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
export interface ValidationException {
    message: string;
    name: string;
}
