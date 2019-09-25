const SoundCloud = require('soundcloud-api-client');
const request = require('request');

const client_id = 'q2iUepUBTAabXdJFYY7vjaGn6yno13KB';
const trackAPI = 'https://api-v2.soundcloud.com/tracks/';

const soundcloud = new SoundCloud({ client_id });

module.exports = {
    resolveTrack: function(url) {
        return soundcloud.get('/resolve', { url });
    },

    relatedTracks: function (trackId, limit = 3, callback) {
        const options = {
            url: trackAPI + trackId + '/related?client_id=' + client_id + '&limit=' + limit + '&offset=0&linked_partitioning=1&app_version=1568973862&app_locale=en',
            headers: { 'User-Agent': 'request' }
        };
        request(options, callback);
    },

    streamTrack: function (trackId, callback) {
        const options = {
            url: trackAPI + '/169438191/download?client_id=' + client_id,
            headers: { 'User-Agent': 'request' }
        };
        request(options, callback);
    }
};
