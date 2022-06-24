/** @module constants */

/**
 * The shortened software name
 * @type {string}
 */
export const vtt = "Foundry VTT";

/**
 * The full software name
 * @type {string}
 */
export const VTT = "Foundry Virtual Tabletop";

/**
 * The software website URL
 * @type {string}
 */
export const WEBSITE_URL = "https://foundryvtt.com";

/**
 * An ASCII greeting displayed to the client
 * @type {string}
 */
export const ASCII = `_______________________________________________________________
 _____ ___  _   _ _   _ ____  ______   __ __     _______ _____ 
|  ___/ _ \\| | | | \\ | |  _ \\|  _ \\ \\ / / \\ \\   / |_   _|_   _|
| |_ | | | | | | |  \\| | | | | |_) \\ V /   \\ \\ / /  | |   | |  
|  _|| |_| | |_| | |\\  | |_| |  _ < | |     \\ V /   | |   | |  
|_|   \\___/ \\___/|_| \\_|____/|_| \\_\\|_|      \\_/    |_|   |_|  
===============================================================`;

/**
 * Define the allowed ActiveEffect application modes
 * @enum {number}
 */
export const ACTIVE_EFFECT_MODES = {
  CUSTOM: 0,
  MULTIPLY: 1,
  ADD: 2,
  DOWNGRADE: 3,
  UPGRADE: 4,
  OVERRIDE: 5
};

/**
 * Define the string name used for the base document type when specific sub-types are not defined by the system
 * @type {string}
 */
export const BASE_DOCUMENT_TYPE = "base";

/**
 * Define the methods by which a Card can be drawn from a Cards stack
 * TOP and FIRST are synonymous, as are BOTTOM and LAST.
 * @enum {number}
 */
export const CARD_DRAW_MODES = {
  FIRST: 0,
  TOP: 0,
  LAST: 1,
  BOTTOM: 1,
  RANDOM: 2
}

/**
 * An enumeration of canvas performance modes.
 * @enum {number}
 */
export const CANVAS_PERFORMANCE_MODES = {
  LOW: 0,
  MED: 1,
  HIGH: 2,
  MAX: 3
}

/**
 * Valid Chat Message types
 * @enum {number}
 */
export const CHAT_MESSAGE_TYPES = {
  OTHER: 0,
  OOC: 1,
  IC: 2,
  EMOTE: 3,
  WHISPER: 4,
  ROLL: 5
};

/**
 * Define the set of languages which have built-in support in the core software
 * @type {string[]}
 */
export const CORE_SUPPORTED_LANGUAGES = ["en"];

/**
 * The default artwork used for Token images if none is provided
 * @type {string}
 */
export const DEFAULT_TOKEN = 'icons/svg/mystery-man.svg';

/**
 * The default artwork used for Note placeables if none is provided
 * @type {string}
 * @deprecated since v9, use NoteData.DEFAULT_ICON instead.
 * @ignore
 */
export const DEFAULT_NOTE_ICON = 'icons/svg/book.svg';

/**
 * The default icon image used for Macro documents if no other image is provided
 * @type {string}
 * @deprecated since v9, use MacroData.DEFAULT_ICON instead.
 * @ignore
 */
export const DEFAULT_MACRO_ICON = "icons/svg/dice-target.svg";

/**
 * Define the allowed Document class types.
 * @type {string[]}
 */
export const DOCUMENT_TYPES = [
  "Actor",
  "Cards",
  "ChatMessage",
  "Combat",
  "Item",
  "Folder",
  "JournalEntry",
  "Macro",
  "Playlist",
  "RollTable",
  "Scene",
  "User",
];

/**
 * The allowed Document types which may exist within a Compendium pack.
 * @type {string[]}
 */
export const COMPENDIUM_DOCUMENT_TYPES = DOCUMENT_TYPES.filter(t => {
  const excluded = ["ChatMessage", "Combat", "Folder", "User"];
  return !excluded.includes(t);
}).concat(["Adventure"]);

/**
 * Define the allowed permission levels for a non-user Document.
 * Each level is assigned a value in ascending order. Higher levels grant more permissions.
 * @enum {number}
 */
export const DOCUMENT_PERMISSION_LEVELS = {
  NONE: 0,
  LIMITED: 1,
  OBSERVER: 2,
  OWNER: 3
};

/**
 * Define the allowed Document types which may be dynamically linked in chat
 * @type {string[]}
 */
export const DOCUMENT_LINK_TYPES = ["Actor", "Cards", "Item", "Scene", "JournalEntry", "Macro", "RollTable", "PlaylistSound"];

/**
 * The supported dice roll visibility modes
 * @enum {string}
 */
