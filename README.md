# FarmSmart AI - Intelligent Farm Management System

A modern, AI-powered farm management application built with Next.js, TypeScript, and Tailwind CSS. FarmSmart AI provides intelligent plant identification, measurement, and comprehensive farm management capabilities.

## 🌱 Features

### Core Functionality
- **Plant Scanner**: AI-powered plant identification using Plant.id API
- **Plant Measurement**: Manual and AI-powered plant dimension measurement
- **AI Measurement**: Advanced computer vision for precise plant analysis
- **Dashboard**: Comprehensive farm management dashboard with analytics
- **Reports**: Detailed reporting and analytics for farm operations
- **Settings**: Complete system configuration and user preferences

### Technical Features
- **Dark/Light Mode**: Complete theme system with persistent preferences
- **Responsive Design**: Mobile-first design with full responsive support
- **Real-time Updates**: Live data updates and interactive feedback
- **API Integration**: Seamless integration with Plant.id and Google Vision APIs
- **Type Safety**: Full TypeScript implementation for robust development

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, or pnpm
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/NourMtir0722/farmsmart-AI.git
   cd farmsmart-AI
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` and add your API keys:
   ```env
   # Plant.id API Configuration
   PLANT_ID_API_KEY=your_plant_id_api_key_here
   
   # Google Vision API (optional)
   GOOGLE_VISION_API_KEY=your_google_vision_api_key_here
   
   # Environment
   NODE_ENV=development
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
farmsmart-ai/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── plant-scan/    # Plant identification API
│   │   │   ├── plant-measure/ # Manual measurement API
│   │   │   └── ai-plant-measure/ # AI measurement API
│   │   ├── plant-scanner/     # Plant scanner page
│   │   ├── plant-measure/     # Plant measurement page
│   │   ├── ai-measure/        # AI measurement page
│   │   ├── reports/           # Reports page
│   │   ├── settings/          # Settings page
│   │   ├── debug-theme/       # Theme debugging page
│   │   └── globals.css        # Global styles
│   ├── components/            # Reusable components
│   │   ├── Layout.tsx         # Main layout component
│   │   ├── Sidebar.tsx        # Navigation sidebar
│   │   └── DashboardLayout.tsx # Dashboard layout
│   ├── contexts/              # React contexts
│   │   └── ThemeContext.tsx   # Theme management
│   └── types/                 # TypeScript type definitions
├── public/                    # Static assets
├── .env.local                 # Environment variables (not in repo)
├── env.example                # Environment template
└── README.md                  # This file
```

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Quality

This project uses:
- **TypeScript** for type safety
- **ESLint** for code linting
- **Tailwind CSS** for styling
- **Next.js 15** with App Router
- **React 19** with latest features

### Theme System

The application includes a comprehensive dark/light theme system:
- Persistent theme preferences
- System preference detection
- Smooth transitions
- Debug tools available at `/debug-theme`

## 🔧 API Integration

### Plant.id API
- Plant identification and classification
- Detailed plant information
- Confidence scoring

### Google Vision API
- Advanced computer vision analysis
- Object detection for measurements
- Label annotation for plant features

## 🎨 UI/UX Features

- **Modern Design**: Clean, professional interface
- **Responsive Layout**: Works on all device sizes
- **Interactive Feedback**: Toast notifications and loading states
- **Accessibility**: WCAG compliant design
- **Performance**: Optimized with Next.js and Turbopack

## 🤝 Contributing

### Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the existing code style
   - Add TypeScript types where needed
   - Include proper error handling

3. **Test your changes**
   ```bash
   npm run lint
   npm run build
   ```

4. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request**
   - Use the PR template
   - Include screenshots for UI changes
   - Describe the changes clearly

### Code Style Guidelines

- Use TypeScript for all new code
- Follow ESLint configuration
- Use Tailwind CSS for styling
- Write meaningful commit messages
- Include proper error handling
- Add comments for complex logic

## 📝 Environment Variables

Create a `.env.local` file with the following variables:

```env
# Plant.id API Configuration
PLANT_ID_API_KEY=your_plant_id_api_key_here

# Google Vision API (optional)
GOOGLE_VISION_API_KEY=your_google_vision_api_key_here

# Environment
NODE_ENV=development
```

### Getting API Keys

1. **Plant.id API**: Visit [Plant.id](https://web.plant.id/api-access-request)
2. **Google Vision API**: Set up in [Google Cloud Console](https://console.cloud.google.com/)

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
- **Netlify**: Use `npm run build` and `npm run start`
- **Railway**: Direct deployment from GitHub
- **Docker**: Use the provided Dockerfile

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing framework
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS
- [Plant.id](https://plant.id/) for plant identification API
- [Google Vision API](https://cloud.google.com/vision) for computer vision
- [Lucide React](https://lucide.dev/) for beautiful icons

## 📞 Support

For support, please open an issue on GitHub or contact the development team.

---

**FarmSmart AI** - Making farming smarter with AI technology 🌱
