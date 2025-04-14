/**
 * Bu script, butonlar/panel/logSystem.js dosyasındaki log türlerini düzeltir.
 * Sorunu giderir: `guildSettings.logSystem.logType = !logSettings.logType;`
 * Yeni format: `guildSettings.logSystem.logType = { enabled: !logSettings.logType?.enabled || false, channel: logSettings.logType?.channel || null };`
 */

const fs = require('fs');
const path = require('path');

// Dosya yolu
const filePath = path.join(__dirname, 'butonlar', 'panel', 'logSystem.js');

// Dosyayı oku
let content = fs.readFileSync(filePath, 'utf8');

// Log türleri
const logTypes = [
    'messageDelete', 'messageUpdate',
    'memberJoin', 'memberLeave', 'memberUpdate', 'voiceUpdate',
    'channelCreate', 'channelDelete', 'channelUpdate',
    'roleCreate', 'roleDelete', 'roleUpdate',
    'banAdd', 'banRemove', 'inviteCreate', 'inviteDelete',
    'emoji', 'webhookUpdate', 'voiceStateUpdate'
];

// Her log türü için regex pattern
logTypes.forEach(logType => {
    // Düzeltilmemiş satırı bul
    const pattern = new RegExp(`guildSettings\\.logSystem\\.${logType} = !logSettings\\.${logType};`);
    
    // Düzeltilmiş format
    const replacement = 
`// Mevcut log ayarının durumunu kontrol et
                                    const currentEnabled = logSettings.${logType}?.enabled || false;
                                    
                                    // Doğru nesne yapısını oluştur
                                    guildSettings.logSystem.${logType} = {
                                        enabled: !currentEnabled,
                                        channel: logSettings.${logType}?.channel || null
                                    };`;
    
    // Değiştir
    content = content.replace(pattern, replacement);
    
    // Display satırlarını güncelle
    const displayPattern = new RegExp(`guildSettings\\.logSystem\\.${logType}(\\s*\\?)`);
    const displayReplacement = `guildSettings.logSystem.${logType}.enabled$1`;
    content = content.replace(displayPattern, displayReplacement);
});

// Dosyayı kaydet
fs.writeFileSync(filePath, content);

console.log('Log türleri başarıyla düzeltildi!');