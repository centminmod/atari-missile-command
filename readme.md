![GitHub Sponsors](https://img.shields.io/github/sponsors/centminmod) [![Centmin Mod GitHub stars](https://img.shields.io/github/stars/centminmod/atari-missile-command.svg?style=flat-square)](https://github.com/centminmod/atari-missile-command/stargazers) [![Centmin Mod GitHub forks](https://img.shields.io/github/forks/centminmod/atari-missile-command.svg?style=flat-square)](https://github.com/centminmod/atari-missile-command/network) [![Centmin Mod GitHub issues](https://img.shields.io/github/issues/centminmod/atari-missile-command.svg?style=flat-square)](https://github.com/centminmod/atari-missile-command/issues)

Demo https://missile-command-game.centminmod.com/ hosted on Cloudflare Pages

# Missile Command

A modern HTML5 canvas remake of the classic Atari game from 1980, featuring enhanced graphics, additional gameplay mechanics, and AI-powered gameplay analysis. Demo https://missile-command-game.centminmod.com/ hosted on Cloudflare Pages.

<img src="/images/logo1-1024x1024.png" alt="Missile Command Game" width="300" height="300"> <img src="/images/missile-command-product.png" alt="Missile Command Game" width="300" height="300">

## 🎮 Game Overview

In Missile Command, you defend your cities and missile bases from incoming enemy attacks. Using your missile launchers, you must intercept and destroy enemy missiles, bombers, and other threats before they reach your bases and cities. As waves progress, enemies become faster and more numerous, testing your reflexes and strategic resource management.

## ✨ Key Features

### Core Gameplay
- **Multiple Difficulty Levels**: Easy (150 ammo), Normal (100 ammo), Hard (75 ammo), and Insane (50 ammo) with corresponding score multipliers
- **Wave-based Progression**: Waves with increasing difficulty and procedural generation for infinite gameplay
- **High Score Tracking**: Local storage and online leaderboards with player names and wave details
- **Responsive Design**: Fully playable on mobile and desktop with adaptive UI scaling
- **Sound & Music**: experimental sound and music via royalty free sounds at https://pixabay.com/sound-effects/search/missile/.
  - explosion https://pixabay.com/sound-effects/missile-explosion-168600/
  - missile fire https://pixabay.com/sound-effects/missile-blast-2-95177/
  - music via Suno https://suno.com/invite/@georgesl

### Enhanced Mechanics
- **Special Weapons System**: 
  - Sonic Waves that clear all threats at once horizontally across the screen
  - Mega Bombs for large-area explosions with 5.5x standard explosion radius
- **Between-Wave Store**: Purchase upgrades and repairs with earned points
  - Missile Speed Upgrades (5 levels)
  - Explosion Radius Upgrades (5 levels)
  - Replacement Cities and Bases
  - Shields for protection
- **Advanced Enemy Types**:
  - Smart Bombs that split into multiple warheads
  - MIRVs (Multiple Independent Re-entry Vehicles) with 4-way splits
  - Enemy Aircraft that drop bombs at regular intervals
  - Variable-speed missiles with different trajectories
- **Satellite Defense System**: 
  - Up to 3 orbital platforms that provide additional firing positions
  - Independent ammunition counts and shield systems
- **Score Multiplier System**: Chain successful intercepts to increase score multiplier up to 5.0x
- **Accuracy Bonus**: Earn extra points for precise targeting

### Modern Enhancements
- **AI Gameplay Analysis**: Get personalized feedback and strategic advice powered by LLM models
- **Detailed Statistics**: Track missiles fired, enemies destroyed, accuracy percentages, and more
- **Persistent Game State**: Automatic saving of game progress and configuration
- **Screenshot Capability**: Save and share your gameplay moments
- **In-depth Store Analysis**: AI tracks and analyzes your economic decisions and upgrade strategies

## 🧠 AI Gameplay Analysis

The game features an innovative AI-powered analysis system that:

- Records every player action including weapon selection, timing, and screen position
- Tracks store purchases and resource allocation decisions
- Analyzes gameplay patterns and strategic tendencies
- Provides personalized advice for improvement based on your unique playstyle
- Identifies strengths and weaknesses in your defensive approach
- Offers actionable tips to improve performance in future games

![Missile Command AI Gameplay Summary Analysis](/screenshots/gemini-2.5-pro-atari-missile-command-ai-summary-v1-1.png)

![Missile Command AI Gameplay Summary Analysis](/screenshots/gemini-2.5-pro-atari-missile-command-ai-summary-v1-2.png)

## 🛠️ Technical Implementation

### Technologies Used
- **HTML5 Canvas**: For rendering all game graphics and animations. Hosted on Cloudflare Pages.
- **Vanilla JavaScript**: Clean, optimized game logic without external libraries
- **CSS3**: Responsive design with adaptive scaling for all device sizes
- **LocalStorage API**: For saving game data, preferences, and high scores
- **Cloudflare Workers**: Backend processing for AI analysis and leaderboard functionality
- **AI Integration**: LLM analysis via Cloudflare AI Gateway connected to advanced language models

### Architecture
- **Object-Oriented Design**: Modular game components with clean separation of concerns
- **Event-Driven Gameplay**: Responsive input handling across devices
- **State Management**: Comprehensive game state tracking and persistence
- **Optimized Rendering**: Efficient canvas operations for smooth gameplay even on mobile
- **Robust Error Handling**: Graceful recovery from unexpected conditions

## 🚀 Getting Started

The game runs entirely in your browser - no installation required!

### Controls
- **Mouse/Touch**: Click or tap to fire missiles at target locations
- **Special Weapons**: Click weapon icon to arm, then click target area
- **Space Bar**: Pause/resume game
- **Between Waves**: Purchase upgrades from the store interface

---

*This game is a tribute to the original Atari classic while adding modern gameplay elements and technical innovations. Enjoy the nostalgic experience enhanced with contemporary features!*