import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FiSettings, 
  FiSave, 
  FiServer,
  FiCpu,
  FiHardDrive,
  FiShield,
  FiBell,
  FiCheckCircle,
  FiXCircle,
  FiInfo,
  FiGlobe,
  FiRefreshCw,
  FiActivity,
  FiTerminal,
  FiFolder,
  FiUser,
  FiDownload,
  FiBox,
  FiEye,
  FiEyeOff,
  FiLock,
  FiUnlock,
  FiCode,
  FiMessageSquare,
  FiUsers,
  FiMap,
  FiLayers
} from 'react-icons/fi';
import { LuNetwork } from "react-icons/lu";
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Container = styled.div`
  padding: 15px 20px;
  color: #a4aabc;
`;

const NavTabs = styled.div`
  display: flex;
  background: #2e3245;
  border-radius: 8px;
  padding: 8px;
  margin-bottom: 15px;
  gap: 4px;
`;

const NavTab = styled.div`
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  color: #a4aabc;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  
  ${props => props.$active && `
    background: #3b82f6;
    color: white;
  `}
  
  &:hover {
    background: #35394e;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
  padding-bottom: 12px;
  border-bottom: 1px solid #3a3f57;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
`;

const Tabs = styled.div`
  display: flex;
  margin-bottom: 15px;
  border-bottom: 1px solid #3a3f57;
  flex-wrap: wrap;
`;

const Tab = styled.button`
  padding: 10px 16px;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  color: #a4aabc;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
  
  ${props => props.$active && `
    color: #3b82f6;
    border-bottom-color: #3b82f6;
  `}
  
  &:hover {
    color: #3b82f6;
  }
`;

const Content = styled.div`
  background: #2e3245;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const Section = styled.div`
  margin-bottom: 30px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h2`
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 1.3rem;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #a4aabc;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 15px;
  background: #35394e;
  border: 1px solid #3a3f57;
  border-radius: 6px;
  font-size: 1rem;
  color: #fff;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 15px;
  background: #35394e;
  border: 1px solid #3a3f57;
  border-radius: 6px;
  font-size: 1rem;
  color: #fff;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px 15px;
  background: #35394e;
  border: 1px solid #3a3f57;
  border-radius: 6px;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
  color: #fff;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  margin-bottom: 10px;
  color: #a4aabc;
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #3a3f57;
`;

const CancelButton = styled.button`
  padding: 10px 20px;
  background: #4a5070;
  color: #cbd5e1;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  
  &:hover {
    background: #565d81;
  }
`;

const SaveButton = styled.button`
  padding: 10px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: #2563eb;
  }
  
  &:disabled {
    background: #4a5070;
    cursor: not-allowed;
  }
`;

const TwoColumnGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Description = styled.p`
  color: #6b7280;
  font-size: 0.9rem;
  margin-top: 5px;
`;

const ErrorMessage = styled.div`
  background: #991b1b;
  color: #fecaca;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-left: 4px solid #ef4444;
`;

const NotificationContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SuccessIcon = styled(FiCheckCircle)`
  color: #10b981;
  font-size: 1.2rem;
`;

const ErrorIcon = styled(FiXCircle)`
  color: #ef4444;
  font-size: 1.2rem;
`;

const InfoIcon = styled(FiInfo)`
  color: #3b82f6;
  font-size: 1.2rem;
`;

const WorldList = styled.div`
  margin-top: 15px;
`;

const WorldItem = styled.div`
  padding: 12px;
  border: 1px solid #3a3f57;
  border-radius: 6px;
  margin-bottom: 10px;
  background: ${props => props.$active ? '#1e3a8a' : '#35394e'};
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.$active ? '#1e40af' : '#3a3f57'};
  }
`;

const WorldName = styled.div`
  font-weight: 500;
  color: #fff;
`;

const WorldPath = styled.div`
  font-size: 0.8rem;
  color: #a4aabc;
  margin-top: 4px;
`;

const RefreshButton = styled.button`
  padding: 8px 12px;
  background: #4a5070;
  color: #cbd5e1;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 5px;
  margin-left: auto;
  
  &:hover {
    background: #565d81;
  }
  
  &:disabled {
    background: #3a3f57;
    cursor: not-allowed;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
`;

