module.exports = {
    name: 'antinuke',
    description: 'Toggle Anti-Nuke protection system',
    execute(message, args, protectionSettings, logEvent) {
        if (!protectionSettings.antinuke) {
            protectionSettings.antinuke = true;
            message.channel.send('Anti-Nuke protection system has been enabled.');
            logEvent(`Anti-Nuke enabled by ${message.author.tag}`);
        } else {
            protectionSettings.antinuke = false;
            message.channel.send('Anti-Nuke protection system has been disabled.');
            logEvent(`Anti-Nuke disabled by ${message.author.tag}`);
        }
    },
};
