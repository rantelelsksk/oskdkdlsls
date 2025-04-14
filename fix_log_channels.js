/**
 * Bu script log sistemi kanal atamalarını düzeltir.
 * Tüm log tiplerine, log kanalı belirlenmemişse varsayılan log kanalını atar.
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB bağlantısı
async function connectToDatabase() {
  console.log('MongoDB veritabanına bağlanılıyor...');
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB veritabanına başarıyla bağlandı');
  } catch (error) {
    console.error('MongoDB bağlantı hatası:', error.message);
    process.exit(1);
  }
}

// Guild modelini yükle
const Guild = require('./database/models/guildModel');

async function fixLogChannels() {
  console.log('Log kanalları düzeltiliyor...');
  
  // Tüm sunucuları getir
  const guilds = await Guild.find();
  console.log(`Toplam ${guilds.length} sunucu bulundu.`);
  
  // Her sunucuyu düzelt
  for (const guild of guilds) {
    if (!guild.logSystem || !guild.logSystem.enabled) {
      console.log(`[Guild: ${guild.guildId}] Log sistemi aktif değil, atlanıyor...`);
      continue;
    }
    
    const mainLogChannel = guild.logSystem.channel;
    console.log(`[Guild: ${guild.guildId}] Ana log kanalı: ${mainLogChannel || 'Ayarlanmamış'}`);
    
    // Tüm log tiplerini kontrol et
    const logTypes = [
      'messageDelete', 'messageUpdate',
      'memberJoin', 'memberLeave', 'memberUpdate', 'voiceUpdate',
      'channelCreate', 'channelDelete', 'channelUpdate',
      'roleCreate', 'roleDelete', 'roleUpdate',
      'banAdd', 'banRemove', 'inviteCreate', 'inviteDelete',
      'emoji', 'webhookUpdate', 'voiceStateUpdate'
    ];
    
    let updateRequired = false;
    
    // Her log türü için kanal ata (Ana kanal varsa)
    for (const logType of logTypes) {
      // Log türü yapısını kontrol et, gerekirse düzelt
      if (guild.logSystem[logType] === undefined) {
        // Eğer log türü tanımlanmamış, varsayılan değerler ile oluştur
        guild.logSystem[logType] = { 
          enabled: false, 
          channel: null 
        };
        updateRequired = true;
      } else if (typeof guild.logSystem[logType] === 'boolean') {
        // Eğer log türü boolean (eski format), nesne formatına dönüştür
        console.log(`[Guild: ${guild.guildId}] ${logType} log türü için format düzeltiliyor (boolean -> nesne)...`);
        const oldValue = guild.logSystem[logType];
        guild.logSystem[logType] = { 
          enabled: oldValue, 
          channel: mainLogChannel 
        };
        updateRequired = true;
      }
      
      // Eğer log türü ayarlanmışsa ve aktifse ama kanalı yoksa ana kanalı kullan
      if (guild.logSystem[logType] && 
          guild.logSystem[logType].enabled && 
          !guild.logSystem[logType].channel && 
          mainLogChannel) {
        
        console.log(`[Guild: ${guild.guildId}] ${logType} log türü için ana kanal atanıyor...`);
        guild.logSystem[logType].channel = mainLogChannel;
        updateRequired = true;
      }
    }
    
    // Eğer değişiklik varsa kaydet
    if (updateRequired) {
      await guild.save();
      console.log(`[Guild: ${guild.guildId}] Log kanalları güncellendi.`);
    } else {
      console.log(`[Guild: ${guild.guildId}] Değişiklik gerekmedi.`);
    }
  }
  
  console.log('Log kanalları düzeltme işlemi tamamlandı!');
}

async function main() {
  try {
    await connectToDatabase();
    await fixLogChannels();
    process.exit(0);
  } catch (error) {
    console.error('Hata:', error.message);
    process.exit(1);
  }
}

main();