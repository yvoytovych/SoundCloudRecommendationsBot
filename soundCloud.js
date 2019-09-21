const Telegraf = require('telegraf');
const bot = new Telegraf('917613190:AAHNw25POV1u1e008GssH4vthUxaR22efSs');
const api = require('./api');
const commandArgsMiddleware = require('./commandArgs')

const MUSIC_PATTERN = /^http.*soundcloud\.com(\/[\d\w-?=&]+)+/;
const MINUTES_IN_HOUR = 60 * 60 * 1000;
const recommendations = {};
const config = {};

bot.use(commandArgsMiddleware());

bot.command('interval', (ctx) => {
    const { chat: { id } } = ctx.update.message;
    var interval;
    try {
        interval = parseInt(ctx.state.command.args[0]);
    } catch (e) {
        ctx.reply('Інтервал повинен бути в межах [1-12]');
        return;
    }
    if(interval < 1 || interval > 12) {
        ctx.reply('Інтервал повинен бути в межах [1-12]');
        return;
    }
    config[id] = { delay: interval * MINUTES_IN_HOUR };
    ctx.reply('Інтервал між рекомендаціями тепер ' + interval + ' годин');
})

bot.on('message', (ctx) => {
    const { message_id, text = '', chat } = ctx.update.message;
    if(text.match(MUSIC_PATTERN)) {
        api.resolveTrack(text).then(track => {
            api.relatedTracks(track.id, (error, response, body) => {
                if (!recommendations[chat.id]) {
                    console.log('start');
                    config[chat.id] = {delay: 6 * MINUTES_IN_HOUR}
                    showNextRecommendation(chat.id, (nextSong) => {
                        console.log('next ' + nextSong);
                        ctx.reply(nextSong)
                    });
                }
                recommendations[chat.id] = JSON.parse(body).collection.map(i => i.permalink_url);
            });
        });
    };
});

const showNextRecommendation = function(chatId, showAction, delay) {
    setTimeout(() => {
        console.log('check ' + chatId);
        const nextSong = recommendations[chatId].shift();
        nextSong && showAction(nextSong);
        showNextRecommendation(chatId, showAction);
        }, config[chatId].delay);
}

bot.startPolling();