export const DICE_ROLL_MODES = {
  PUBLIC: "publicroll",
  PRIVATE: "gmroll",
  BLIND: "blindroll",
  SELF: "selfroll"
};

/**
 * The allowed Drawing types which may be saved
 * @enum {string}
 */
export const DRAWING_TYPES = {
  RECTANGLE: "r",
  ELLIPSE: "e",
  TEXT: "t",
  POLYGON: "p",
  FREEHAND: "f"
};

/**
 * The allowed fill types which a Drawing object may display
 * NONE: The drawing is not filled
 * SOLID: The drawing is filled with a solid color
 * PATTERN: The drawing is filled with a tiled image pattern
 * @enum {number}
 */
export const DRAWING_FILL_TYPES = {
  NONE: 0,
  SOLID: 1,
  PATTERN: 2
};

/**
 * Define the allowed Document types which Folders may contain
 * @type {string[]}
 */
export const FOLDER_DOCUMENT_TYPES = ["Actor", "Item", "Scene", "JournalEntry", "Playlist", "RollTable", "Cards", "Macro"];

/**
 * The maximum allowed level of depth for Folder nesting
 * @type {number}
 */
export const FOLDER_MAX_DEPTH = 3;

/**
 * A list of allowed game URL names
 * @type {string[]}
 */
export const GAME_VIEWS = ["game", "stream"];

/**
 * The minimum allowed grid size which is supported by the software
 * @type {number}
 */
export const GRID_MIN_SIZE = 50;

/**
 * The allowed Grid types which are supported by the software
 * @enum {number}
 */
export const GRID_TYPES = {
  GRIDLESS: 0,
  SQUARE: 1,
  HEXODDR: 2,
  HEXEVENR: 3,
  HEXODDQ: 4,
  HEXEVENQ: 5
};

/**
 * A list of supported setup URL names
 * @type {string[]}
 */
export const SETUP_VIEWS = ["license", "setup", "players", "join", "auth"];

/**
 * An Array of valid MacroAction scope values
 * @type {string[]}
 */
export const MACRO_SCOPES = ["global", "actors", "actor"];

/**
 * An enumeration of valid Macro types
 * @enum {string}
 */
export const MACRO_TYPES = {
  SCRIPT: "script",
  CHAT: "chat"
};

/**
 * The allowed playback modes for an audio Playlist
 * DISABLED: The playlist does not play on its own, only individual Sound tracks played as a soundboard
 * SEQUENTIAL: The playlist plays sounds one at a time in sequence
 * SHUFFLE: The playlist plays sounds one at a time in randomized order
 * SIMULTANEOUS: The playlist plays all contained sounds at the same time
 * @enum {number}
 */
export const PLAYLIST_MODES = {
  DISABLED: -1,
  SEQUENTIAL: 0,
  SHUFFLE: 1,
  SIMULTANEOUS: 2
};

/**
 * The available sort modes for an audio Playlist.
 * ALPHABETICAL (default): Sort sounds alphabetically.
 * MANUAL: Sort sounds by manual drag-and-drop.
 * @enum {string}
 */
export const PLAYLIST_SORT_MODES = {
  ALPHABETICAL: "a",
  MANUAL: "m"
};

/**
 * The allowed package types
 * @type {string[]}
 */
export const PACKAGE_TYPES = ["world", "system", "module"];

/**
 * Encode the reasons why a package may be available or unavailable for use
 * @enum {number}
 */
export const PACKAGE_AVAILABILITY_CODES = {
  UNKNOWN: -1,
  AVAILABLE: 0,
  REQUIRES_UPDATE: 1,
  REQUIRES_SYSTEM: 2,
  REQUIRES_DEPENDENCY: 3,
  REQUIRES_CORE: 4
};

/**
 * A safe password string which can be displayed
 * @type {string}
 */
export const PASSWORD_SAFE_STRING = "•".repeat(16);

/**
 * The allowed software update channels
 * @enum {string}
 */
export const SOFTWARE_UPDATE_CHANNELS = {
  stable: "SETUP.UpdateStable",
  testing: "SETUP.UpdateTesting",
  development: "SETUP.UpdateDevelopment",
  prototype: "SETUP.UpdatePrototype"
};

/**
 * The default sorting density for manually ordering child objects within a parent
 * @type {number}
 */
export const SORT_INTEGER_DENSITY = 100000;

/**
 * The allowed types of a TableResult document
 * @enum {number}
 */
const tableResultTypes = {
  TEXT: 0,
  DOCUMENT: 1,
  COMPENDIUM: 2
};

