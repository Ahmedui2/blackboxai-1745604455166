module.exports = {
    name: 'antiraid',
    description: 'Toggle Anti-Raid protection system',
    execute(message, args, protectionSettings, logEvent) {
        if (!protectionSettings.antiraid) {
            protectionSettings.antiraid = true;
            message.channel.send('Anti-Raid protection system has been enabled.');
            logEvent(`Anti-Raid enabled by ${message.author.tag}`);
        } else {
            protectionSettings.antiraid = false;
            message.channel.send('Anti-Raid protection system has been disabled.');
            logEvent(`Anti-Raid disabled by ${message.author.tag}`);
        }
    },
};
