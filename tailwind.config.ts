import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // shadcn/ui color system using CSS variables
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
        // University (Uni) brand colors - Corporate Design: burgundy #AC0634
        'hit-uni': {
          50: '#fdf2f4',
          100: '#fbe5e9',
          200: '#f7ced6',
          300: '#f0a4b4',
          400: '#e6708b',
          500: '#AC0634', // Primary Uni burgundy (Pantone 201)
          600: '#96052d',
          700: '#7a0425',
          800: '#5e031c',
          900: '#420213',
        },
        // Hochschule brand colors - Corporate Design: cyan blue #009EE3
        'hit-hs': {
          50: '#e6f5fd',
          100: '#ccebfb',
          200: '#99d7f7',
          300: '#66c3f3',
          400: '#33afef',
          500: '#009EE3', // Primary HS cyan blue (Process Cyan C)
          600: '#007eb6',
          700: '#005f88',
          800: '#003f5b',
          900: '#00202d',
        },
        // Uni secondary color - gold #FBB900
        'hit-uni-gold': {
          50: '#fef9e6',
          100: '#fef3cc',
          200: '#fde799',
          300: '#fcdb66',
          400: '#fbca33',
          500: '#FBB900', // Uni gold (Pantone 137)
          600: '#c99400',
          700: '#966f00',
          800: '#644a00',
          900: '#322500',
        },
        // HS secondary grays from CD Manual
        'hit-hs-gray': {
          light: '#CBCCCC',  // Cool Gray 6C
          DEFAULT: '#8B8C8E', // Cool Gray 9C
          dark: '#5E5E5D',   // Cool Gray 11C
        },
        // Störer accent colors from CD Manual
        'hit-stoerer': {
          1: '#273c49',
          2: '#465765',
          3: '#707B86',
          4: '#8B8C8E',
        },
        // Accent/success colors
        'hit-accent': {
          50: '#e6f7ed',
          100: '#ccefdb',
          200: '#99dfb8',
          300: '#66cf94',
          400: '#33bf71',
          500: '#00A651', // Success green
          600: '#008541',
          700: '#006431',
          800: '#004221',
          900: '#002110',
        },
        // Neutral colors for UI
        'hit-gray': {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'hit': '0 4px 6px -1px rgba(172, 6, 52, 0.1), 0 2px 4px -1px rgba(172, 6, 52, 0.06)',
        'hit-lg': '0 10px 15px -3px rgba(172, 6, 52, 0.1), 0 4px 6px -2px rgba(172, 6, 52, 0.05)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-hit': 'linear-gradient(135deg, #AC0634 0%, #009EE3 100%)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
export default config
