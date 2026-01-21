// Feature Flags & Global Configuration
export const CONFIG = {
  METADATA_PROVIDER: (import.meta.env.VITE_METADATA_PROVIDER || 'none') as 'uof' | 'genius' | 'none',
  
  OPTICODDS: {
    API_KEY: import.meta.env.VITE_OPTICODDS_API_KEY || '',
    BASE_URL: import.meta.env.VITE_OPTICODDS_BASE_URL || 'https://api.opticodds.com/api/v3',
    POLL_INTERVAL_PRE: 60000, // 60s
    POLL_INTERVAL_LIVE: 10000, // 10s
  },

  DEFAULTS: {
    ROI_MIN: 0.008, // 0.8%
    FRESHNESS_LIVE_SEC: 15,
    FRESHNESS_PRE_SEC: 120,
    COOLDOWN_SEC: 45,
  }
};

export const IS_DEMO_MODE = !CONFIG.OPTICODDS.API_KEY; // If no key, run in Simulation Mode