Object.defineProperty(tableResultTypes, "ENTITY", {
  get() {
    console.warn("TABLE_RESULT_TYPES.ENTITY is deprecated. Please use TABLE_RESULT_TYPES.DOCUMENT instead.");
    return tableResultTypes.DOCUMENT;
  }
});

export const TABLE_RESULT_TYPES = tableResultTypes;

/**
 * Define the valid anchor locations for a Tooltip displayed on a Placeable Object
 * @enum {number}
 */
export const TEXT_ANCHOR_POINTS = {
  CENTER: 0,
  BOTTOM: 1,
  TOP: 2,
  LEFT: 3,
  RIGHT: 4
};

/**
 * Define the valid occlusion modes which an overhead tile can use
 * @enum {number}
 */
export const TILE_OCCLUSION_MODES = {
  NONE: 0,
  FADE: 1,
  ROOF: 2,
  RADIAL: 3
}

/**
 * Describe the various thresholds of token control upon which to show certain pieces of information
 * NONE - no information is displayed
 * CONTROL - displayed when the token is controlled
 * OWNER HOVER - displayed when hovered by a GM or a user who owns the actor
 * HOVER - displayed when hovered by any user
 * OWNER - always displayed for a GM or for a user who owns the actor
 * ALWAYS - always displayed for everyone
 * @enum {number}
 */
export const TOKEN_DISPLAY_MODES = {
  NONE: 0,
  CONTROL: 10,
  OWNER_HOVER: 20,
  HOVER: 30,
  OWNER: 40,
  ALWAYS: 50
};

/**
 * The allowed Token disposition types
 * HOSTILE - Displayed as an enemy with a red border
 * NEUTRAL - Displayed as neutral with a yellow border
 * FRIENDLY - Displayed as an ally with a cyan border
 * @enum {number}
 */
export const TOKEN_DISPOSITIONS = {
  HOSTILE: -1,
  NEUTRAL: 0,
  FRIENDLY: 1
};

/**
 * Define the allowed User permission levels.
 * Each level is assigned a value in ascending order. Higher levels grant more permissions.
 * @enum {number}
 */
export const USER_ROLES = {
  NONE: 0,
  PLAYER: 1,
  TRUSTED: 2,
  ASSISTANT: 3,
  GAMEMASTER: 4
};

/**
 * Invert the User Role mapping to recover role names from a role integer
 * @enum {string}
 */
export const USER_ROLE_NAMES = Object.entries(USER_ROLES).reduce((obj, r) => {
  obj[r[1]] = r[0];
  return obj;
}, {});

/**
 * An enumeration of the allowed types for a MeasuredTemplate embedded document
 * @enum {string}
 */
export const MEASURED_TEMPLATE_TYPES = {
  CIRCLE: "circle",
  CONE: "cone",
  RECTANGLE: "rect",
  RAY: "ray"
};

/**
 * @typedef {Object} UserCapability
 * @property {string} label
 * @property {string} hint
 * @property {boolean} disableGM
 * @property {number} defaultRole
 */

/**
 * Define the recognized User capabilities which individual Users or role levels may be permitted to perform
 * @type {Object<UserCapability>}
 */
