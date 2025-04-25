const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');

const config = require('./config.json');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.commands = new Collection();

// Load commands dynamically
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(path.join(__dirname, 'commands', file));
    client.commands.set(command.name, command);
}

// Protection settings and authorized users/roles collections
let protectionSettings = {
    enabled: true,
    antinuke: {
        enabled: false,
        blockBots: false,
        blockBans: false,
        blockKicks: false,
        blockRoleCreate: false,
        blockRoleDelete: false,
        blockChannelCreate: false,
        blockChannelDelete: false,
        penalty: 'none',
        authorizedUsers: new Set(),
        authorizedRoles: new Set(),
    },
    antiraid: {
        enabled: false,
        blockSpam: false,
        blockRaid: false,
        penalty: 'none',
        authorizedUsers: new Set(),
        authorizedRoles: new Set(),
    },
    antispam: {
        enabled: false,
        penalty: 'none',
        authorizedUsers: new Set(),
        authorizedRoles: new Set(),
    },
    antibot: {
        enabled: false,
        penalty: 'none',
        authorizedUsers: new Set(),
        authorizedRoles: new Set(),
    },
    ownerId: config.ownerId,
    adminIds: new Set(config.adminIds || []),
    logsChannelId: config.logsChannelId || null,
    prefix: config.prefix || '!',
};

const authorizedUsers = new Set([protectionSettings.ownerId, ...Array.from(protectionSettings.adminIds)]);

// Express app for web interface
const app = express();
app.use(bodyParser.json());
app.use(session({
    secret: config.sessionSecret || 'supersecretkey',
    resave: false,
    saveUninitialized: false,
}));

// Simple authentication middleware based on Discord user ID stored in session
function isAuthenticated(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }
    res.status(401).send('Unauthorized');
}

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to get current user info (Discord user ID)
app.get('/api/user', (req, res) => {
    if (req.session && req.session.userId) {
        res.json({ id: req.session.userId });
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
});

// API endpoint to get list of guilds where bot is present and user is a member with admin permissions
app.get('/api/servers', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.userId;
        const guilds = [];
        for (const [guildId, guild] of client.guilds.cache) {
            const member = await guild.members.fetch(userId).catch(() => null);
            if (member && (member.permissions.has('Administrator') || member.id === guild.ownerId)) {
                guilds.push({ id: guild.id, name: guild.name });
            }
        }
        res.json(guilds);
    } catch (error) {
        console.error('Error fetching servers:', error);
        res.status(500).json({ error: 'Failed to fetch servers' });
    }
});

// API endpoints for protection settings management per guild
app.get('/api/settings', isAuthenticated, async (req, res) => {
    const serverId = req.query.serverId;
    if (!serverId) return res.status(400).json({ error: 'Missing serverId' });

    // For demo, return global settings (should be per server in real app)
    res.json(protectionSettings);
});

app.post('/api/settings', isAuthenticated, async (req, res) => {
    const serverId = req.query.serverId;
    if (!serverId) return res.status(400).json({ error: 'Missing serverId' });

    const newSettings = req.body;
    // Update protection settings (for demo, update global)
    Object.assign(protectionSettings, newSettings);
    res.json({ success: true, settings: protectionSettings });
});

// Login route to simulate login by Discord user ID (for demo purposes)
app.post('/api/login', (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    req.session.userId = userId;
    res.json({ success: true });
});

// Logout route
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// HTTP and WebSocket server for real-time updates
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
    ws.send(JSON.stringify({ type: 'welcome', message: 'Connected to protection bot WS' }));
});

// Utility function to log events
async function logEvent(message) {
    if (!protectionSettings.logsChannelId) return;
    try {
        const channel = await client.channels.fetch(protectionSettings.logsChannelId);
        if (channel) {
            channel.send(message);
        }
    } catch (error) {
        console.error('Failed to send log message:', error);
    }
}

// Check if user is authorized for a system
function isUserAuthorizedForSystem(member, system) {
    if (!member) return false;
    if (member.id === protectionSettings.ownerId) return true;
    if (protectionSettings.adminIds && protectionSettings.adminIds.has(member.id)) return true;
    const auth = protectionSettings[system];
    if (!auth) return false;
    if (auth.authorizedUsers.has(member.id)) return true;
    if (member.roles.cache.some(role => auth.authorizedRoles.has(role.id))) return true;
    return false;
}

// Event listeners for protection systems (example for antinuke)
client.on('channelCreate', async channel => {
    if (!protectionSettings.enabled || !protectionSettings.antinuke.enabled) return;
    const auditLogs = await channel.guild.fetchAuditLogs({ type: 'CHANNEL_CREATE', limit: 1 });
    const entry = auditLogs.entries.first();
    if (entry && !isUserAuthorizedForSystem(channel.guild.members.cache.get(entry.executor.id), 'antinuke')) {
        await channel.delete('Unauthorized channel creation - AntiNuke');
        await logEvent(`Deleted unauthorized channel creation by ${entry.executor.tag}`);
    }
});

// Similar event listeners for other systems would be implemented here...

// Command handling for text commands
client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (!message.guild) return;

    const prefix = protectionSettings.prefix || '!';
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);
    if (!command) {
        return;
    }

    if (!isUserAuthorizedForSystem(message.member, command.name)) {
        message.reply('أنت غير مصرح لك باستخدام هذا الأمر.');
        return;
    }

    try {
        command.execute(message, args, protectionSettings, logEvent);
    } catch (error) {
        console.error(error);
        message.reply('There was an error executing that command.');
    }
});

// Login the bot
client.login(config.token);

// Start the web server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Web interface running on port ${PORT}`);
});
