import fs from 'fs';
import path from 'path';

async function parseM3U() {
    const url = 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/ar.m3u';
    const response = await fetch(url);
    const text = await response.text();
    
    const lines = text.split('\n');
    const channels = [];
    let currentChannel = { name: '', embed: '', category: 'Argentina', channelNumber: 0 };
    let channelCounter = 200;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('#EXTINF')) {
            // Extraer nombre del canal después de la coma
            const nameMatch = line.match(/,(.*)$/);
            if (nameMatch) {
                currentChannel.name = nameMatch[1].trim();
            }
        } else if (line.startsWith('http')) {
            currentChannel.embed = `hls-player.html?url=${line}`;
            currentChannel.channelNumber = channelCounter++;
            channels.push({ ...currentChannel });
            currentChannel = { name: '', embed: '', category: 'Argentina', channelNumber: 0 };
        }
    }

    console.log(JSON.stringify(channels, null, 2));
}

parseM3U();
