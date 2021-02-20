const { Schema, model } = require('mongoose');

const guild = Schema({
    guildID: String,
});

module.exports = model('guild', guild);