/* eslint-disable */
// --- Dimensions & Layout ---
const VAL_TERMINAL_COLS = 120;
const VAL_TERMINAL_ROWS = 32;
export const DEFAULT_TERMINAL_COLS = VAL_TERMINAL_COLS;
export const DEFAULT_TERMINAL_ROWS = VAL_TERMINAL_ROWS;

// --- Theme & Appearance ---
const STR_THEME_LIGHT = 'light';
const STR_THEME_DARK = 'dark';
export const THEME_LIGHT = STR_THEME_LIGHT;
export const THEME_DARK = STR_THEME_DARK;

const STR_COLOR_WHITE = '#ffffff';
const STR_COLOR_ZINC_950 = '#09090b';
const STR_COLOR_ZINC_900 = '#18181b';
const STR_COLOR_BLUE_GRAY_900 = '#111827';

export const COLORS = {
  WHITE: STR_COLOR_WHITE,
  ZINC_950: STR_COLOR_ZINC_950,
  ZINC_900: STR_COLOR_ZINC_900,
  BLUE_GRAY_900: STR_COLOR_BLUE_GRAY_900,
} as const;

export const TERMINAL_BG_LIGHT = STR_COLOR_WHITE;
export const TERMINAL_BG_DARK = STR_COLOR_ZINC_950;

const STR_FILTER_INVERT = 'invert(1) hue-rotate(180deg) brightness(1.1) contrast(1.05)';
export const FILTER_INVERT = STR_FILTER_INVERT;

const STR_CSS_TERMINAL_PANE = 'terminal-pane flex h-full w-full';
const STR_UI_BG_GRAY_800 = 'bg-gray-800';
const STR_UI_BG_WHITE = 'bg-white';
const STR_UI_ROTATE_180 = 'rotate-180';

export const CSS_TERMINAL_PANE = STR_CSS_TERMINAL_PANE;
export const UI_BG_GRAY_800 = STR_UI_BG_GRAY_800;
export const UI_BG_WHITE = STR_UI_BG_WHITE;
export const UI_ROTATE_180 = STR_UI_ROTATE_180;

// --- Workspace Status ---
const STR_STATUS_ACTIVE = 'active';
const STR_STATUS_IDLE = 'idle';
const STR_STATUS_RUNNING = 'running';

export const WORKSPACE_STATUS = {
  ACTIVE: STR_STATUS_ACTIVE,
  IDLE: STR_STATUS_IDLE,
  RUNNING: STR_STATUS_RUNNING,
} as const;

// --- Container Status ---
const STR_CONTAINER_STARTING = 'starting';
const STR_CONTAINER_BUILDING = 'building';
const STR_CONTAINER_READY = 'ready';

export const CONTAINER_STATUS_STARTING = STR_CONTAINER_STARTING;
export const CONTAINER_STATUS_BUILDING = STR_CONTAINER_BUILDING;
export const CONTAINER_STATUS_READY = STR_CONTAINER_READY;

// --- Providers ---
const STR_PROV_CHARM = 'charm';
const STR_PROV_CODEX = 'codex';
const STR_PROV_QWEN = 'qwen';
const STR_PROV_CLAUDE = 'claude';
const STR_PROV_DROID = 'droid';
const STR_PROV_GEMINI = 'gemini';
const STR_PROV_CURSOR = 'cursor';
const STR_PROV_COPILOT = 'copilot';
const STR_PROV_AMP = 'amp';
const STR_PROV_OPENCODE = 'opencode';
const STR_PROV_AUGGIE = 'auggie';
const STR_PROV_KIMI = 'kimi';
const STR_PROV_KIRO = 'kiro';
const STR_PROV_ROVO = 'rovo';

