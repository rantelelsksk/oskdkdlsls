/**
 * Bu script tüm log tiplerinin veritabanında doğru formatta olmasını sağlar
 * logSystem içindeki tüm boolean değerleri {enabled: bool, channel: null} formatına dönüştürür
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Guild = require('./database/models/guildModel');
const logger = require('./util/logger');

// Log türleri listesi
const logTypes = [
    'messageDelete', 'messageUpdate', 'memberJoin', 'memberLeave', 'memberUpdate', 
    'channelCreate', 'channelDelete', 'channelUpdate', 'roleCreate', 'roleDelete', 
    'roleUpdate', 'banAdd', 'banRemove', 'inviteCreate', 'inviteDelete', 'emoji',
    'webhookUpdate', 'voiceStateUpdate', 'voiceUpdate'
];

async function connectToDatabase() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB veritabanına başarıyla bağlandı');
        return true;
    } catch (error) {
        console.error('MongoDB bağlantı hatası:', error.message);
        return false;
    }
}

async function fixAllLogStructures() {
    console.log('Tüm log yapılarını düzeltme işlemi başlatılıyor...');
    
    // Tüm sunucuları getir
    const allGuilds = await Guild.find();
    console.log(`Toplam ${allGuilds.length} sunucu bulundu.`);
    
    for (const guild of allGuilds) {
        console.log(`\n[Guild: ${guild.guildId}] Log yapısı kontrol ediliyor...`);
        
        // Log sistemi yoksa oluştur
        if (!guild.logSystem) {
            guild.logSystem = {
                enabled: false,
                channel: null
            };
            await guild.save();
            console.log(`[Guild: ${guild.guildId}] Log sistemi oluşturuldu.`);
            continue;
        }
        
        // Log sisteminde doğrudan değişiklik yapmak yerine, tamamını yeni bir nesne ile değiştirelim
        const mainLogChannel = guild.logSystem.channel;
        const isLogEnabled = guild.logSystem.enabled || false;
        
        // Yeni nesne oluştur
        const newLogSystem = {
            enabled: isLogEnabled,
            channel: mainLogChannel
        };
        
        // Tüm log türlerini yeni formatta ekle
        for (const logType of logTypes) {
            const currentLogType = guild.logSystem[logType];
            
            if (currentLogType === undefined) {
                // Log türü tanımlanmamışsa varsayılan değerlerle ekle
                newLogSystem[logType] = { 
                    enabled: false, 
                    channel: null 
                };
            } 
            else if (typeof currentLogType === 'boolean') {
                // Boolean değer ise nesneye dönüştür
                newLogSystem[logType] = {
                    enabled: currentLogType,
                    channel: mainLogChannel
                };
                console.log(`[Guild: ${guild.guildId}] ${logType} log türü formatı düzeltildi (boolean -> nesne)`);
            }
            else if (typeof currentLogType === 'object' && currentLogType !== null) {
                // Nesne ise geçerli değerleri aktar
                newLogSystem[logType] = {
                    enabled: currentLogType.enabled !== undefined ? currentLogType.enabled : false,
                    channel: currentLogType.channel || mainLogChannel
                };
            }
            else {
                // Diğer durumlar için varsayılan değerler
                newLogSystem[logType] = {
                    enabled: false,
                    channel: null
                };
                console.log(`[Guild: ${guild.guildId}] ${logType} log türü formatı oluşturuldu`);
            }
        }
        
        // Tamamen yeni bir nesne olarak güncelle
        guild.logSystem = newLogSystem;
        
        // Değişiklikleri kaydet
        try {
            await guild.save();
            console.log(`[Guild: ${guild.guildId}] Log yapısı başarıyla güncellendi.`);
        } catch (error) {
            console.error(`[Guild: ${guild.guildId}] Güncelleme hatası: ${error.message}`);
        }
    }
    
    console.log('\nTüm log yapıları güncelleme işlemi tamamlandı!');
}

async function main() {
    if (await connectToDatabase()) {
        try {
            await fixAllLogStructures();
        } catch (error) {
            console.error('Hata:', error.message);
        } finally {
            mongoose.connection.close();
            console.log('MongoDB bağlantısı kapatıldı');
        }
    }
}

main();