module.exports = {
    name: 'antibot',
    description: 'Toggle Anti-Bot Join protection system',
    execute(message, args, protectionSettings, logEvent) {
        if (!protectionSettings.antibot) {
            protectionSettings.antibot = true;
            message.channel.send('Anti-Bot Join protection system has been enabled.');
            logEvent(`Anti-Bot Join enabled by ${message.author.tag}`);
        } else {
            protectionSettings.antibot = false;
            message.channel.send('Anti-Bot Join protection system has been disabled.');
            logEvent(`Anti-Bot Join disabled by ${message.author.tag}`);
        }
    },
};
