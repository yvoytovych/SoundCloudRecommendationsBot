module.exports = {
    msToTime: function(duration) {
        var minutes = Math.round((duration / (1000 * 60)) % 60),
            hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

        hours = hours ? (hours + ' год і ') : '';
        minutes = minutes + ' хв';

        return hours + minutes;
    },

    getTomorrow9Am: function () {
        const tomorrow9AM = new Date(now.getTime());
        tomorrow9AM.setDate(now.getDate() + 1);
        tomorrow9AM.setHours(9);
        tomorrow9AM.setMinutes(0);
        tomorrow9AM.setSeconds(0);
        return tomorrow9AM;
    }
};