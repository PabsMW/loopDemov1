# Loop Demo Project

A modern React demo showcasing **React**, **Tailwind CSS v4.1.11**, and **Framer Motion** with Atomic Design architecture.

## 🚀 Tech Stack

- **React 19** - UI library
- **Tailwind CSS v4.1.11** - Utility-first CSS framework
- **Framer Motion** - Production-ready animation library
- **Vite** - Next generation frontend tooling

## 📁 Project Structure (Atomic Design)

```
src/
├── components/
│   ├── atoms/          # Basic building blocks (Button, Input, etc.)
│   ├── molecules/      # Simple combinations of atoms
│   ├── organisms/      # Complex UI components
│   └── templates/      # Page-level layouts
├── pages/              # Full page components
│   └── DemoPage.jsx
├── index.css          # Tailwind imports and global styles
└── main.jsx           # App entry point
```

## 🎯 Features

- **Animated Button** - Click to see it spin 2 full rotations and scale up
- **Responsive Design** - Works on all screen sizes
- **Modern UI** - Beautiful gradient backgrounds and glass-morphism effects
- **Interactive Animations** - Smooth transitions powered by Framer Motion

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📦 Atomic Design Principles

- **Atoms**: Basic building blocks like buttons, inputs (e.g., `Button.jsx`)
- **Molecules**: Simple groups of atoms (e.g., form fields with labels)
- **Organisms**: Complex components made of molecules (e.g., navigation bars)
- **Templates**: Page layouts defining content placement
- **Pages**: Specific instances of templates with real content

## 🎨 Button Demo

The button demonstrates:
- ✅ Tailwind CSS v4 styling with gradient backgrounds
- ✅ Framer Motion `whileTap` animation
- ✅ 720° rotation (2 full spins)
- ✅ Scale transformation
- ✅ Smooth easing curves

## 📝 Notes

- Uses npm as package manager
- Configured with ESLint for code quality
- Vite for fast HMR and optimized builds
