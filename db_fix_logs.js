/**
 * Veritabanında log objelerinin formatını düzelten script
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Guild = require('./database/models/guildModel');
const logger = require('./util/logger');

async function connectToMongoDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB veritabanına bağlandı');
    return true;
  } catch (error) {
    console.error('MongoDB bağlantı hatası:', error.message);
    return false;
  }
}

async function fixLogTypes() {
  console.log('Log türlerini düzeltme başlıyor...');
  
  const allGuilds = await Guild.find();
  console.log(`Toplam ${allGuilds.length} sunucu bulundu.`);
  
  let fixedCount = 0;
  
  for (const guild of allGuilds) {
    const guildId = guild.guildId;
    console.log(`\n[Guild: ${guildId}] Log sistemi kontrol ediliyor...`);
    
    if (!guild.logSystem) {
      console.log(`[Guild: ${guildId}] Log sistemi yok, oluşturuluyor...`);
      guild.logSystem = {
        enabled: false,
        channel: null
      };
      await guild.save();
      console.log(`[Guild: ${guildId}] Log sistemi oluşturuldu.`);
      fixedCount++;
      continue;
    }
    
    const logSystem = guild.logSystem;
    const mainChannel = logSystem.channel;
    console.log(`[Guild: ${guildId}] Ana log kanalı: ${mainChannel || 'Ayarlanmamış'}`);
    
    // Log türleri
    const logTypes = [
      'messageDelete', 'messageUpdate',
      'memberJoin', 'memberLeave', 'memberUpdate', 'voiceUpdate',
      'channelCreate', 'channelDelete', 'channelUpdate',
      'roleCreate', 'roleDelete', 'roleUpdate',
      'banAdd', 'banRemove', 'inviteCreate', 'inviteDelete',
      'emoji', 'webhookUpdate', 'voiceStateUpdate'
    ];
    
    let guildUpdated = false;
    
    for (const logType of logTypes) {
      // Değeri güvenli bir şekilde al
      const currentValue = logSystem[logType];
      
      // Değer türünü kontrol et
      if (currentValue === undefined) {
        console.log(`[Guild: ${guildId}] ${logType} tanımlanmamış, varsayılan değer atanıyor...`);
        logSystem[logType] = {
          enabled: false,
          channel: null
        };
        guildUpdated = true;
      } 
      else if (typeof currentValue === 'boolean') {
        console.log(`[Guild: ${guildId}] ${logType} boolean tür (${currentValue}), obje formatına dönüştürülüyor...`);
        
        // Boolean değerin üzerine direk yazmak yerine, toObject() kullanarak yapıyı önce işlenebilir bir objeye dönüştürelim
        const guildObject = guild.toObject();
        guildObject.logSystem[logType] = {
          enabled: currentValue,
          channel: mainChannel
        };
        
        // Model'i güncelleyelim
        const updateResult = await Guild.updateOne(
          { _id: guild._id },
          { $set: { [`logSystem.${logType}`]: {
            enabled: currentValue,
            channel: mainChannel
          }}}
        );
        
        if (updateResult.modifiedCount > 0) {
          console.log(`[Guild: ${guildId}] ${logType} güncellendi.`);
          guildUpdated = true;
        } else {
          console.log(`[Guild: ${guildId}] ${logType} güncellenemedi!`);
        }
      }
      else if (typeof currentValue === 'object' && currentValue !== null && !('enabled' in currentValue)) {
        console.log(`[Guild: ${guildId}] ${logType} eksik alanlar içeriyor, düzeltiliyor...`);
        
        // Mevcut değerleri koru, eksik alanları ekle
        await Guild.updateOne(
          { _id: guild._id },
          { $set: { [`logSystem.${logType}`]: {
            enabled: currentValue.enabled || false,
            channel: currentValue.channel || mainChannel
          }}}
        );
        
        guildUpdated = true;
      }
      else if (currentValue && currentValue.enabled && !currentValue.channel && mainChannel) {
        console.log(`[Guild: ${guildId}] ${logType} etkin ama kanalı yok, ana kanal atanıyor...`);
        
        await Guild.updateOne(
          { _id: guild._id },
          { $set: { [`logSystem.${logType}.channel`]: mainChannel }}
        );
        
        guildUpdated = true;
      }
    }
    
    if (guildUpdated) {
      fixedCount++;
    }
  }
  
  console.log(`\nİşlem tamamlandı. ${fixedCount}/${allGuilds.length} sunucu düzeltildi.`);
}

async function main() {
  if (await connectToMongoDB()) {
    try {
      await fixLogTypes();
      console.log('Log düzeltme işlemi başarıyla tamamlandı');
    } catch (error) {
      console.error('Hata:', error.message);
    } finally {
      mongoose.connection.close();
      console.log('MongoDB bağlantısı kapatıldı');
    }
  }
}

main();