// Shard dosyası - Çoklu sunucu sistemleri için
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const fs = require('fs');
const config = require('./config');
const logger = require('./util/logger');
const db = require('./database/connect');

// Bot örneği oluşturma
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages
    ],
    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.User,
        Partials.GuildMember
    ],
    allowedMentions: { parse: ['users', 'roles'], repliedUser: true },
    shards: process.env.SHARD_ID ? parseInt(process.env.SHARD_ID) : 'auto'
});

// Shard ID'sini logla
if (process.env.SHARD_ID !== undefined) {
    logger.info(`Shard #${process.env.SHARD_ID} başlatıldı`);
}

// Bot koleksiyonlarını oluşturma
client.commands = new Collection();
client.buttons = new Collection();
client.aliases = new Collection();
client.config = config;
client.logger = logger;
client.maintenance = false;

// Veritabanı bağlantısı
db.connect();

// Handlers
require('./handlers/commandHandler')(client);
require('./handlers/eventHandler')(client);
require('./handlers/buttonHandler')(client);

// Avatar değiştirme sistemini başlat
require('./util/avatarRotation')(client);

// Botu başlat
client.login(process.env.TOKEN || config.token).catch(err => {
    logger.error(`Bot giriş hatası: ${err}`);
});

// Hata yakalama
process.on('uncaughtException', (err) => {
    logger.error(`Beklenmeyen hata: ${err.stack}`);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('İşlenmeyen Reddetme:', promise, 'Sebep:', reason);
});