export const PROVIDER_CHARM = STR_PROV_CHARM;
export const PROVIDER_CODEX = STR_PROV_CODEX;
export const PROVIDER_QWEN = STR_PROV_QWEN;
export const PROVIDER_CLAUDE = STR_PROV_CLAUDE;
export const PROVIDER_DROID = STR_PROV_DROID;
export const PROVIDER_GEMINI = STR_PROV_GEMINI;
export const PROVIDER_CURSOR = STR_PROV_CURSOR;
export const PROVIDER_COPILOT = STR_PROV_COPILOT;
export const PROVIDER_AMP = STR_PROV_AMP;
export const PROVIDER_OPENCODE = STR_PROV_OPENCODE;
export const PROVIDER_AUGGIE = STR_PROV_AUGGIE;
export const PROVIDER_KIMI = STR_PROV_KIMI;
export const PROVIDER_KIRO = STR_PROV_KIRO;
export const PROVIDER_ROVO = STR_PROV_ROVO;

// --- Ports ---
const VAL_PORT_80 = 80;
const VAL_PORT_443 = 443;
const VAL_PORT_3000 = 3000;
const VAL_PORT_5173 = 5173;
const VAL_PORT_8080 = 8080;
const VAL_PORT_8000 = 8000;
export const WEB_PORTS = [
  VAL_PORT_80,
  VAL_PORT_443,
  VAL_PORT_3000,
  VAL_PORT_5173,
  VAL_PORT_8080,
  VAL_PORT_8000,
];

const VAL_PORT_5432 = 5432;
const VAL_PORT_3306 = 3306;
const VAL_PORT_27017 = 27017;
const VAL_PORT_1433 = 1433;
const VAL_PORT_1521 = 1521;
export const DB_PORTS = [
  VAL_PORT_5432,
  VAL_PORT_3306,
  VAL_PORT_27017,
  VAL_PORT_1433,
  VAL_PORT_1521,
];

// --- Animation ---
const VAL_ANIM_DURATION = 0.18;
const VAL_ANIM_EASE_1 = 0.22;
const VAL_ANIM_EASE_2 = 1;
const VAL_ANIM_EASE_3 = 0.36;
const VAL_ANIM_EASE_4 = 1;
const VAL_ANIM_PADDING_TOP = 8;

export const ANIMATION_DURATION = VAL_ANIM_DURATION;
export const ANIMATION_EASE = [
  VAL_ANIM_EASE_1,
  VAL_ANIM_EASE_2,
  VAL_ANIM_EASE_3,
  VAL_ANIM_EASE_4,
];
export const ANIMATION_PADDING_TOP = VAL_ANIM_PADDING_TOP;

// --- Limits & Delays ---
const VAL_MAX_DESC_LEN = 1500;
const VAL_AUTO_START_DELAY = 1200;
export const MAX_ISSUE_DESCRIPTION_LENGTH = VAL_MAX_DESC_LEN;
export const AUTO_START_DELAY_MS = VAL_AUTO_START_DELAY;

// --- Messages & Labels ---
const STR_MSG_TERM_DROP_FAIL = 'Terminal drop failed';
const STR_LBL_NEW_TERM = 'New terminal';
const STR_BTN_TYPE = 'button';
const STR_MSG_PLAN_CHANGE = '[plan] state changed';
const STR_MSG_INSTALL_FAIL = 'Failed to run install command';
const STR_MSG_PROV_REFRESH_FAIL = 'Provider status refresh failed';
const STR_MSG_PROV_LOAD_FAIL = 'Provider status load failed';
const STR_MSG_PROV_MISSING_FAIL = 'Provider status refresh (missing entry) failed';
const STR_MSG_PLAN_APPROVED = 'Plan approved via UI; exiting Plan Mode';
const STR_MSG_ISSUE_DESC = 'Issue Description:';
const STR_UI_PREVIEW_EXT = 'Open preview (external)';
const STR_UI_PREVIEW = 'Open preview';
const STR_UI_IN_APP = 'Open in app';
const STR_UI_PREVIEW_IN_APP = 'Open preview (in‑app)';

