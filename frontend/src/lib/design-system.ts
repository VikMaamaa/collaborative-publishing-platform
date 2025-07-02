// Design System Configuration
export const designSystem = {
  colors: {
    // Primary Colors
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    // Secondary Colors
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    // Success Colors
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    // Warning Colors
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    // Error Colors
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    // Neutral Colors
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    },
  },

  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
      '6xl': '3.75rem', // 60px
    },
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
    lineHeight: {
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2',
    },
  },

  spacing: {
    px: '1px',
    0: '0',
    0.5: '0.125rem',  // 2px
    1: '0.25rem',     // 4px
    1.5: '0.375rem',  // 6px
    2: '0.5rem',      // 8px
    2.5: '0.625rem',  // 10px
    3: '0.75rem',     // 12px
    3.5: '0.875rem',  // 14px
    4: '1rem',        // 16px
    5: '1.25rem',     // 20px
    6: '1.5rem',      // 24px
    7: '1.75rem',     // 28px
    8: '2rem',        // 32px
    9: '2.25rem',     // 36px
    10: '2.5rem',     // 40px
    12: '3rem',       // 48px
    14: '3.5rem',     // 56px
    16: '4rem',       // 64px
    20: '5rem',       // 80px
    24: '6rem',       // 96px
    28: '7rem',       // 112px
    32: '8rem',       // 128px
    36: '9rem',       // 144px
    40: '10rem',      // 160px
    44: '11rem',      // 176px
    48: '12rem',      // 192px
    52: '13rem',      // 208px
    56: '14rem',      // 224px
    60: '15rem',      // 240px
    64: '16rem',      // 256px
    72: '18rem',      // 288px
    80: '20rem',      // 320px
    96: '24rem',      // 384px
  },

  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
  },

  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    none: 'none',
  },

  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  zIndex: {
    0: '0',
    10: '10',
    20: '20',
    30: '30',
    40: '40',
    50: '50',
    auto: 'auto',
    dropdown: '1000',
    sticky: '1020',
    fixed: '1030',
    modalBackdrop: '1040',
    modal: '1050',
    popover: '1060',
    tooltip: '1070',
  },
};

// Component-specific tokens
export const componentTokens = {
  button: {
    sizes: {
      sm: {
        padding: '0.5rem 1rem',
        fontSize: '0.875rem',
        borderRadius: '0.375rem',
      },
      md: {
        padding: '0.75rem 1.5rem',
        fontSize: '1rem',
        borderRadius: '0.5rem',
      },
      lg: {
        padding: '1rem 2rem',
        fontSize: '1.125rem',
        borderRadius: '0.5rem',
      },
    },
    variants: {
      primary: {
        backgroundColor: designSystem.colors.primary[600],
        color: 'white',
        hover: {
          backgroundColor: designSystem.colors.primary[700],
        },
      },
      secondary: {
        backgroundColor: designSystem.colors.secondary[100],
        color: designSystem.colors.secondary[700],
        hover: {
          backgroundColor: designSystem.colors.secondary[200],
        },
      },
      outline: {
        backgroundColor: 'transparent',
        color: designSystem.colors.primary[600],
        border: `1px solid ${designSystem.colors.primary[600]}`,
        hover: {
          backgroundColor: designSystem.colors.primary[50],
        },
      },
      ghost: {
        backgroundColor: 'transparent',
        color: designSystem.colors.secondary[600],
        hover: {
          backgroundColor: designSystem.colors.secondary[100],
        },
      },
    },
  },

  input: {
    sizes: {
      sm: {
        padding: '0.5rem 0.75rem',
        fontSize: '0.875rem',
        borderRadius: '0.375rem',
      },
      md: {
        padding: '0.75rem 1rem',
        fontSize: '1rem',
        borderRadius: '0.5rem',
      },
      lg: {
        padding: '1rem 1.25rem',
        fontSize: '1.125rem',
        borderRadius: '0.5rem',
      },
    },
    variants: {
      default: {
        border: `1px solid ${designSystem.colors.secondary[300]}`,
        backgroundColor: 'white',
        focus: {
          borderColor: designSystem.colors.primary[500],
          boxShadow: `0 0 0 3px ${designSystem.colors.primary[100]}`,
        },
      },
      error: {
        border: `1px solid ${designSystem.colors.error[500]}`,
        backgroundColor: 'white',
        focus: {
          borderColor: designSystem.colors.error[500],
          boxShadow: `0 0 0 3px ${designSystem.colors.error[100]}`,
        },
      },
    },
  },

  card: {
    padding: '1.5rem',
    backgroundColor: 'white',
    borderRadius: '0.75rem',
    boxShadow: designSystem.shadows.md,
    border: `1px solid ${designSystem.colors.secondary[200]}`,
  },

  badge: {
    sizes: {
      sm: {
        padding: '0.25rem 0.5rem',
        fontSize: '0.75rem',
        borderRadius: '0.25rem',
      },
      md: {
        padding: '0.375rem 0.75rem',
        fontSize: '0.875rem',
        borderRadius: '0.375rem',
      },
      lg: {
        padding: '0.5rem 1rem',
        fontSize: '1rem',
        borderRadius: '0.5rem',
      },
    },
    variants: {
      primary: {
        backgroundColor: designSystem.colors.primary[100],
        color: designSystem.colors.primary[800],
      },
      success: {
        backgroundColor: designSystem.colors.success[100],
        color: designSystem.colors.success[800],
      },
      warning: {
        backgroundColor: designSystem.colors.warning[100],
        color: designSystem.colors.warning[800],
      },
      error: {
        backgroundColor: designSystem.colors.error[100],
        color: designSystem.colors.error[800],
      },
      secondary: {
        backgroundColor: designSystem.colors.secondary[100],
        color: designSystem.colors.secondary[800],
      },
    },
  },
};

export default designSystem; 