export const USER_PERMISSIONS = {
  ACTOR_CREATE: {
    label: "PERMISSION.ActorCreate",
		hint: "PERMISSION.ActorCreateHint",
		disableGM: false,
    defaultRole: USER_ROLES.ASSISTANT
  },
  BROADCAST_AUDIO: {
    label: "PERMISSION.BroadcastAudio",
		hint: "PERMISSION.BroadcastAudioHint",
		disableGM: true,
    defaultRole: USER_ROLES.TRUSTED
  },
  BROADCAST_VIDEO: {
    label: "PERMISSION.BroadcastVideo",
		hint: "PERMISSION.BroadcastVideoHint",
		disableGM: true,
    defaultRole: USER_ROLES.TRUSTED
  },
  DRAWING_CREATE: {
    label: "PERMISSION.DrawingCreate",
		hint: "PERMISSION.DrawingCreateHint",
		disableGM: false,
    defaultRole: USER_ROLES.TRUSTED
  },
  ITEM_CREATE: {
    label: "PERMISSION.ItemCreate",
		hint: "PERMISSION.ItemCreateHint",
		disableGM: false,
    defaultRole: USER_ROLES.ASSISTANT
  },
  FILES_BROWSE: {
    label: "PERMISSION.FilesBrowse",
		hint: "PERMISSION.FilesBrowseHint",
		disableGM: false,
    defaultRole: USER_ROLES.TRUSTED
  },
  FILES_UPLOAD: {
    label: "PERMISSION.FilesUpload",
		hint: "PERMISSION.FilesUploadHint",
		disableGM: false,
    defaultRole: USER_ROLES.ASSISTANT
  },
  JOURNAL_CREATE: {
      label: "PERMISSION.JournalCreate",
      hint: "PERMISSION.JournalCreateHint",
      disableGM: false,
      defaultRole: USER_ROLES.TRUSTED
  },
  MACRO_SCRIPT: {
    label: "PERMISSION.MacroScript",
		hint: "PERMISSION.MacroScriptHint",
		disableGM: false,
    defaultRole: USER_ROLES.PLAYER
  },
  MESSAGE_WHISPER: {
    label: "PERMISSION.MessageWhisper",
		hint: "PERMISSION.MessageWhisperHint",
		disableGM: false,
    defaultRole: USER_ROLES.PLAYER
  },
  NOTE_CREATE: {
    label: "PERMISSION.NoteCreate",
    hint: "PERMISSION.NoteCreateHint",
    disableGM: false,
    defaultRole: USER_ROLES.TRUSTED
  },
  SETTINGS_MODIFY: {
    label: "PERMISSION.SettingsModify",
		hint: "PERMISSION.SettingsModifyHint",
		disableGM: false,
    defaultRole: USER_ROLES.ASSISTANT
  },
  SHOW_CURSOR: {
    label: "PERMISSION.ShowCursor",
		hint: "PERMISSION.ShowCursorHint",
		disableGM: true,
    defaultRole: USER_ROLES.PLAYER
  },
  SHOW_RULER: {
    label: "PERMISSION.ShowRuler",
    hint: "PERMISSION.ShowRulerHint",
    disableGM: true,
    defaultRole: USER_ROLES.PLAYER
  },
  TEMPLATE_CREATE: {
    label: "PERMISSION.TemplateCreate",
		hint: "PERMISSION.TemplateCreateHint",
		disableGM: false,
    defaultRole: USER_ROLES.PLAYER
  },
  TOKEN_CREATE: {
    label: "PERMISSION.TokenCreate",
		hint: "PERMISSION.TokenCreateHint",
		disableGM: false,
    defaultRole: USER_ROLES.ASSISTANT
  },
  TOKEN_CONFIGURE: {
    label: "PERMISSION.TokenConfigure",
		hint: "PERMISSION.TokenConfigureHint",
		disableGM: false,
    defaultRole: USER_ROLES.TRUSTED
  },
  WALL_DOORS: {
    label: "PERMISSION.WallDoors",
		hint: "PERMISSION.WallDoorsHint",
		disableGM: false,
    defaultRole: USER_ROLES.PLAYER
  }
};

/**
 * The allowed directions of effect that a Wall can have
 * BOTH: The wall collides from both directions
 * LEFT: The wall collides only when a ray strikes its left side
 * RIGHT: The wall collides only when a ray strikes its right side
 * @enum {number}
 */
export const WALL_DIRECTIONS = {
  BOTH: 0,
  LEFT: 1,
  RIGHT: 2
};

/**
 * The allowed door types which a Wall may contain
 * NONE: The wall does not contain a door
 * DOOR: The wall contains a regular door
 * SECRET: The wall contains a secret door
 * @enum {number}
 */
export const WALL_DOOR_TYPES = {
  NONE: 0,
  DOOR: 1,
  SECRET: 2
};

/**
 * The allowed door states which may describe a Wall that contains a door
 * CLOSED: The door is closed
 * OPEN: The door is open
 * LOCKED: The door is closed and locked
 * @enum {number}
 */
export const WALL_DOOR_STATES = {
  CLOSED: 0,
  OPEN: 1,
  LOCKED: 2
};

/**
 * The wall properties which restrict the way interaction occurs with a specific wall
 * @type {string[]}
 */
export const WALL_RESTRICTION_TYPES = ["light", "sight", "sound", "move"];

/**
 * The types of sensory collision which a Wall may impose
 * NONE: Senses do not collide with this wall
 * NORMAL: Senses collide with this wall
 * LIMITED: Senses collide with the second intersection, bypassing the first
 * @enum {number}
 */
export const WALL_SENSE_TYPES = {
  NONE: 0,
  LIMITED: 10,
  NORMAL: 20
};

/**
 * The types of movement collision which a Wall may impose
 * NONE: Movement does not collide with this wall
 * NORMAL: Movement collides with this wall
 * @enum {number}
 */
export const WALL_MOVEMENT_TYPES = {
  NONE: WALL_SENSE_TYPES.NONE,
  NORMAL: WALL_SENSE_TYPES.NORMAL
};