export const MSG_TERMINAL_DROP_FAILED = STR_MSG_TERM_DROP_FAIL;
export const ARIA_LABEL_NEW_TERMINAL = STR_LBL_NEW_TERM;
export const BUTTON_TYPE_BUTTON = STR_BTN_TYPE;
export const MSG_PLAN_STATE_CHANGED = STR_MSG_PLAN_CHANGE;
export const MSG_INSTALL_CMD_FAILED = STR_MSG_INSTALL_FAIL;
export const MSG_PROVIDER_REFRESH_FAILED = STR_MSG_PROV_REFRESH_FAIL;
export const MSG_PROVIDER_LOAD_FAILED = STR_MSG_PROV_LOAD_FAIL;
export const MSG_PROVIDER_MISSING_FAILED = STR_MSG_PROV_MISSING_FAIL;
export const MSG_PLAN_APPROVED = STR_MSG_PLAN_APPROVED;
export const MSG_ISSUE_DESCRIPTION = STR_MSG_ISSUE_DESC;
export const UI_OPEN_PREVIEW_EXTERNAL = STR_UI_PREVIEW_EXT;
export const UI_OPEN_PREVIEW = STR_UI_PREVIEW;
export const UI_OPEN_IN_APP = STR_UI_IN_APP;
export const UI_OPEN_PREVIEW_IN_APP = STR_UI_PREVIEW_IN_APP;

// --- Misc ---
export const TYPE_STRING = 'string';
export const BOOL_TRUE_STRING = 'true';
export const ARIA_HIDDEN_TRUE = BOOL_TRUE_STRING;
export const CSS_TRANSPARENT = 'transparent';
export const CSS_IMPORTANT = 'important';

// --- Diff Modal ---
export const DIFF_CHUNK_SIZE_KB = 512;
export const BYTES_PER_KB = 1024;
export const MODAL_ANIM_DURATION_OUT = 0.12;
export const MODAL_ANIM_DURATION_IN = 0.2;
export const MODAL_INIT_Y = 8;
export const MODAL_EXIT_Y = 6;
export const MODAL_SCALE = 0.995;

export const DIFF_TYPE_ADD = 'add';
export const DIFF_TYPE_DEL = 'del';
export const DIFF_TYPE_CONTEXT = 'context';
export const DIFF_TYPE_DIFF = 'diff';

export const CSS_DIFF_ADD = 'bg-emerald-50 dark:bg-emerald-900/30';
export const CSS_DIFF_DEL = 'bg-rose-50 dark:bg-rose-900/30';
export const CSS_DIFF_TRANSPARENT = 'bg-transparent';

export const EVENT_CHANGE = 'change';
export const EVENT_SCROLL = 'scroll';
export const TAG_DIV = 'div';
export const TAG_CODE = 'code';
export const TAG_STYLE = 'style';

export const MSG_FILE_READ_FAIL = 'Failed to read file.';
export const MSG_FILE_TOO_LARGE = 'File Too Large';
export const MSG_INLINE_EDIT_LIMIT = 'Inline editing limited to ~500KB.';
export const MSG_CANNOT_EDIT = 'Cannot Edit';
export const MSG_DISCARD_CHANGES = 'Discard unsaved changes?';
export const MSG_DISCARD_EDIT_EXIT = 'Discard unsaved changes and exit edit?';
export const MSG_SAVE_FAILED = 'Save failed';
export const MSG_UNABLE_TO_SAVE = 'Unable to save file';
export const MSG_SAVED = 'Saved';

export const TITLE_EDIT = 'Edit right side';
export const TITLE_SAVE = 'Save (⌘/Ctrl+S)';
export const TITLE_DISCARD = 'Discard local edits';

export const ARIA_DIALOG = 'dialog';
export const ARIA_COLLAPSE = 'Collapse';
export const ARIA_EXPAND = 'Expand';

export const KEY_ESCAPE = 'Escape';
export const KEY_S = 's';

export const COLOR_CARET_DARK = '#f3f4f6';
