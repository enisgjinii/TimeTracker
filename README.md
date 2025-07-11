# TimeTracker Pro ⏳

A powerful desktop application for tracking time spent on different applications and activities. Built with Electron, TimeTracker Pro provides detailed insights into your daily computer usage patterns with a beautiful, modern interface.

## ✨ Features

### 🕒 Real-time Activity Tracking
- **Automatic Window Detection**: Tracks active windows and applications in real-time
- **Application Icons**: Displays actual application icons for better visual identification
- **Idle Detection**: Automatically detects when you're away from your computer
- **Manual Entries**: Add custom time entries for activities not captured automatically

### 📊 Multiple View Modes
- **Day View**: Detailed hourly breakdown of your daily activities
- **Week View**: Weekly overview with productivity patterns
- **Month View**: Long-term trends and monthly summaries

### 🎨 Modern Interface
- **Dark/Light Mode**: Toggle between themes or use system preference
- **Responsive Design**: Clean, modern UI built with Bootstrap 5
- **Color-coded Events**: Visual categorization of different activity types
- **Timeline Visualization**: Interactive timeline with zoom and scroll capabilities

### ⚙️ Advanced Settings
- **Custom Categories**: Create and manage activity categories
- **App Classifications**: Automatically categorize applications
- **Grouping Options**: Group similar activities with configurable thresholds
- **Timeline Customization**: Adjust timeline increments and display options

### 📈 Productivity Insights
- **Productivity Scoring**: Automatic scoring based on activity patterns
- **Focus Session Detection**: Identifies deep work periods
- **Daily Summaries**: Overview of your most productive times
- **Export Capabilities**: Save data in CSV format for external analysis

## 🚀 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TimeTracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application**
   ```bash
   npm start
   ```

## 📁 Project Structure

```
TimeTracker/
├── main.js              # Electron main process
├── renderer.js          # Renderer process (UI logic)
├── index.html           # Main application interface
├── package.json         # Project dependencies and scripts
├── settings.json        # User settings and preferences
├── segments.csv         # Time tracking data (auto-generated)
├── icons/              # Application icons
│   └── default.png     # Default icon
└── .gitignore          # Git ignore rules
```

## 🎯 Usage

### Getting Started
1. Launch the application using `npm start`
2. The app will automatically start tracking your active windows
3. Use the sidebar navigation to switch between different views
4. Access settings via the gear icon to customize your experience

### Key Features

#### Timeline Navigation
- **Day View**: See your activities broken down by hour
- **Week View**: Get a weekly overview of your productivity
- **Month View**: Track long-term patterns and trends

#### Manual Time Entry
- Click the "+" button to add manual entries
- Specify start time, end time, and activity description
- Perfect for tracking offline activities or meetings

#### Settings Configuration
- **Theme**: Choose between light, dark, or system theme
- **Timeline**: Adjust timeline increments (5, 15, 30, 60 minutes)
- **Categories**: Create custom activity categories
- **App Classifications**: Automatically categorize applications
- **Grouping**: Enable/disable activity grouping with threshold control

### Data Management
- **Automatic Saving**: Data is automatically saved to `segments.csv`
- **Settings Persistence**: User preferences saved in `settings.json`
- **Export**: Data can be exported for external analysis

## 🔧 Configuration

### Settings File (`settings.json`)
```json
{
  "timelineIncrements": 5,
  "themeMode": "light",
  "useEmojis": true,
  "colorCodedEvents": true,
  "defaultView": "day",
  "enableGrouping": true,
  "groupingThreshold": 5,
  "showIcons": true,
  "categories": ["Work", "Entertainment", "Productivity"],
  "appClassifications": {
    "Visual Studio Code": "Work",
    "Discord": "Social"
  }
}
```

### Key Settings
- `timelineIncrements`: Minutes between timeline markers (5, 15, 30, 60)
- `themeMode`: Interface theme ("light", "dark", "system")
- `defaultView`: Default view on startup ("day", "week", "month")
- `groupingThreshold`: Minutes threshold for grouping similar activities
- `categories`: Custom activity categories
- `appClassifications`: Automatic app categorization rules

## 🛠️ Development

### Tech Stack
- **Electron**: Desktop application framework
- **Bootstrap 5**: UI framework
- **jQuery**: DOM manipulation and event handling
- **Font Awesome**: Icon library
- **Inter Font**: Modern typography

### Key Dependencies
- `electron`: Desktop app framework
- `get-windows`: Active window detection
- `file-icon`: Application icon extraction
- `electron-store`: Settings persistence

### Development Commands
```bash
# Start development
npm start

# Install new dependencies
npm install <package-name>

# Update dependencies
npm update
```

## 📊 Data Format

### Segments CSV Structure
The application saves time tracking data in `segments.csv`:
```csv
start,end,app,title,category
2024-01-01T09:00:00,2024-01-01T09:30:00,Visual Studio Code,main.js - TimeTracker,Work
```

### Data Fields
- `start`: Activity start time (ISO format)
- `end`: Activity end time (ISO format)
- `app`: Application name
- `title`: Window title
- `category`: Activity category (auto-assigned or manual)

## 🎨 Customization

### Adding Custom Categories
1. Open Settings
2. Navigate to Categories section
3. Add new category names
4. Save settings

### App Classifications
1. In Settings, go to App Classifications
2. Add application name and desired category
3. The app will automatically categorize future sessions

### Theme Customization
The app supports CSS custom properties for advanced theming:
```css
:root {
  --primary: hsl(0 0% 9%);
  --background: hsl(0 0% 100%);
  --foreground: hsl(0 0% 3.9%);
  /* ... more variables */
}
```

## 🔒 Privacy & Security

- **Local Storage**: All data is stored locally on your machine
- **No Cloud Sync**: No data is transmitted to external servers
- **Open Source**: Transparent codebase for security review
- **Minimal Permissions**: Only requires window access for tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Common Issues

**App not tracking windows**
- Ensure the app has necessary permissions
- Check if antivirus is blocking the application
- Restart the application

**Icons not displaying**
- Check internet connection for icon fetching
- Verify app has file system access
- Try refreshing the application

**Settings not saving**
- Check file permissions in the app directory
- Ensure `settings.json` is writable
- Restart the application

### Getting Help
- Check the issues section for known problems
- Create a new issue with detailed description
- Include your operating system and app version

## 📈 Roadmap

- [ ] Cloud sync capabilities
- [ ] Advanced analytics dashboard
- [ ] Pomodoro timer integration
- [ ] Team collaboration features
- [ ] Mobile companion app
- [ ] API for third-party integrations

---

**TimeTracker Pro** - Take control of your time, one window at a time! ⏰ 