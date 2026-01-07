# FABKIT

> **Your Flesh and Blood Toolbox**

[![License: BSD 3-Clause](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](LICENSE.md)
[![Built with Vue](https://img.shields.io/badge/Built%20with-Vue%203-4FC08D.svg)](https://vuejs.org/)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-fabkit.github.io-brightgreen.svg)](https://fabkit.io/)

FABKIT is a community-driven toolkit for Flesh and Blood TCG players. Our current flagship feature is a custom card creator that generates high-quality, authentic-looking cards complete with official fonts, symbols, and templates.

![FABKIT Custom Card Creator](https://github.com/FABKIT/FABKIT/raw/main/public/img/preview.png)

## Features

### Custom Card Creator
- **Authentic Design**: Official fonts, symbols, and card layouts
- **Comprehensive Card Types**: Actions, Equipment, Heroes, Weapons, and more
- **Dynamic Styling**: Choose between classic "dented" and modern "flat" card styles
- **Smart Text Scaling**: Automatic font sizing to fit card templates perfectly
- **High-Quality Export**: Download PNG images ready for printing
- **Print Optimization**: Built-in print scaling for standard card sizes
- **Current supported card types**: Action, Attack Reaction, Defense Reaction, Block, Hero/Demi-Hero, Equipment, Instant, Resource, Token, Weapon

### Key Highlights
- **Browser-Based**: No downloads required, works entirely in your browser
- **Mobile Friendly**: Responsive design for desktop and tablet use
- **Open Source**: Community-driven development
- **Free Forever**: No paywalls or premium features

## Quick Start

[fabkit.github.io/FABKIT](https://fabkit.io/)

### Local Development

```bash
# Clone the repository
git clone https://github.com/FABKIT/FABKIT.git
cd FABKIT

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start development server
npm run dev

# Build for production
npm run build
```

## Tech Stack

- **Frontend**: Vue 3 with Composition API
- **Styling**: Tailwind CSS v4
- **Canvas Rendering**: Konva.js for high-quality card generation
- **Text Editor**: Tiptap with custom FAB symbol integration
- **Build Tool**: Vite
- **Deployment**: GitHub Pages

## Usage

1. **Select Card Type**: Choose from our comprehensive list of FAB card types
2. **Fill Details**: Add name, cost, text, and other card properties
3. **Upload Artwork**: Add your custom artwork (PNG, JPG, GIF up to 10MB)
4. **Customize Style**: Toggle between classic and modern card layouts
5. **Choose Background**: Select from our curated collection of card backgrounds
6. **Export**: Download your finished card as a high-resolution PNG

### FAB Symbol Integration
Use our symbol buttons in the text editor to add official FAB symbols:
- Resource symbols
- Power symbols
- Defense symbols
- Life symbols
- Intellect symbols
- Tap/Untap symbols

## Roadmap

[View Full Roadmap](https://fabkit.io/#/roadmap)

## Contributing

We welcome all contributions. Whether they're bug reports, code contributions or suggestions

### Ways to Contribute
- [Report bugs](https://github.com/FABKIT/FABKIT/issues)
- [Suggest features](https://github.com/FABKIT/FABKIT/issues)
- Submit pull requests
- Improve documentation
- Share card designs and feedback

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit with clear messages: `git commit -m 'Add amazing feature'`
5. Push to your fork: `git push origin feature/amazing-feature`
6. Open a Pull Request

## Community

- **Discord**: [Join our server](https://discord.gg/4twcdby9xp) for support, discussions, and showcasing your creations
- **GitHub Issues**: [Report bugs or request features](https://github.com/FABKIT/FABKIT/issues)
- **Contact**: [Get in touch](https://fabkit.io/#/contact) with the development team

## Support the Project

FABKIT is developed in our spare time as a labor of love for the FAB community. If you find it useful, consider supporting us:

[![Support us on Ko-fi](https://img.shields.io/badge/Support%20us-Ko--fi-red.svg)](https://ko-fi.com/fabkit)

Your support helps us dedicate more time to bringing new features to life and keeping everything free for the community.

## License

This project is licensed under the BSD 3-Clause License - see the [LICENSE](LICENSE.md) file for details.

## Legal

FABKIT is in no way affiliated with Legend Story Studios. Legend Story Studios®, Flesh and Blood™, and set names are trademarks of Legend Story Studios. Flesh and Blood characters, cards, logos, and art are property of Legend Story Studios.

## Team

- **@Thencros** - UI/UX Designer, Creative Director
- **@Lambstream** - Lead Developer
