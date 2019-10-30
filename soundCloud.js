const Telegraf = require('telegraf');
const bot = new Telegraf('917613190:AAHNw25POV1u1e008GssH4vthUxaR22efSs');
const api = require('./api');
const commandArgsMiddleware = require('./commandArgs');

const MUSIC_PATTERN = /^http.*soundcloud\.com(\/[\d\w-?=&]+)+/;
const config = {};

console.logCopy = console.log.bind(console);

console.log = function(...data)
{
    var options = { dateStyle: 'short', timeStyle: 'short'};
    var currentDate = '[' + new Date().toLocaleString({ timeZone: "Europe/Kiev" }, options) + '] ';
    this.logCopy(currentDate, ...data);
};

bot.use(commandArgsMiddleware());

bot.command('limit', ctx => {
    const { chat: { id } } = ctx.update.message;
    var limit = parseInt(ctx.state.command.args[0]);
    if (isNaN(limit)) {
        return ctx.reply('Do it nice [1-100]');
    }
    if(limit < 1 || limit > 100) {
        return ctx.reply('Do it nice [1-100]');
    }
    config[id] = { ...config[id], limit };
    ctx.reply('Ok!');
});

bot.command('stop', ctx => {
    const { chat: { id } } = ctx.update.message;
    config[id] = { ...config[id], run: false };
    console.log('stop', config[id].name);
});

bot.command('start', ctx => {
    const { chat } = ctx.update.message;
    if (config[chat.id] && config[chat.id].run) {
        return ctx.reply('Can not be x2 faster');
    }
    config[chat.id] = {
        recommendations: config[chat.id] && config[chat.id].recommendations || [],
        run: true,
        next: config[chat.id] && config[chat.id].next,
        ctx: ctx,
        name: chat.title || chat.first_name + ' ' + chat.last_name,
        limit: 2
    };
    console.log('start', config[chat.id].name);
    showNextRecommendation(chat.id);
});

bot.command('help', ctx => {
    ctx.reply('I will post N(/limit) related songs to one which you send me,' +
        '\none after duration of another,' +
        '\nalso you can listen to them just right here.');
});

const getTrackInfo = track => {
    return {
        title: track.title,
        performer: track.user.username,
        thumb: track.artwork_url,
        caption: track.genre && track.genre.split(' ').map(tag => '#'.concat(tag.replace('-', ''))).join(' ')
    };
};

bot.on('message', ctx => {
    const { text = '', chat } = ctx.update.message;
    if(!config[chat.id])
        return;
    if(text.match(MUSIC_PATTERN)) {
        try {
            api.resolveTrack(text).then(track => {
                api.downloadTrack(track.stream_url).then(res => {
                    ctx.replyWithAudio({ source: Buffer.from(res, 'utf8') }, getTrackInfo(track));
                });
                const { name, limit } = config[chat.id];
                api.relatedTracks(track.id, limit).then((res) => {
                    config[chat.id].recommendations = JSON.parse(res).collection.map(i => {
                        return { link: i.permalink_url, duration: i.duration };
                    });
                    if (config[chat.id].recommendations.length) {
                        config[chat.id].next = new Date().getTime() + 5000;
                    }
                    console.log('recommendations', name , config[chat.id].recommendations.length);
                    showNextRecommendation(chat.id);
                });
            });
        } catch (e) {
            console.log(config[chat.id].name, e);
            ctx.reply('Oops, something went wrong, try again. /start');
            config[chat.id] = {};
        }
    }
});

const showNextRecommendation = (chatId, delay = 5000) => {
    setTimeout(() => {
        const { next, recommendations, run, ctx, name } = config[chatId];
        if(!run) return;
        const now = new Date().getTime();
        if(next) {
            if ((next - now) < 0) {
                const recommendation = recommendations.shift();
                if (recommendation) {
                    console.log('recommendations', name, recommendations.length);
                    ctx.reply(recommendation.link);
                    api.resolveTrack(recommendation.link).then(track => {
                        api.downloadTrack(track.stream_url).then(res => {
                            ctx.replyWithAudio({ source: Buffer.from(res, 'utf8') }, getTrackInfo(track));
                        });
                    });
                    if (recommendations.length) {
                        config[chatId].next = now + 5000;
                        showNextRecommendation(chatId)
                    } else {
                        return;
                    }
                }

            }
            showNextRecommendation(chatId);
        }
    },
    delay);
};

bot.launch();