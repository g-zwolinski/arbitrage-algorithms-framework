export interface TelegramParams {
    token: string;
    startPhrase: string;
    stopPhrase: string;
    chats: string[];
    logErrors: boolean;
}
export default class Telegram {
    token: string;
    startPhrase: string;
    stopPhrase: string;
    chats: any[];
    telegramBot: any;
    logErrors: boolean;
    constructor(params: TelegramParams);
    init(): void;
    addChat: (id: any) => void;
    removeChat: (id: any) => void;
    sendMessage: (message: any) => void;
}
