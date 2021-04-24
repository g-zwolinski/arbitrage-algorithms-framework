"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
process.env.NTBA_FIX_319 = '1';
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
class Telegram {
    constructor(params) {
        this.token = '';
        this.startPhrase = 'start';
        this.stopPhrase = 'stop';
        this.chats = [];
        this.logErrors = false;
        this.addChat = (id) => {
            if (!this.token)
                return;
            if (this.chats.indexOf(id) >= 0)
                return;
            this.chats.push(id);
        };
        this.removeChat = (id) => {
            if (!this.token)
                return;
            const index = this.chats.indexOf(id);
            if (index < 0)
                return;
            this.chats.splice(index, 1);
        };
        this.sendMessage = (message) => {
            if (!this.token)
                return;
            if (this.chats.length === 0)
                return;
            this.chats.forEach(chat => {
                this.telegramBot
                    .sendMessage(chat, message, { parse_mode: 'HTML' })
                    .catch(error => {
                    // @TODO: format
                    if (this.logErrors)
                        console.log(error);
                });
            });
        };
        const { token, startPhrase, stopPhrase, chats, logErrors } = Object.assign({}, params);
        this.token = token;
        this.startPhrase = startPhrase;
        this.stopPhrase = stopPhrase;
        this.chats = chats;
        this.logErrors = logErrors;
        if (!this.token) {
            // @TODO: format
            if (this.logErrors)
                console.log('Cannot start Telegram notifications without token');
            return;
        }
        this.init();
    }
    init() {
        this.telegramBot = new node_telegram_bot_api_1.default(this.token, { polling: true });
        this.telegramBot.onText(this.startPhrase, (msg) => {
            this.addChat(msg.chat.id);
            let chatId = msg.chat.id;
            this.telegramBot.sendMessage(chatId, 'Notifications started');
        });
        this.telegramBot.onText(this.stopPhrase, (msg) => {
            this.removeChat(msg.chat.id);
            let chatId = msg.chat.id;
            this.telegramBot.sendMessage(chatId, 'Notifications stopped');
        });
        this.telegramBot.on('message', (msg) => {
            let chatId = msg.chat.id;
            this.telegramBot.sendMessage(chatId, 'Enter start phrase to start. Enter stop phrase to stop notifications.');
        });
    }
}
exports.default = Telegram;
//# sourceMappingURL=Telegram.js.map