import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}"
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				orbitron: ['Orbitron', 'monospace'],
				rubik: ['Rubik', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				neon: {
					yellow: '#FFD700',
					orange: '#FF6B35',
					pink: '#FF2D78',
					cyan: '#00F5FF',
					purple: '#BF5FFF',
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'star-pulse': {
					'0%, 100%': { transform: 'scale(1)', filter: 'drop-shadow(0 0 20px #FFD700)' },
					'50%': { transform: 'scale(1.08)', filter: 'drop-shadow(0 0 40px #FFD700) drop-shadow(0 0 80px #FF6B35)' }
				},
				'star-click': {
					'0%': { transform: 'scale(1)' },
					'30%': { transform: 'scale(0.88)' },
					'60%': { transform: 'scale(1.12)' },
					'100%': { transform: 'scale(1)' }
				},
				'float-up': {
					'0%': { opacity: '1', transform: 'translateY(0) scale(1)' },
					'100%': { opacity: '0', transform: 'translateY(-120px) scale(1.5)' }
				},
				'particle-burst': {
					'0%': { opacity: '1', transform: 'translate(0, 0) scale(1)' },
					'100%': { opacity: '0', transform: 'var(--tx, translate(60px, -60px)) scale(0)' }
				},
				'glow-ring': {
					'0%': { opacity: '0.6', transform: 'scale(0.8)' },
					'100%': { opacity: '0', transform: 'scale(2)' }
				},
				'shimmer': {
					'0%': { backgroundPosition: '-200% center' },
					'100%': { backgroundPosition: '200% center' }
				},
				'bounce-in': {
					'0%': { transform: 'scale(0)', opacity: '0' },
					'60%': { transform: 'scale(1.1)' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				},
				'slide-up': {
					'0%': { transform: 'translateY(20px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				'twinkle': {
					'0%, 100%': { opacity: '0.2', transform: 'scale(0.8)' },
					'50%': { opacity: '1', transform: 'scale(1.2)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'star-pulse': 'star-pulse 2s ease-in-out infinite',
				'star-click': 'star-click 0.3s ease-out',
				'float-up': 'float-up 0.8s ease-out forwards',
				'particle-burst': 'particle-burst 0.6s ease-out forwards',
				'glow-ring': 'glow-ring 0.5s ease-out forwards',
				'shimmer': 'shimmer 2s linear infinite',
				'bounce-in': 'bounce-in 0.4s ease-out',
				'slide-up': 'slide-up 0.3s ease-out',
				'twinkle': 'twinkle 2s ease-in-out infinite',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
