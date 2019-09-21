const Telegraf = require('telegraf');
const Telegram = require('telegraf/telegram');
const telegram = new Telegram('917613190:AAHNw25POV1u1e008GssH4vthUxaR22efSs');
const bot = new Telegraf('917613190:AAHNw25POV1u1e008GssH4vthUxaR22efSs');
const SoundCloud = require('soundcloud-api-client');

const client_id = 'q2iUepUBTAabXdJFYY7vjaGn6yno13KB';

const limit = 1;

const request = require('request');
const options = {
    url: 'https://api-v2.soundcloud.com/tracks/682020566/related?client_id=q2iUepUBTAabXdJFYY7vjaGn6yno13KB&limit=1&offset=0&linked_partitioning=1&app_version=1568973862&app_locale=en',
    headers: {
        'User-Agent': 'request'
    }
};

function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
        const { collection = [] } = JSON.parse(body);
        console.log(collection.map(item => item.title));
    }
}

// request(options, callback);

const nextSong = {

};

const soundcloud = new SoundCloud({ client_id });


var url = 'https://soundcloud.com/djangodjango/first-light';
soundcloud.get('/resolve', { url }).then(track => {
    console.log(track.id)
});


const MUSIC_PATTERN = /^http.*soundcloud\.com(\/[\d\w-?=&]+)+/;

// bot.on('message', (ctx) => {
//     const { message_id, text = '', chat } = ctx.update.message;
//     if(text.match(MUSIC_PATTERN)) {
//         console.log(text);
//
//         soundcloud.get('/resolve', { text }, function(track) {
//             console.log(track.id);
//         });

        // const reqeustOptions = {
        //     url: text + '/related?client_id=' + client_id + '&limit=' + limit + '&offset=0&linked_partitioning=1&app_version=1568973862&app_locale=en',
        //     headers: { 'User-Agent': 'request' }
        // };
        //
        // request(options, (error, response, body) => {
        //     console.log(JSON.parse(body));
        // });
    // };
// });

// bot.startPolling();
