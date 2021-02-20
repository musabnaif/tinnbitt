const express = require("express");
const app = express();

app.listen(() => console.log("Server started"));

app.use('/ping', (req, res) => {
  res.send(new Date());
});






const Discord = require('discord.js');
const client = new Discord.Client({ partials: ['MESSAGE', 'REACTION', 'CHANNEL'] });
const prefix = '-';// برفكس
const guildModel = require('./models/guild');
const ticketModel = require('./models/ticket');
const fetch = require('discord-fetch-all');
const ticket = require('./models/ticket');
const createTicket = require('./cmds/createTicket')
const mongoose = require('mongoose');
const fs = require('fs');
const urlMongo = `mongodb+srv://Turki:dDeDNnF99WyNkkeo@cluster0.mqux4.mongodb.net/Turki?retryWrites=true&w=majority`;//Mongodb
client.on('ready', () => {
console.log(`Online`);
});

mongoose.connect(urlMongo, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: true,
}).then(console.log(`MongoDB is Ready`));

client.on('message', async message => {
    if(message.content.startsWith(prefix + 'tr-set')) {
        let tr_message = message.content.split(' ');
        message.delete();
        const msg = await message.channel.send({ embed: {
            title: tr_message[1],
            color: "GREEN",
            description: "React with 📧 to create a ticket."
        }}
    );
    msg.react('📧');
    }
});

client.on('messageReactionAdd', async(reaction, user) => {
    const { message } = reaction;
    if(user.partial) await user.fetch();
    if(reaction.partial) await reaction.fetch();
    if(reaction.message.partial) await reaction.message.fetch();   
    if(user.bot) return;
     var GuildSettings = await guildModel.findOne({
        guildID: message.guild.id
    });

    if (!GuildSettings) {
        GuildSettings = new guildModel({
            guildID: message.guild.id,
        });

        await GuildSettings.save();
    }

    const TicketSettings = await ticketModel.findOne({
        guildID: message.guild.id,
        userID: user.id
    });

    if (reaction.emoji.name == '📧') {
        if (TicketSettings) {
            const channel = message.guild
                .channels.cache.get(TicketSettings.ticketID);
            if (!channel) {
                await TicketSettings.deleteOne();
                createTicket(message, user, GuildSettings);
            }
        }else {
            createTicket(message, user, GuildSettings);
        }
        reaction.users.remove(user)
        

    } else if (message.id == (TicketSettings ? TicketSettings.msgID : null)) {
        if (reaction.emoji.name == '🔒') {
            if (!TicketSettings.ticketStatus) {
                message.channel.send({ embed: {
                        color: "YELLOW",
                        description: `Ticket closed by ${user}`
                    }
                });
                reaction.users.remove(user)

               

                const msg = await message.channel.send({ embed: {
                        color: "RED",
                        description: "📰 Ticket Transcript \n🔓 Reopen Ticket \n⛔ Close Ticket"
                    }}
                );

                await msg.react('📰');
                await msg.react('🔓');
                await msg.react('⛔');

                TicketSettings.msgPannelID = msg.id;
                TicketSettings.ticketStatus = true;

                await TicketSettings.save();
            }
        }
    } else if (message.id == (TicketSettings ? TicketSettings.msgPannelID : null)) {
        if (reaction.emoji.name == '📰') {
            const msgsArray = await fetch.messages(message.channel, {
                reverseArray: true
            });
            reaction.users.remove(user)
            const content = msgsArray.map(m => `${m.author.tag} - ${m.embeds.length ? m.embeds[0].description : m.content}`);

            fs.writeFileSync('transcript.txt', content.join('\n'));

            message.channel.send(new Discord.MessageAttachment('transcript.txt', 'transcript.txt'));
        } else if (reaction.emoji.name == '🔓') {
            message.channel.updateOverwrite(
                client.users.cache.get(TicketSettings.userID), {
                    SEND_MESSAGES: true,
                    VIEW_CHANNEL: true
                }
            );
            const msg = await message.channel
                .messages.fetch(TicketSettings.msgPannelID);

            msg.delete();

            TicketSettings.msgPannelID = null;
            TicketSettings.ticketStatus = false;

            await TicketSettings.save();

            message.channel.send({ embed: {
                    color: "GREEN",
                    description: `Ticket opened by ${user}`
                }
            });
        } else if (reaction.emoji.name == '⛔') {
            message.channel.delete();
            await TicketSettings.deleteOne();
        }
    
}
})

client.login("NzQ3OTQ5NTc1OTM0OTY3ODA4.X0WUUw.FQj1ITfyYNj_3YECuz1QNPaLlh4");