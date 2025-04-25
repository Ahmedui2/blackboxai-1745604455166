const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');

module.exports = {
    name: 'settings',
    description: 'Send the control panel link with a reaction button',
    async execute(message, args, protectionSettings, logEvent) {
        const user = message.author;
        const isAuthorized = user.id === protectionSettings.ownerId ||
            protectionSettings.adminIds.has(user.id) ||
            message.member.roles.cache.some(role => {
                return Object.values(protectionSettings.authorizedCollections).some(auth => auth.roles.has(role.id));
            });

        if (!isAuthorized) {
            return message.reply('أنت غير مصرح لك باستخدام هذا الأمر.');
        }

        const controlPanelUrl = 'http://localhost:3000'; // استبدل بالرابط الحقيقي للموقع عند النشر

        const embed = new MessageEmbed()
            .setTitle('لوحة تحكم الحماية المتقدمة')
            .setDescription('اضغط على الزر أدناه للدخول إلى لوحة التحكم الخاصة بالسيرفر.')
            .setColor('#0099ff')
            .setFooter({ text: 'Advanced Protection Bot' })
            .setTimestamp();

        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setLabel('فتح لوحة التحكم')
                    .setStyle('LINK')
                    .setURL(controlPanelUrl)
            );

        await message.channel.send({ embeds: [embed], components: [row] });
        await message.react('⚙️');
        await logEvent(`Settings link sent to ${user.tag}`);
    },
};
