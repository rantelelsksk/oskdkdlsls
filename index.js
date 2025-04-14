// Türkçe Discord Botu Ana Dosyası
// Discord.js ve gerekli modüllerin yüklenmesi
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const { ShardingManager } = require('discord.js');
const fs = require('fs');
const config = require('./config');
const logger = require('./util/logger');
const db = require('./database/connect');

// Eğer bot shard modunda başlatılıyorsa
if (config.shardingEnabled) {
    logger.info('Shard sistemi aktifleştiriliyor...');
    const manager = new ShardingManager('./shard.js', {
        token: process.env.TOKEN || config.token,
        totalShards: 'auto',
        respawn: true,
        shardArgs: ['--shard'],
        mode: 'process'
    });

    manager.on('shardCreate', shard => {
        logger.info(`Shard #${shard.id} başlatıldı (Toplam: ${manager.totalShards})`);
        
        // Shard'a özel bilgileri ekle
        shard.on('ready', () => {
            logger.info(`Shard #${shard.id} hazır`);
        });
        
        shard.on('disconnect', () => {
            logger.warn(`Shard #${shard.id} bağlantısı kesildi`);
        });
        
        shard.on('reconnecting', () => {
            logger.info(`Shard #${shard.id} yeniden bağlanıyor`);
        });
        
        shard.on('death', (process) => {
            logger.error(`Shard #${shard.id} beklenmedik şekilde sonlandı, çıkış kodu: ${process.exitCode}`);
        });
        
        shard.on('error', (error) => {
            logger.error(`Shard #${shard.id} hata: ${error.message}`);
        });
    });

    // Tüm shard'ları başlat
    manager.spawn()
        .then(shards => {
            logger.info(`Toplam ${shards.size} shard başlatıldı`);
        })
        .catch(err => {
            logger.error(`Shard oluşturma hatası: ${err}`);
        });
} else {
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
        allowedMentions: { parse: ['users', 'roles'], repliedUser: true }
    });

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
}
