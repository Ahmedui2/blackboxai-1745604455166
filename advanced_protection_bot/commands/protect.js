const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('protect')
        .setDescription('Manage protection settings')
        .addStringOption(option =>
            option.setName('action')
                .setDescription('Action to perform')
                .setRequired(true)
                .addChoices(
                    { name: 'enable', value: 'enable' },
                    { name: 'disable', value: 'disable' },
                    { name: 'status', value: 'status' }
                )),
    async execute(interaction, client, protectionSettings, logEvent) {
        const action = interaction.options.getString('action');

        if (action === 'enable') {
            protectionSettings.enabled = true;
            await interaction.reply('Protection has been enabled.');
            await logEvent(`Protection enabled by ${interaction.user.tag}`);
        } else if (action === 'disable') {
            protectionSettings.enabled = false;
            await interaction.reply('Protection has been disabled.');
            await logEvent(`Protection disabled by ${interaction.user.tag}`);
        } else if (action === 'status') {
            const status = protectionSettings.enabled ? 'enabled' : 'disabled';
            await interaction.reply(`Protection is currently **${status}**.`);
        } else {
            await interaction.reply('Invalid action.');
        }
    },
};