/**
 * The possible precedence values a Keybinding might run in
 * PRIORITY: Runs in the first group along with other PRIORITY keybindings
 * NORMAL: Runs after the PRIORITY group along with other NORMAL keybindings
 * DEFERRED: Runs in the last group along with other DEFERRED keybindings
 * @enum {number}
 */
export const KEYBINDING_PRECEDENCE = {
  PRIORITY: 0,
  NORMAL: 1,
  DEFERRED: 2
};

/**
 * The allowed set of HTML template extensions
 * @type {string[]}
 */
export const HTML_FILE_EXTENSIONS = ["html", "handlebars", "hbs"];

/**
 * The supported file extensions for image-type files, and their corresponding mime types.
 * @type {Object<string, string>}
 */
export const IMAGE_FILE_EXTENSIONS = {
  apng: "image/apng",
  avif: "image/avif",
  bmp: "image/bmp",
  gif: "image/gif",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  svg: "image/svg+xml",
  tiff: "image/tiff",
  webp: "image/webp"
};

/**
 * The supported file extensions for video-type files, and their corresponding mime types.
 * @type {Object<string, string>}
 */
export const VIDEO_FILE_EXTENSIONS = {
  m4v: "video/mp4",
  mp4: "video/mp4",
  ogg: "video/ogg",
  webm: "video/webm"
};

/**
 * The supported file extensions for audio-type files, and their corresponding mime types.
 * @type {Object<string, string>}
 */
export const AUDIO_FILE_EXTENSIONS = {
  aac: "audio/aac",
  flac: "audio/flac",
  m4a: "audio/mp4",
  mid: "audio/midi",
  mp3: "audio/mpeg",
  ogg: "audio/ogg",
  opus: "audio/opus",
  wav: "audio/wav",
  webm: "audio/webm"
};

/**
 * The supported file extensions for text files, and their corresponding mime types.
 * @type {Object<string, string>}
 */
export const TEXT_FILE_EXTENSIONS = {
  json: "application/json",
  md: "text/markdown",
  pdf: "application/pdf",
  txt: "text/plain",
  xml: "application/xml"
};

/**
 * A list of MIME types which are treated as uploaded "media", which are allowed to overwrite existing files.
 * Any non-media MIME type is not allowed to replace an existing file.
 * @type {string[]}
 */
export const MEDIA_MIME_TYPES = [
  IMAGE_FILE_EXTENSIONS,
  VIDEO_FILE_EXTENSIONS,
  AUDIO_FILE_EXTENSIONS,
  TEXT_FILE_EXTENSIONS
].flatMap(extensions => Object.values(extensions));

/**
 * Stores shared commonly used timeouts, measured in MS
 * @enum {number}
 */
export const TIMEOUTS = {
  FOUNDRY_WEBSITE: 10000,
  PACKAGE_REPOSITORY: 5000,
  IP_DISCOVERY: 5000
}

/* ---------------------------------------- */
/*  Deprecations                            */
/* ---------------------------------------- */

/**
 * Enumerate the source types which can be used for an AmbientLight placeable object
 * @deprecated since v9
 * @enum {string}
 */
export const SOURCE_TYPES = {
  LOCAL: "l",
  GLOBAL: "g",
  UNIVERSAL: "u"
};

/**
 * Define the allowed Entity class types
 * @type {string[]}
 * @deprecated since v9 - use CONST.DOCUMENT_TYPES instead.
 */
export const ENTITY_TYPES = DOCUMENT_TYPES;

/**
 * Define the allowed Document types which Folders may contain
 * @type {string[]}
 * @deprecated since v9 - use CONST.FOLDER_DOCUMENT_TYPES instead.
 */
export const FOLDER_ENTITY_TYPES = FOLDER_DOCUMENT_TYPES;

/**
 * Define the allowed permission levels for a non-user Entity.
 * Each level is assigned a value in ascending order. Higher levels grant more permissions.
 * @enum {number}
 * @deprecated since v9 - use CONST.DOCUMENT_PERMISSION_LEVELS instead.
 */
export const ENTITY_PERMISSIONS = DOCUMENT_PERMISSION_LEVELS;

/**
 * Define the allowed Entity types which may be dynamically linked in chat
 * @type {string[]}
 * @deprecated since v9 - use CONST.DOCUMENT_LINK_TYPES instead.
 */
export const ENTITY_LINK_TYPES = DOCUMENT_LINK_TYPES;

/**
 * The allowed Entity types which may exist within a Compendium pack
 * This is a subset of ENTITY_TYPES
 * @type {string[]}
 */
export const COMPENDIUM_ENTITY_TYPES = COMPENDIUM_DOCUMENT_TYPES;
