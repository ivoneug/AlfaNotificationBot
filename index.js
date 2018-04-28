const token = require('./token').token;

const fs = require('fs');
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});

let settings = {};
let data = null;

const loadSettings = () => {
    if (!fs.existsSync('settings.json')) return;
    
    const data = fs.readFileSync('settings.json', { encoding: 'utf8' });
    settings = JSON.parse(data);
};
const saveSettings = () => {
    const data = JSON.stringify(settings);
    
    fs.writeFileSync('settings.json', data);
};
const addSubscriber = (chatId) => {
    if (settings.subscribers.indexOf(chatId) !== -1) return false;
    
    settings.subscribers.push(chatId);
    saveSettings();
    
    return true;
};
const removeSubscriber = (chatId) => {
    const idx = settings.subscribers.indexOf(chatId);
    if (idx === -1) return false;
    
    settings.subscribers.splice(idx, 1);
    saveSettings();
    
    return true;
};

const currencyType = {
    USD: 'usd',
    EUR: 'eur'
};

const currencySign = {
    [currencyType.USD]: '\u{1F4B2}',
    [currencyType.EUR]: '\u{1F4B6}'
};

const sendCurrencyInfo = (chatId, type) => {
    if (!data || !data[type]) return;
    
    const currency = data[type];
    
    const sell = currency.find(item => item.type === 'sell');
    const date = new Date(sell.date);
    const format = (number) => {
        return number.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false});
    };
    
    const dateString = `${format(date.getHours())}:${format(date.getMinutes())} ${format(date.getDate())}.${format(date.getMonth() + 1)}.${date.getFullYear()}`;
    const order = sell.order === '+' ? '\u{2B06}' : '\u{2B07}';
    
    const response = `${currencySign[type]}${order} <b>${sell.value}</b> RUB в <i>${dateString}</i>`;
    
    bot.sendMessage(chatId, response, { parse_mode: 'html' });
};

const checkCurrencyChange = (newData) => {
    const change = {
        [currencyType.USD]: false,
        [currencyType.EUR]: false
    };
    
    if (data) {
        Object.keys(change).forEach((key) => {
            const sell = data[key].find(item => item.type === 'sell');
            const newSell = newData[key].find(item => item.type === 'sell');
            
            change[key] = sell.value != newSell.value;
        });
    }
    
    data = newData;
    
    Object.keys(change).forEach((key) => {
        if (!change[key]) return;
        
        settings.subscribers.forEach(chatId => sendCurrencyInfo(chatId, key));
    });
};

const logic = () => {
    axios.get('https://alfabank.ru/ext-json/0.2/exchange/cash?offset=0&limit=1&mode=rest')
        .then((response) => {
            checkCurrencyChange(response.data);
        });
};

const botLogic = () => {
    bot.onText(/\/usd/, (msg, match) => {
        const chatId = msg.chat.id;
        
        sendCurrencyInfo(chatId, currencyType.USD);
    });
    
    bot.onText(/\/eur/, (msg, match) => {
        const chatId = msg.chat.id;
        
        sendCurrencyInfo(chatId, currencyType.EUR);
    });

    bot.onText(/\/subscribe/, (msg, match) => {
        const chatId = msg.chat.id;
        
        if (addSubscriber(chatId)) {
            bot.sendMessage(chatId, 'Вы успешно подписаны');
        } else {
            bot.sendMessage(chatId, 'Вы уже были подписаны ранее');
        }
    });
    
    bot.onText(/\/unsubscribe/, (msg, match) => {
        const chatId = msg.chat.id;
        
        removeSubscriber(chatId);
        bot.sendMessage(chatId, 'Вы успешно отписаны');
    });
};

loadSettings();
if (!settings) {
    console.log('ERROR READING SETTINGS FILE');
    return;
}

botLogic();

logic();
mainInterval = setInterval(logic, 10 * 60 * 1000);
