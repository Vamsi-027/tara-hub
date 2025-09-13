import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../components/**/*.{js,ts,jsx,tsx,mdx}', // Include shared components
  ],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['var(--font-inter)', 'system-ui', 'sans-serif'],
        'sans': ['var(--font-inter)', 'system-ui', 'sans-serif'], // Default
      },
      fontSize: {
        'display-xl': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-lg': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-md': ['3rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'display-sm': ['2.25rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
      },
      colors: {
        // Luxury Brand Colors - Custom Fabric Designs
        navy: {
          50: '#F0F4F8',
          100: '#D6E3F0',
          200: '#A8C4E0',
          300: '#7AA5D1',
          400: '#4C86C1',
          500: '#1E67B2',
          600: '#164B82',
          700: '#0F3A63',
          800: '#0B2545', // Primary navy - luxury deep navy blue
          900: '#061524',
        },
        // Brand Primary Colors
        charcoal: {
          50: '#F8F8F8',
          100: '#F1F1F1',
          200: '#E1E1E1',
          300: '#C1C1C1',
          400: '#9E9E9E',
          500: '#6B6B6B',
          600: '#4A4A4A',
          700: '#353535',
          800: '#2C2C2C', // Primary dark
          900: '#1F1F1F',
        },
        gold: {
          50: '#FFFEF9',
          100: '#FEFCF1',
          200: '#FDF7E0',
          300: '#FCF2CE',
          400: '#FAEBBA',
          500: '#F8E4A5',
          600: '#E6D191',
          700: '#D4BE7D',
          800: '#C9A646', // Primary gold - subtle gold accent
          900: '#A08539',
        },
        warm: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#EEEEEE',
          300: '#E5E5E5', // Primary warm grey
          400: '#DADADA',
          500: '#CCCCCC',
          600: '#B8B8B8',
          700: '#A3A3A3',
          800: '#8E8E8E',
          900: '#7A7A7A',
        },
        champagne: {
          50: '#FEFDFB',
          100: '#FDF9F2',
          200: '#FAF2E5',
          300: '#F7F3E9', // Primary champagne
          400: '#F0E5D0',
          500: '#E8D5B7',
          600: '#D4B896',
          700: '#C4A676',
          800: '#B39654',
          900: '#8B7340',
        },
        burgundy: {
          50: '#FDF2F4',
          100: '#FCE7EA',
          200: '#F9C2C9',
          300: '#F59CA8',
          400: '#E85A70',
          500: '#C23850',
          600: '#8B2635', // Primary burgundy
          700: '#6B1E2A',
          800: '#4A161E',
          900: '#2E0D12',
        },
        pearl: {
          50: '#FDFCFC',
          100: '#F8F8F6', // Primary pearl
          200: '#F3F3F1',
          300: '#EEEEEC',
          400: '#E5E5E3',
          500: '#DCDCD9',
          600: '#C5C5C2',
          700: '#A8A8A5',
          800: '#8B8B88',
          900: '#6E6E6B',
        },
        // Supporting Colors
        forest: {
          500: '#2D5738',
          600: '#1F3A26',
        },
        dustyRose: {
          300: '#D4A5A5',
          400: '#C99494',
        },
        
        // Enhanced shadcn colors for luxury feel
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
        '34': '8.5rem',
        '38': '9.5rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        'luxury': '0 10px 30px -5px rgba(44, 44, 44, 0.1), 0 4px 6px -2px rgba(44, 44, 44, 0.05)',
        'luxury-lg': '0 25px 50px -12px rgba(44, 44, 44, 0.25), 0 8px 16px -4px rgba(44, 44, 44, 0.1)',
        'luxury-inner': 'inset 0 2px 4px 0 rgba(44, 44, 44, 0.05)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
        'fade-in-scale': 'fadeInScale 0.6s ease-out forwards',
        'shimmer': 'shimmer 2s linear infinite',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      keyframes: {
        fadeInUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        fadeInScale: {
          '0%': {
            opacity: '0',
            transform: 'scale(0.95)',
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
        shimmer: {
          '0%': {
            backgroundPosition: '-200% 0',
          },
          '100%': {
            backgroundPosition: '200% 0',
          },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
    },
  },
  plugins: [],
}

export default config