module.exports = {
    token: process.env.TOKEN || '', // Bot tokeni
    prefix: '.', // Botun varsayılan prefixi
    owners: ['386597268117258250'], // Bot sahibinin Discord ID'si
    mongoURI: process.env.MONGO_URI || 'mongodb://localhost:27017/discordbot', // MongoDB bağlantı URI'si
    shardingEnabled: false, // Shard sistemi devre dışı (botun testte iki kez mesaj gönderme sorununu önlemek için)
    ownerDiscordUsername: 'RANTE', // Bot sahibi Discord kullanıcı adı
    statusType: 'WATCHING', // Botun durum türü: PLAYING, WATCHING, LISTENING, COMPETING, STREAMING
    statusUpdateInterval: 300000, // Durum güncelleme süresi (milisaniye) - 5 dakika (Discord API rate limit için)
    avatarRotationInterval: 14400000, // Avatar değişim süresi (milisaniye) - 4 saat (Discord limiti günde 5 değişiklikten fazla izin vermiyor)
    avatarImages: [
        'https://i.imgur.com/ychL2Up.png', // Melek tema Discord bot avatarı
        'https://i.imgur.com/3FAHF4Y.png', // Zombi tema Discord bot avatarı
        'https://i.imgur.com/rxyjTLD.png', // Cyberpunk tema Discord bot avatarı
        'https://i.imgur.com/iCIJS1m.png', // Mor tema Discord bot avatarı
        'https://i.imgur.com/X3zRSYj.png'  // Turuncu tema Discord bot avatarı
    ],
    embedColor: '#ff5555', // Embed mesajları için varsayılan renk
    footerText: 'FEIX Global Bot', // Embed mesajları için varsayılan footer metni
    version: '1.0.0' // Bot versiyonu
};
