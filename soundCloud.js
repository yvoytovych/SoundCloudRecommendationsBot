const Telegraf = require('telegraf');
const bot = new Telegraf('917613190:AAHNw25POV1u1e008GssH4vthUxaR22efSs');
const api = require('./api');
const utils = require('./utils');
const commandArgsMiddleware = require('./commandArgs');

const MUSIC_PATTERN = /^http.*soundcloud\.com(\/[\d\w-?=&]+)+/;
const config = {};

console.logCopy = console.log.bind(console);

console.log = function(data)
{
    var options = { dateStyle: 'short', timeStyle: 'short'};
    var currentDate = '[' + new Date().toLocaleString({ timeZone: "Europe/Kiev" }, options) + '] ';
    this.logCopy(currentDate, data);
};

bot.use(commandArgsMiddleware());

bot.command('limit', (ctx) => {
    const { chat: { id } } = ctx.update.message;
    var limit = parseInt(ctx.state.command.args[0]);
    if (isNaN(limit)) {
        return ctx.reply('давай нормально [1-100]');
    }
    if(limit < 1 || limit > 100) {
        return ctx.reply('давай нормально [1-100]');
    }
    config[id] = { ...config[id], limit };
    ctx.reply('Тепер рекомендацій: ' + limit);
});

bot.command('stop', (ctx) => {
    const { chat: { id } } = ctx.update.message;
    config[id] = { ...config[id], run: false };
    console.log('stop ' + config[id].name);
    return ctx.reply('ок');
});

bot.command('start', (ctx) => {
    const { chat } = ctx.update.message;
    if (config[chat.id] && config[chat.id].run) {
        return ctx.reply('x2 швидше не буде');
    }
    config[chat.id] = {
        recommendations: config[chat.id] && config[chat.id].recommendations || [],
        run: true,
        next: config[chat.id] && config[chat.id].next || {},
        ctx: ctx,
        name: chat.title || chat.first_name + ' ' + chat.last_name
    };
    console.log('start ' + config[chat.id].name);
    ctx.reply('палітєлі');
    showNextRecommendation(chat.id);
});

bot.on('message', (ctx) => {
    const { text = '', chat } = ctx.update.message;
    if(!config[chat.id])
        return;
    if(text.match(MUSIC_PATTERN)) {
        api.resolveTrack(text).then(track => {
            api.relatedTracks(track.id, config[chat.id].limit, (error, response, body) => {
                const now = new Date(new Date().toLocaleString({ timeZone: "Europe/Kiev" }));
                config[chat.id].recommendations = JSON.parse(body).collection.map(i => {
                    return { link: i.permalink_url, duration: i.duration };
                });
                config[chat.id].next = { time: new Date(now.getTime() + track.duration )};
                if (config[chat.id].run) {
                    ctx.reply('ок поки слухаєм цю ~' + utils.msToTime(track.duration));
                }
                console.log('recommendations ' + config[chat.id].name + ' = ' + config[chat.id].recommendations.length);
            });
        });
    }
});

const showNextRecommendation = function(chatId, delay = 5000) {
    setTimeout(() => {
        const { next = {}, recommendations, run, ctx, name } = config[chatId];
        if(!run) return;
        const now = new Date(new Date().toLocaleString({ timeZone: "Europe/Kiev" }));
        if (now.getHours() < 9 || 19 < now.getHours()) {
            console.log('sleep ' + name);
            return showNextRecommendation(chatId);
        }
        console.log('check ' + name + ' ' + (next.time ? utils.msToTime(next.time - now) : ''));
        if (next.time && (next.time - now) < 0) {
            const recommendation = recommendations.shift();
            if (recommendation) {
                console.log('next ' + recommendation.link);
                ctx.reply(recommendation.link).then(() => {
                    if (recommendations.length) {
                        next.time = new Date(now.getTime() + recommendation.duration);
                        ctx.reply('наступна після цієї через ~' + (utils.msToTime(recommendation.duration)));
                    } else {
                        next.time = false;
                        ctx.reply('більше немає)');
                    }
                });
            }
        }
        showNextRecommendation(chatId)
        },
        delay);
};

bot.launch();