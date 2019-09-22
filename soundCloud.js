const Telegraf = require('telegraf');
const bot = new Telegraf('917613190:AAHNw25POV1u1e008GssH4vthUxaR22efSs');
const api = require('./api');
const commandArgsMiddleware = require('./commandArgs')

const MUSIC_PATTERN = /^http.*soundcloud\.com(\/[\d\w-?=&]+)+/;
const MINUTES_IN_HOUR = 60 * 60 * 1000;
const recommendations = {};
const config = {};

bot.use(commandArgsMiddleware());

bot.command('time', (ctx) => {
    const { chat: { id } } = ctx.update.message;
    var interval;
    try {
        interval = parseInt(ctx.state.command.args[0]);
    } catch (e) {
        ctx.reply('Should be in [1-12]');
        return;
    }
    if(interval < 1 || interval > 12) {
        ctx.reply('Should be in [1-12]');
        return;
    }
    config[id] = { ...config[id], delay: interval * MINUTES_IN_HOUR };
    ctx.reply('Time between recommendations set for ' + interval + (interval === 1 ? 'hour' : ' hours'));
})

bot.command('stop', (ctx) => {
    const { chat: { id } } = ctx.update.message;
    config[id] = { ...config[id], stop: true };
    console.log('stop ' + id);
    ctx.reply('stopped');
})

bot.command('start', (ctx) => {
    const { chat: { id } } = ctx.update.message;
    console.log('start ' + id);
    ctx.reply('ok');
    config[id] = { ...config[id], delay: 6 * MINUTES_IN_HOUR, stop: false };
    recommendations[id] = [];
    showNextRecommendation(id, (nextSong) => {
        console.log('next ' + nextSong);
        ctx.reply(nextSong);
    });
})

bot.on('message', (ctx) => {
    const { message_id, text = '', chat } = ctx.update.message;
    if(text.match(MUSIC_PATTERN)) {
        api.resolveTrack(text).then(track => {
            api.relatedTracks(track.id, (error, response, body) => {
                recommendations[chat.id] = JSON.parse(body).collection.map(i => i.permalink_url);
            });
        });
    };
});

const showNextRecommendation = function(chatId, showAction) {
    const { delay, stop } = config[chatId];
    setTimeout(() => {
        if(stop) return;
        const now = new Date(new Date().toLocaleString({ timeZone: "Europe/Kiev" }));
        console.log('check ' + chatId);
        if (9 < now.getHours() && now.getHours() < 17) {
            const nextSong = recommendations[chatId].shift();
            nextSong && showAction(nextSong);
        } else {
            console.log('sleep at night');
        }
        showNextRecommendation(chatId, showAction);
        },
    delay);
}

bot.startPolling();