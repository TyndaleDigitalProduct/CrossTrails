import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // CrossTrails brand colors from Figma design
        primary: {
          50: '#fef7f0',
          100: '#feeee0',
          200: '#fcd9c1',
          300: '#f9ba96',
          400: '#f59169',
          500: '#f26b3c', // Main coral/orange accent
          600: '#e04e1f',
          700: '#ba3b14',
          800: '#943217',
          900: '#782d16',
        },
        text: {
          primary: '#1a1a1a',    // Dark gray for main text
          secondary: '#666666',   // Medium gray for verse numbers
          muted: '#999999',       // Light gray for instructions
        },
        background: {
          primary: '#ffffff',     // Clean white background
          secondary: '#fafafa',   // Slightly off-white for sidebar
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'ui-serif', 'serif'], // For Bible text readability
      },
      fontSize: {
        'bible': ['18px', { lineHeight: '1.7' }],    // Optimal for Bible reading
        'verse-number': ['14px', { lineHeight: '1.5' }],
        'reference': ['15px', { lineHeight: '1.6' }],
      },
      spacing: {
        '18': '4.5rem',   // Custom spacing for layout
        '22': '5.5rem',
      },
      maxWidth: {
        'bible': '45rem',     // Optimal line length for reading
        'sidebar': '20rem',   // Cross-reference sidebar width
      },
      screens: {
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      }
    },
  },
  plugins: [],
}

export default config