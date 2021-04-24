process.env.NTBA_FIX_319 = '1';
import TelegramBot from 'node-telegram-bot-api';

export interface TelegramParams {
    token: string;
    startPhrase: string;
    stopPhrase: string;
    chats: string[];
    logErrors: boolean;
}

export default class Telegram {
    token = '';
    startPhrase = 'start';
    stopPhrase = 'stop';
    chats = [];
    telegramBot: any;
    logErrors = false;

    constructor(params: TelegramParams) {
		const {token, startPhrase, stopPhrase, chats, logErrors} = {...params};

        this.token = token;
        this.startPhrase = startPhrase;
        this.stopPhrase = stopPhrase;
        this.chats = chats;
        this.logErrors = logErrors;

        if(!this.token) {
            // @TODO: format
            if(this.logErrors) console.log('Cannot start Telegram notifications without token');
            return;
        }

        this.init();
    }

    init() {
        this.telegramBot = new TelegramBot(this.token, {polling: true});
        
        this.telegramBot.onText(this.startPhrase, (msg) => {
            this.addChat(msg.chat.id)
            let chatId = msg.chat.id
            this.telegramBot.sendMessage(chatId, 'Notifications started')
        })
        
        this.telegramBot.onText(this.stopPhrase, (msg) => {
            this.removeChat(msg.chat.id)
            let chatId = msg.chat.id
            this.telegramBot.sendMessage(chatId, 'Notifications stopped')
        })
        
        this.telegramBot.on('message', (msg) => {
            let chatId = msg.chat.id
            this.telegramBot.sendMessage(chatId, 'Enter start phrase to start. Enter stop phrase to stop notifications.')
        });
    }

    addChat = (id) => {
        if (!this.token) return;
        if (this.chats.indexOf(id) >= 0) return;
        this.chats.push(id);
    } 

    removeChat = (id) => {
        if (!this.token) return;
        const index = this.chats.indexOf(id)
        if (index < 0) return;
        this.chats.splice(index, 1);
    }

    sendMessage = (message) => {
        if (!this.token) return;
        if (this.chats.length === 0) return;
        this.chats.forEach(chat => {
            this.telegramBot
            .sendMessage(chat, message, {parse_mode: 'HTML'})
            .catch(error => {
                // @TODO: format
                if(this.logErrors) console.log(error)
            })
        })
    }
}