# 🎬 Downloader

A modern, full-stack download manager with movie search integration, built with Next.js and designed for seamless media management.

## ✨ Features

### 🌐 Web Application
- **Modern UI/UX** - Clean, responsive interface with dark mode support
- **Movie Search** - Integrated Zone-Téléchargement search with quality filtering
- **Smart Downloads** - Queue management with real-time progress tracking
- **Folder Browser** - Navigate and create directories directly in the UI
- **Path Shortcuts** - Quick access to frequently used download locations
- **Plex Integration** - Automatic library scanning after downloads complete
- **Session Management** - Secure authentication with persistent sessions

### 🔧 Backend
- **Background Worker** - Dedicated process for handling downloads
- **RESTful API** - Comprehensive API for all operations
- **SQLite Database** - Lightweight, file-based data storage
- **User Management** - Multi-user support with bcrypt password hashing
- **File Organization** - Customizable download paths and filenames

### 📱 iOS App (Coming Soon)
- Native iOS client for mobile download management

## 🛠️ Tech Stack

**Frontend:**
- [Next.js 16](https://nextjs.org/) - React framework
- [React 19](https://react.dev/) - UI library
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Radix UI](https://www.radix-ui.com/) - Headless UI components
- [Lucide React](https://lucide.dev/) - Icon library

**Backend:**
- [Node.js](https://nodejs.org/) - Runtime
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Drizzle ORM](https://orm.drizzle.team/) - Database toolkit
- [Better-SQLite3](https://github.com/WiseLibs/better-sqlite3) - SQLite driver
- [Jose](https://github.com/panva/jose) - JWT authentication
- [Axios](https://axios-http.com/) - HTTP client

**Tools:**
- [PM2](https://pm2.keymetrics.io/) - Process management
- [ESLint](https://eslint.org/) - Code linting
- [tsx](https://github.com/privatenumber/tsx) - TypeScript execution

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ and npm
- PM2 (optional, for production)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Downloader
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. **Configure application settings**
   ```bash
   cp config/settings.example.json config/settings.json
   # Edit config/settings.json with your ZFS paths, Plex details, and download locations
   ```

4. **Initialize database**
   ```bash
   npm run init-db
   ```

5. **Create a user**
   ```bash
   npm run add-user
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

Visit [http://localhost:3000](http://localhost:3000) to access the application.

## 📖 Documentation

- **[Production Setup](PRODUCTION_SETUP.md)** - Deployment guide
- **[API Documentation](API_DOCUMENTATION.md)** - Complete API reference
- **[Database Schema](DATABASE.md)** - Database structure
- **[Full Documentation](DOCUMENTATION.md)** - Comprehensive guide

## 🎯 Usage

### Web Interface
1. Log in with your credentials
2. Search for movies or paste download links
3. Select quality and download location
4. Monitor progress in real-time
5. Downloads are automatically organized

### API
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}' \
  -c cookies.txt

# Add download
curl -X POST http://localhost:3000/api/downloads \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "url": "https://1fichier.com/?abc123",
    "targetPath": "/downloads/movies",
    "customFilename": "movie.mkv"
  }'
```

## 🔐 Security

- Session-based authentication with HTTP-only cookies
- Bcrypt password hashing
- Path traversal protection
- Secure folder browsing within configured roots

## 📝 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run worker       # Start background worker
npm run init-db      # Initialize database
npm run add-user     # Create new user
npm run list-users   # List all users
npm run delete-user  # Delete a user
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Zone-Téléchargement for movie data
- 1fichier for file hosting
- Plex for media server integration

---

**Made with ❤️ using Next.js**