function Settings() {
  const { serverId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [server, setServer] = useState(null);
  const [properties, setProperties] = useState({});
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [worlds, setWorlds] = useState([]);
  const [loadingWorlds, setLoadingWorlds] = useState(false);
  const { t } = useLanguage();

  // Lista wszystkich właściwości Java z pliku server(java).properties z oficjalnymi opisami
  const javaPropertiesConfig = {
    general: [
      { 
        key: 'server-name', 
        label: 'Server Name', 
        type: 'text', 
        description: 'The name of your Minecraft server as shown in the server list' 
      },
      { 
        key: 'motd', 
        label: 'MOTD (Message of the Day)', 
        type: 'textarea', 
        description: 'Message shown when players connect to your server. Supports formatting codes with §' 
      },
      { 
        key: 'max-players', 
        label: 'Max Players', 
        type: 'number', 
        min: 1, 
        max: 1000, 
        description: 'Maximum number of players allowed on the server simultaneously' 
      },
      { 
        key: 'server-port', 
        label: 'Server Port', 
        type: 'number', 
        min: 1, 
        max: 65535, 
        description: 'The port the server will listen on (default: 25565)' 
      },
    ],
    game: [
      { 
        key: 'gamemode', 
        label: 'Default Game Mode', 
        type: 'select', 
        options: [
          { value: 'survival', label: 'Survival' },
          { value: 'creative', label: 'Creative' },
          { value: 'adventure', label: 'Adventure' },
          { value: 'spectator', label: 'Spectator' }
        ], 
        description: 'Default game mode for new players' 
      },
      { 
        key: 'difficulty', 
        label: 'Difficulty', 
        type: 'select', 
        options: [
          { value: 'peaceful', label: 'Peaceful' },
          { value: 'easy', label: 'Easy' },
          { value: 'normal', label: 'Normal' },
          { value: 'hard', label: 'Hard' }
        ], 
        description: 'Difficulty level of the server. Affects monster damage and other game mechanics' 
      },
      { 
        key: 'hardcore', 
        label: 'Hardcore Mode', 
        type: 'checkbox', 
        description: 'If true, players are set to spectator mode on death and cannot respawn' 
      },
      { 
        key: 'pvp', 
        label: 'PvP', 
        type: 'checkbox', 
        description: 'Allow player vs player combat. If false, players cannot damage each other' 
      },
      { 
        key: 'force-gamemode', 
        label: 'Force Game Mode', 
        type: 'checkbox', 
        description: 'Force players to join in the default game mode, overriding their previous mode' 
      },
    ],
    world: [
      { 
        key: 'level-name', 
        label: 'World Name', 
        type: 'text', 
        description: 'Name of the world folder. The server will look for this folder in the server directory' 
      },
      { 
        key: 'level-seed', 
        label: 'World Seed', 
        type: 'text', 
        description: 'Seed for world generation. Leave empty for random seed' 
      },
      { 
        key: 'level-type', 
        label: 'World Type', 
        type: 'select', 
        options: [
          { value: 'default', label: 'Default' },
          { value: 'flat', label: 'Flat' },
          { value: 'largeBiomes', label: 'Large Biomes' },
          { value: 'amplified', label: 'Amplified' },
          { value: 'single_biome_surface', label: 'Single Biome' }
        ], 
        description: 'Type of world generation algorithm to use' 
      },
      { 
        key: 'generate-structures', 
        label: 'Generate Structures', 
        type: 'checkbox', 
        description: 'Generate structures like villages, strongholds, and temples' 
      },
      { 
        key: 'allow-nether', 
        label: 'Allow Nether', 
        type: 'checkbox', 
        description: 'Enable the Nether dimension. Players can build nether portals if true' 
      },
      { 
        key: 'max-world-size', 
        label: 'Max World Size', 
        type: 'number', 
        min: 1, 
        max: 29999984, 
        description: 'Maximum possible size of the world in blocks (radius from center)' 
      },
    ],
    performance: [
      { 
        key: 'view-distance', 
        label: 'View Distance', 
        type: 'number', 
        min: 3, 
        max: 32, 
        description: 'The number of chunks the server sends to clients. Higher values increase RAM usage' 
      },
      { 
        key: 'simulation-distance', 
        label: 'Simulation Distance', 
        type: 'number', 
        min: 3, 
        max: 32, 
        description: 'The number of chunks away from players the server updates entities and block ticks' 
      },
      { 
        key: 'max-tick-time', 
        label: 'Max Tick Time', 
        type: 'number', 
        min: 1000, 
        max: 180000, 
        description: 'Maximum time a single tick can take (ms) before server watchdog stops it' 
      },
      { 
        key: 'network-compression-threshold', 
        label: 'Network Compression Threshold', 
        type: 'number', 
        min: 0, 
        max: 65535, 
        description: 'Minimum size for network compression. 0 = disable, -1 = compress everything' 
      },
      { 
        key: 'entity-broadcast-range-percentage', 
        label: 'Entity Broadcast Range', 
        type: 'number', 
        min: 10, 
        max: 1000, 
        description: 'Percentage of view distance for entity updates. Lower values reduce network usage' 
      },
    ],
    security: [
      { 
        key: 'online-mode', 
        label: 'Online Mode', 
        type: 'checkbox', 
        description: 'Verify players with Mojang/Microsoft servers. Prevents cracked clients from joining' 
      },
      { 
        key: 'enforce-whitelist', 
        label: 'Enforce Whitelist', 
        type: 'checkbox', 
        description: 'Automatically whitelist players when a server operator adds them' 
      },
      { 
        key: 'white-list', 
        label: 'Whitelist Enabled', 
        type: 'checkbox', 
        description: 'Enable whitelist functionality. Only whitelisted players can join' 
      },
      { 
        key: 'enable-command-block', 
        label: 'Enable Command Blocks', 
        type: 'checkbox', 
        description: 'Allow command blocks to be used in the world' 
      },
      { 
        key: 'spawn-protection', 
        label: 'Spawn Protection', 
        type: 'number', 
        min: 0, 
        max: 10000, 
        description: 'Radius of spawn protection (0 to disable). Non-ops cannot build in this area' 
      },
      { 
        key: 'op-permission-level', 
        label: 'OP Permission Level', 
        type: 'select', 
        options: [
          { value: '1', label: 'Level 1 - Basic commands' },
          { value: '2', label: 'Level 2 - Moderate commands' },
          { value: '3', label: 'Level 3 - Advanced commands' },
          { value: '4', label: 'Level 4 - All commands' }
        ], 
        description: 'Permission level for server operators. Level 4 grants all commands including stop' 
      },
      { 
        key: 'function-permission-level', 
        label: 'Function Permission Level', 
        type: 'select', 
        options: [
          { value: '1', label: 'Level 1' },
          { value: '2', label: 'Level 2' },
          { value: '3', label: 'Level 3' },
          { value: '4', label: 'Level 4' }
        ], 
        description: 'Permission level required to use functions' 
      },
      { 
        key: 'prevent-proxy-connections', 
        label: 'Prevent Proxy Connections', 
        type: 'checkbox', 
        description: 'Prevent players from connecting through proxies/VPNs' 
      },
    ],
    features: [
      { 
        key: 'allow-flight', 
        label: 'Allow Flight', 
        type: 'checkbox', 
        description: 'Allow players to fly (may require client mods like Creative mode)' 
      },
      { 
        key: 'spawn-animals', 
        label: 'Spawn Animals', 
        type: 'checkbox', 
        description: 'Allow animals to spawn naturally' 
      },
      { 
        key: 'spawn-monsters', 
        label: 'Spawn Monsters', 
        type: 'checkbox', 
        description: 'Allow monsters to spawn naturally' 
      },
      { 
        key: 'spawn-npcs', 
        label: 'Spawn NPCs', 
        type: 'checkbox', 
        description: 'Allow NPCs (villagers) to spawn naturally' 
      },
      { 
        key: 'enable-query', 
        label: 'Enable Query', 
        type: 'checkbox', 
        description: 'Enable GameSpy4 query protocol. Allows server monitoring tools to get info' 
      },
      { 
        key: 'enable-rcon', 
        label: 'Enable RCON', 
        type: 'checkbox', 
        description: 'Enable Remote Console. Allows remote administration via RCON protocol' 
      },
      { 
        key: 'enable-status', 
        label: 'Enable Status', 
        type: 'checkbox', 
        description: 'Respond to status requests from clients. If false, server appears offline' 
      },
      { 
        key: 'enable-jmx-monitoring', 
        label: 'Enable JMX Monitoring', 
        type: 'checkbox', 
        description: 'Enable Java Management Extensions monitoring' 
      },
      { 
        key: 'sync-chunk-writes', 
        label: 'Sync Chunk Writes', 
        type: 'checkbox', 
        description: 'Synchronize chunk writes to disk. Disable for better performance but higher corruption risk' 
      },
      { 
        key: 'use-native-transport', 
        label: 'Use Native Transport', 
        type: 'checkbox', 
        description: 'Use native transport system for better performance on Linux' 
      },
    ],
    network: [
      { 
        key: 'server-ip', 
        label: 'Server IP', 
        type: 'text', 
        description: 'IP address to bind to. Leave empty to bind to all available addresses' 
      },
      { 
        key: 'query.port', 
        label: 'Query Port', 
        type: 'number', 
        min: 1, 
        max: 65535, 
        description: 'Port for query protocol (default: same as server-port)' 
      },
      { 
        key: 'rcon.port', 
        label: 'RCON Port', 
        type: 'number', 
        min: 1, 
        max: 65535, 
        description: 'Port for Remote Console (default: 25575)' 
      },
      { 
        key: 'rate-limit', 
        label: 'Rate Limit', 
        type: 'number', 
        min: 0, 
        max: 1000, 
        description: 'Maximum number of packets per second per client (0 = unlimited)' 
      },
    ],
    chat: [
      { 
        key: 'text-filtering-config', 
        label: 'Text Filtering Config', 
        type: 'text', 
        description: 'Configuration file for text filtering' 
      },
      { 
        key: 'broadcast-console-to-ops', 
        label: 'Broadcast Console to OPs', 
        type: 'checkbox', 
        description: 'Send console messages to all online operators' 
      },
      { 
        key: 'broadcast-rcon-to-ops', 
        label: 'Broadcast RCON to OPs', 
        type: 'checkbox', 
        description: 'Send RCON messages to all online operators' 
      },
      { 
        key: 'log-ips', 
        label: 'Log IP Addresses', 
        type: 'checkbox', 
        description: 'Log player IP addresses in server logs' 
      },
    ],
    resourcepacks: [
      { 
        key: 'require-resource-pack', 
        label: 'Require Resource Pack', 
        type: 'checkbox', 
        description: 'Force clients to use the server resource pack' 
      },
      { 
        key: 'resource-pack', 
        label: 'Resource Pack URL', 
        type: 'text', 
        description: 'URL to the resource pack file. Must be a direct download link' 
      },
      { 
        key: 'resource-pack-prompt', 
        label: 'Resource Pack Prompt', 
        type: 'text', 
        description: 'Custom message shown when requiring a resource pack' 
      },
      { 
        key: 'resource-pack-sha1', 
        label: 'Resource Pack SHA1', 
        type: 'text', 
        description: 'SHA1 hash of the resource pack for verification' 
      },
    ],
    advanced: [
      { 
        key: 'max-chained-neighbor-updates', 
        label: 'Max Chained Updates', 
        type: 'number', 
        min: 0, 
        max: 1000000, 
        description: 'Limit for chain of neighbor updates before skipping additional updates' 
      },
      { 
        key: 'player-idle-timeout', 
        label: 'Player Idle Timeout', 
        type: 'number', 
        min: 0, 
        max: 1440, 
        description: 'Minutes before idle players are kicked (0 = disabled)' 
      },
      { 
        key: 'region-file-compression', 
        label: 'Region File Compression', 
        type: 'select', 
        options: [
          { value: 'deflate', label: 'Deflate' },
          { value: 'gzip', label: 'Gzip' },
          { value: 'none', label: 'None' }
        ], 
        description: 'Compression algorithm for region files' 
      },
      { 
        key: 'pause-when-empty', 
        label: 'Pause When Empty', 
        type: 'checkbox', 
        description: 'Pause the server when no players are online to reduce CPU usage' 
      },
      { 
        key: 'hide-online-players', 
        label: 'Hide Online Players', 
        type: 'checkbox', 
        description: 'Hide online player list from server status requests' 
      },
    ]
  };

  // Lista wszystkich właściwości Bedrock z pliku server(bedrock).properties
  const bedrockPropertiesConfig = {
    general: [
      { key: 'server-name', label: 'Server Name', type: 'text', description: 'The name of your Minecraft server' },
      { key: 'motd', label: 'MOTD (Message of the Day)', type: 'textarea', description: 'Message shown when players connect to your server' },
      { key: 'max-players', label: 'Max Players', type: 'number', min: 1, max: 30, description: 'Maximum number of players that can play on the server' },
      { key: 'server-port', label: 'Server Port (IPv4)', type: 'number', min: 1, max: 65535, description: 'Which IPv4 port the server should listen to' },
      { key: 'server-portv6', label: 'Server Port (IPv6)', type: 'number', min: 1, max: 65535, description: 'Which IPv6 port the server should listen to' },
    ],
    game: [
      { key: 'gamemode', label: 'Game Mode', type: 'select', options: [
        { value: 'survival', label: 'Survival' },
        { value: 'creative', label: 'Creative' },
        { value: 'adventure', label: 'Adventure' }
      ], description: 'Sets the game mode for new players' },
      { key: 'difficulty', label: 'Difficulty', type: 'select', options: [
        { value: 'peaceful', label: 'Peaceful' },
        { value: 'easy', label: 'Easy' },
        { value: 'normal', label: 'Normal' },
        { value: 'hard', label: 'Hard' }
      ], description: 'Sets the difficulty of the world' },
      { key: 'allow-cheats', label: 'Allow Cheats', type: 'checkbox', description: 'If true then cheats like commands can be used' },
      { key: 'force-gamemode', label: 'Force Game Mode', type: 'checkbox', description: 'Force the server gamemode on clients' },
      { key: 'default-player-permission-level', label: 'Default Player Permission', type: 'select', options: [
        { value: 'visitor', label: 'Visitor' },
        { value: 'member', label: 'Member' },
        { value: 'operator', label: 'Operator' }
      ], description: 'Permission level for new players joining for the first time' },
    ],
    world: [
      { key: 'level-name', label: 'World Name', type: 'text', description: 'Name of the world folder' },
      { key: 'level-seed', label: 'Seed', type: 'text', description: 'Use to randomize the world' },
      { key: 'level-type', label: 'World Type', type: 'select', options: [
        { value: 'DEFAULT', label: 'Default' },
        { value: 'FLAT', label: 'Flat' },
        { value: 'largeBiomes', label: 'Large Biomes' }
      ], description: 'Type of world generation' },
      { key: 'spawn-protection', label: 'Spawn Protection', type: 'number', min: 0, max: 10000, description: 'Radius of spawn protection' },
      { key: 'texturepack-required', label: 'Texture Pack Required', type: 'checkbox', description: 'Force clients to use texture packs in the current world' },
    ],
    performance: [
      { key: 'view-distance', label: 'View Distance', type: 'number', min: 5, max: 96, description: 'The maximum allowed view distance in number of chunks' },
      { key: 'tick-distance', label: 'Tick Distance', type: 'number', min: 4, max: 12, description: 'The world will be ticked this many chunks away from any player' },
      { key: 'max-threads', label: 'Max Threads', type: 'number', min: 1, max: 32, description: 'Maximum number of threads the server will try to use' },
      { key: 'compression-threshold', label: 'Compression Threshold', type: 'number', min: 0, max: 65535, description: 'Determines the smallest size of raw network payload to compress' },
      { key: 'compression-algorithm', label: 'Compression Algorithm', type: 'select', options: [
        { value: 'zlib', label: 'Zlib' },
        { value: 'snappy', label: 'Snappy' }
      ], description: 'Determines the compression algorithm to use for networking' },
    ],
    security: [
      { key: 'online-mode', label: 'Online Mode', type: 'checkbox', description: 'If true then all connected players must be authenticated to Xbox Live' },
      { key: 'allow-list', label: 'Allow List', type: 'checkbox', description: 'If true then all connected players must be listed in the separate allowlist.json file' },
      { key: 'enable-lan-visibility', label: 'LAN Visibility', type: 'checkbox', description: 'Listen and respond to clients that are looking for servers on the LAN' },
      { key: 'enable-command-block', label: 'Enable Command Block', type: 'checkbox', description: 'Enable command blocks on the server' },
      { key: 'disable-custom-skins', label: 'Disable Custom Skins', type: 'checkbox', description: 'Disable players customized skins that were customized outside of the Minecraft store' },
    ],
    advanced: [
      { key: 'player-idle-timeout', label: 'Player Idle Timeout', type: 'number', min: 0, max: 1440, description: 'After a player has idled for this many minutes they will be kicked' },
      { key: 'content-log-file-enabled', label: 'Content Log File', type: 'checkbox', description: 'Enables logging content errors to a file' },
      { key: 'server-authoritative-movement-strict', label: 'Strict Movement', type: 'checkbox', description: 'Set at true to be more strict toward the Player position' },
      { key: 'server-authoritative-block-breaking-pick-range-scalar', label: 'Block Breaking Range', type: 'number', min: 1, max: 10, step: 0.1, description: 'Server authoritative block breaking pick range scalar' },
      { key: 'client-side-chunk-generation-enabled', label: 'Client Side Chunk Generation', type: 'checkbox', description: 'If true, the server will inform clients that they have the ability to generate visual level chunks' },
    ]
  };

  useEffect(() => {
    checkPermissions();
    fetchServer();
    fetchProperties();
  }, [serverId]);

  useEffect(() => {
    if (server?.type === 'bedrock') {
      fetchWorlds();
    }
  }, [server]);

  const showSuccess = (message) => {
    toast.success(
      <NotificationContainer>
        <SuccessIcon />
        <span>{message}</span>
      </NotificationContainer>,
      {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      }
    );
  };

  const showError = (message) => {
    toast.error(
      <NotificationContainer>
        <ErrorIcon />
        <span>{message}</span>
      </NotificationContainer>,
      {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      }
    );
  };

  const showInfo = (message) => {
    toast.info(
      <NotificationContainer>
        <InfoIcon />
        <span>{message}</span>
      </NotificationContainer>,
      {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      }
    );
  };

  const checkPermissions = async () => {
    try {
      const response = await api.get(`/servers/${serverId}/users`);
      const currentUser = response.data.find(u => u.user_id === user.id);
      
      if (currentUser && currentUser.permissions.can_edit_files) {
        setHasPermission(true);
      } else if (user.role === 'admin') {
        setHasPermission(true);
      } else {
        setHasPermission(false);
        showInfo(t('server.settings.noPermission') || 'You do not have permission to edit server settings');
      }
    } catch (error) {
      showError(t('server.settings.permissionError') || `Error checking permissions: ${error}`);
    }
  };

  const fetchServer = async () => {
    try {
      const response = await api.get(`/servers/${serverId}`);
      setServer(response.data);
    } catch (error) {
      showError(t('server.settings.fetchError') || `Error fetching server: ${error}`);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await api.get(`/servers/${serverId}/properties`);
      setProperties(response.data);
      setLoading(false);
    } catch (error) {
      showError(t('server.settings.propertiesError') || `Error fetching properties: ${error}`);
      setLoading(false);
    }
  };

  const fetchWorlds = async () => {
    if (!server) return;
    
    setLoadingWorlds(true);
    try {
      const response = await api.get(`/servers/${serverId}/files?path=worlds`);
      const files = response.data;
      
      const worldDirectories = files.filter(file => 
        file.isDirectory && 
        !['behavior_packs', 'resource_packs', 'development_behavior_packs', 
          'development_resource_packs', 'worlds', 'backups', 'logs'].includes(file.name)
      );
      
      const worldsList = [];
      for (const dir of files) {
        try {
          const worldFiles = await api.get(`/servers/${serverId}/files?path=worlds/${dir.name}`);
          const hasWorldFiles = worldFiles.data.some(file => 
            file.name === 'level.dat' || file.name === 'levelname.txt'
          );
          
          if (hasWorldFiles) {
            worldsList.push({
              name: dir.name,
              path: `worlds/${dir.name}`,
              isActive: dir.name === (properties['level-name'] || 'Bedrock level')
            });
          }
        } catch (error) {
          console.log(`Could not check world directory ${dir.name}:`, error);
        }
      }
      
      setWorlds(worldsList);
    } catch (error) {
      console.log('Error fetching worlds:', error);
      setWorlds([]);
    } finally {
      setLoadingWorlds(false);
    }
  };

  const handlePropertyChange = (key, value) => {
    setProperties(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleWorldChange = async (worldName) => {
    if (!hasPermission) {
      showError(t('server.settings.noPermission') || 'You do not have permission to change worlds');
      return;
    }

    try {
      handlePropertyChange('level-name', worldName);
      
      showInfo(t('server.settings.worldChanged', { worldName }) || `World changed to ${worldName}. Remember to save settings.`);
      
      await updateWorldPacksFiles(worldName);
      
    } catch (error) {
      showError(t('server.settings.worldChangeError') || `Error changing world: ${error}`);
    }
  };

  const updateWorldPacksFiles = async (worldName) => {
    try {
      const addonsResponse = await api.get(`/servers/${serverId}/installed-addons`);
      const installedAddons = addonsResponse.data;

      const serverAddons = installedAddons.filter(addon => 
        addon.installed_on_servers && addon.installed_on_servers.includes(parseInt(serverId))
      );

      const newBehaviorPacks = serverAddons
        .filter(addon => addon.behavior_pack_uuid && addon.enabled)
        .map(addon => ({
          pack_id: addon.behavior_pack_uuid,
          version: addon.behavior_pack_version || [1, 0, 0]
        }));

      const newResourcePacks = serverAddons
        .filter(addon => addon.resource_pack_uuid && addon.enabled)
        .map(addon => ({
          pack_id: addon.resource_pack_uuid,
          version: addon.resource_pack_version || [1, 0, 0]
        }));

      try {
        const existingBehaviorPacksResponse = await api.get(`/servers/${serverId}/files/read?path=worlds/${worldName}/world_behavior_packs.json`);
        const existingBehaviorPacks = JSON.parse(existingBehaviorPacksResponse.data.content);
        
        const mergedBehaviorPacks = [...existingBehaviorPacks];
        newBehaviorPacks.forEach(newPack => {
          if (!mergedBehaviorPacks.some(existingPack => existingPack.pack_id === newPack.pack_id)) {
            mergedBehaviorPacks.push(newPack);
          }
        });

        await api.post(`/servers/${serverId}/files/write`, {
          path: `worlds/${worldName}/world_behavior_packs.json`,
          content: JSON.stringify(mergedBehaviorPacks, null, 2)
        });
      } catch (error) {
        if (error.response?.status === 404 || error.response?.status === 500) {
          await api.post(`/servers/${serverId}/files/write`, {
            path: `worlds/${worldName}/world_behavior_packs.json`,
            content: JSON.stringify(newBehaviorPacks, null, 2)
          });
        } else {
          throw error;
        }
      }

      try {
        const existingResourcePacksResponse = await api.get(`/servers/${serverId}/files/read?path=worlds/${worldName}/world_resource_packs.json`);
        const existingResourcePacks = JSON.parse(existingResourcePacksResponse.data.content);
        
        const mergedResourcePacks = [...existingResourcePacks];
        newResourcePacks.forEach(newPack => {
          if (!mergedResourcePacks.some(existingPack => existingPack.pack_id === newPack.pack_id)) {
            mergedResourcePacks.push(newPack);
          }
        });

        await api.post(`/servers/${serverId}/files/write`, {
          path: `worlds/${worldName}/world_resource_packs.json`,
          content: JSON.stringify(mergedResourcePacks, null, 2)
        });
      } catch (error) {
        if (error.response?.status === 404 || error.response?.status === 500) {
          await api.post(`/servers/${serverId}/files/write`, {
            path: `worlds/${worldName}/world_resource_packs.json`,
            content: JSON.stringify(newResourcePacks, null, 2)
          });
        } else {
          throw error;
        }
      }

      showInfo(t('server.settings.worldPacksUpdated', { worldName }) || `World pack files updated for ${worldName}`);

    } catch (error) {
      console.error('Error updating world pack files:', error);
      showError(t('server.settings.worldPacksError') || 'Could not update world pack files automatically');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post(`/servers/${serverId}/properties`, properties);
      
      if (server?.type === 'bedrock' && properties['level-name']) {
        await updateWorldPacksFiles(properties['level-name']);
      }
      
      setSaving(false);
      showSuccess(t('server.settings.saveSuccess') || 'Settings saved successfully');
    } catch (error) {
      showError(t('server.settings.saveError') || 'Failed to save settings');
      setSaving(false);
    }
  };

  const renderPropertyField = (propertyConfig) => {
    const value = properties[propertyConfig.key] || '';
    
    switch (propertyConfig.type) {
      case 'text':
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handlePropertyChange(propertyConfig.key, e.target.value)}
            placeholder={propertyConfig.placeholder || ''}
          />
        );
      
      case 'textarea':
        return (
          <TextArea
            value={value}
            onChange={(e) => handlePropertyChange(propertyConfig.key, e.target.value)}
            placeholder={propertyConfig.placeholder || ''}
            rows={3}
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handlePropertyChange(propertyConfig.key, e.target.value)}
            min={propertyConfig.min}
            max={propertyConfig.max}
            step={propertyConfig.step || 1}
          />
        );
      
      case 'checkbox':
        return (
          <CheckboxLabel>
            <Checkbox
              type="checkbox"
              checked={value === 'true'}
              onChange={(e) => handlePropertyChange(propertyConfig.key, e.target.checked ? 'true' : 'false')}
            />
            {propertyConfig.description}
          </CheckboxLabel>
        );
      
      case 'select':
        return (
          <Select
            value={value}
            onChange={(e) => handlePropertyChange(propertyConfig.key, e.target.value)}
          >
            {propertyConfig.options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        );
      
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handlePropertyChange(propertyConfig.key, e.target.value)}
          />
        );
    }
  };

  const renderPropertiesSection = (sectionKey, sectionTitle, icon) => {
    const config = server?.type === 'java' ? javaPropertiesConfig : bedrockPropertiesConfig;
    const sectionProperties = config[sectionKey] || [];
    
    if (sectionProperties.length === 0) return null;

    return (
      <Section>
        <SectionTitle>
          {icon} {sectionTitle}
        </SectionTitle>
        {sectionProperties.map(prop => (
          <FormGroup key={prop.key}>
            {prop.type !== 'checkbox' && (
              <>
                <Label>{prop.label}</Label>
                {renderPropertyField(prop)}
                {prop.description && (
                  <Description>{prop.description}</Description>
                )}
              </>
            )}
            {prop.type === 'checkbox' && renderPropertyField(prop)}
          </FormGroup>
        ))}
      </Section>
    );
  };

  const renderTabContent = () => {
    if (!server) return null;

    const isJava = server.type === 'java';
    const isBedrock = server.type === 'bedrock';

    switch (activeTab) {
      case 'general':
        return renderPropertiesSection('general', 'General Settings', <FiServer />);
      
      case 'game':
        return renderPropertiesSection('game', 'Game Settings', <FiUsers />);
      
      case 'world':
        return renderPropertiesSection('world', 'World Settings', <FiMap />);
      
      case 'performance':
        return renderPropertiesSection('performance', 'Performance Settings', <FiCpu />);
      
      case 'security':
        return renderPropertiesSection('security', 'Security Settings', <FiShield />);
      
      case 'network':
        return renderPropertiesSection('network', 'Network Settings', <LuNetwork />);
      
      case 'chat':
        return renderPropertiesSection('chat', 'Chat Settings', <FiMessageSquare />);
      
      case 'resourcepacks':
        return renderPropertiesSection('resourcepacks', 'Resource Pack Settings', <FiDownload />);
      
      case 'features':
        return renderPropertiesSection('features', 'Server Features', <FiLayers />);
      
      case 'advanced':
        return renderPropertiesSection('advanced', 'Advanced Settings', <FiCode />);

      case 'bedrock-worlds':
        if (!isBedrock) return null;
        return (
          <Section>
            <SectionHeader>
              <SectionTitle>
                <FiGlobe /> Bedrock Worlds
              </SectionTitle>
              <RefreshButton onClick={fetchWorlds} disabled={loadingWorlds}>
                <FiRefreshCw /> Refresh
              </RefreshButton>
            </SectionHeader>
            
            {loadingWorlds ? (
              <div>Loading worlds...</div>
            ) : worlds.length === 0 ? (
              <div>
                No Bedrock worlds found in the server directory.
                <br />
                Worlds will appear here once you create them in the server's main folder.
              </div>
            ) : (
              <WorldList>
                {worlds.map(world => (
                  <WorldItem
                    key={world.name}
                    $active={world.name === (properties['level-name'] || 'Bedrock level')}
                    onClick={() => handleWorldChange(world.name)}
                  >
                    <WorldName>{world.name}</WorldName>
                    <WorldPath>/{world.path}</WorldPath>
                    {world.name === (properties['level-name'] || 'Bedrock level') && (
                      <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '5px' }}>
                        ✓ Active World
                      </div>
                    )}
                  </WorldItem>
                ))}
              </WorldList>
            )}
            
            <Description>
              Select a world to make it active. The server will use this world when starting. 
              Changing worlds will automatically update the world pack files with installed addons.
            </Description>
          </Section>
        );

      default:
        return null;
    }
  };

  const getTabs = () => {
    if (server?.type === 'bedrock') {
      // Dla Bedrock używamy prostszego zestawu zakładek
      return [
        { id: 'general', label: 'General', icon: <FiServer /> },
        { id: 'game', label: 'Game', icon: <FiUsers /> },
        { id: 'world', label: 'World', icon: <FiMap /> },
        { id: 'bedrock-worlds', label: 'Bedrock Worlds', icon: <FiGlobe /> },
        { id: 'performance', label: 'Performance', icon: <FiCpu /> },
        { id: 'security', label: 'Security', icon: <FiShield /> },
        { id: 'advanced', label: 'Advanced', icon: <FiCode /> },
      ];
    }

    // Dla Java używamy pełnego zestawu zakładek
    return [
      { id: 'general', label: 'General', icon: <FiServer /> },
      { id: 'game', label: 'Game', icon: <FiUsers /> },
      { id: 'world', label: 'World', icon: <FiMap /> },
      { id: 'performance', label: 'Performance', icon: <FiCpu /> },
      { id: 'security', label: 'Security', icon: <FiShield /> },
      { id: 'network', label: 'Network', icon: <LuNetwork /> },
      { id: 'chat', label: 'Chat', icon: <FiMessageSquare /> },
      { id: 'resourcepacks', label: 'Resource Packs', icon: <FiDownload /> },
      { id: 'features', label: 'Features', icon: <FiLayers /> },
      { id: 'advanced', label: 'Advanced', icon: <FiCode /> },
    ];
  };

  if (loading) {
    return <Container>Loading settings...</Container>;
  }

  return (
    <Container>
      <NavTabs>
        <NavTab 
          $active={false} 
          onClick={() => navigate(`/servers/${serverId}`)}
        >
          <FiActivity /> {t('page.dashboard') || 'Overview'}
        </NavTab>
        <NavTab 
          $active={false} 
          onClick={() => navigate(`/servers/${serverId}/console`)}
        >
          <FiTerminal /> {t('nav.console') || 'Console'}
        </NavTab>
        <NavTab 
          $active={false} 
          onClick={() => navigate(`/servers/${serverId}/files`)}
        >
          <FiFolder /> {t('page.files') || 'Files'}
        </NavTab>
        <NavTab 
          $active={true}
        >
          <FiSettings /> {t('page.server.settings') || 'Config'}
        </NavTab>
        <NavTab 
          $active={false} 
          onClick={() => navigate(`/servers/${serverId}/plugins`)}
        >
          <FiBox /> {t('nav.plugins') || 'Plugins'}
        </NavTab>
        <NavTab 
          $active={false} 
          onClick={() => navigate(`/servers/${serverId}/users`)}
        >
          <FiUser /> {t('nav.users') || 'Users'}
        </NavTab>
        
         <NavTab 
          $active={false} 
          onClick={() => navigate(`/servers/${serverId}/backups`)}
        >
          <FiDownload /> {t('page.backups') || 'Backups'}
          </NavTab>
      </NavTabs>

      <Header>
        <Title>
          <FiSettings /> {t('page.server.settings') || 'Settings'} - {server?.name} ({server?.type?.toUpperCase()})
        </Title>
      </Header>

      <Tabs>
        {getTabs().map(tab => (
          <Tab
            key={tab.id}
            $active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon} {tab.label}
          </Tab>
        ))}
      </Tabs>

      <Content>
        {renderTabContent()}
        
        <ButtonGroup>
          <CancelButton onClick={() => navigate(`/servers/${serverId}`)}>
            {t('common.cancel') || 'Cancel'}
          </CancelButton>
          <SaveButton onClick={handleSave} disabled={saving || !hasPermission}>
            <FiSave /> {saving ? (t('common.saving') || 'Saving...') : (t('common.save') || 'Save Settings')}
          </SaveButton>
        </ButtonGroup>
      </Content>
    </Container>
  );
}

export default Settings;
