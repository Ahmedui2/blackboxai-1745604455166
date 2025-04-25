module.exports = {
    name: 'antispam',
    description: 'Toggle Anti-Spam protection system',
    execute(message, args, protectionSettings, logEvent) {
        if (!protectionSettings.antispam) {
            protectionSettings.antispam = true;
            message.channel.send('Anti-Spam protection system has been enabled.');
            logEvent(`Anti-Spam enabled by ${message.author.tag}`);
        } else {
            protectionSettings.antispam = false;
            message.channel.send('Anti-Spam protection system has been disabled.');
            logEvent(`Anti-Spam disabled by ${message.author.tag}`);
        }
    },
};
