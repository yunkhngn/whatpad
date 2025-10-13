# Wattpad Clone

A React-based clone of Wattpad, an online story reading and writing platform. This project demonstrates a modern web application with routing, component architecture, and responsive design.

## 🚀 Features

- **Browse Stories**: View a collection of stories with cover images, titles, authors, and stats
- **Read Stories**: Click on any story to read its full content
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Modern UI**: Clean interface using TailwindCSS and Bootstrap
- **Component Architecture**: Reusable components following React best practices

## 📁 Project Structure

\`\`\`
wattpad-clone/
├── src/
│   ├── assets/
│   │   └── styles/
│   │       ├── reset.css
│   │       ├── global.css
│   │       └── variables.css
│   ├── components/
│   │       ├── Button.jsx
│   │       ├── Card.jsx
│   │       └── StoryCard.jsx
│   │─── layout/
│   │       ├── Layout.jsx
│   │       ├── Header.jsx
│   │       └── Footer.jsx
│   ├── pages/
│   │   ├── HomePage/
│   │   │   ├── HomePage.jsx
│   │   │   └── HomePage.module.css
│   │   └── ReadingPage/
│   │       ├── ReadingPage.jsx
│   │       └── ReadingPage.module.css
│   ├── services/
│   │   └── api.js
│   ├── routes/
│   │   └── AppRouter.jsx
│   ├── App.jsx
│   └── index.js
├── index.html
├── package.json
└── README.md
\`\`\`

### 📂 Folder Structure Explained

#### `src/assets/`
Contains all static assets like images, fonts, and global styles.
- **`images/`** - Store story covers, icons, and other image assets
- **`styles/`** - Global CSS files:
  - `reset.css` - Removes default browser styling for consistency
  - `variables.css` - Defines CSS custom properties (colors, fonts, spacing)
  - `global.css` - Global styles applied across the entire application

#### `src/components/`
Reusable React components organized by purpose.
  - `Button.jsx` - Customizable button component with variants
  - `Card.jsx` - Generic card container for content
  - `StoryCard.jsx` - Specialized card for displaying story previews

  
#### `src/layouts/`
Components that define the app's structure:
  - `MainLayout` - Main layout wrapper that includes header and footer
  - `Header` - Top navigation bar with logo and menu
  - `Footer` - Bottom footer with links and copyright

#### `src/pages/`
Page-level components representing different routes. Each page has its own folder with component and CSS module.
- **`HomePage/`** - Landing page displaying story listings
  - `HomePage.jsx` - Main component with story grid
  - `HomePage.module.css` - Page-specific styles using CSS Modules
- **`ReadingPage/`** - Individual story reading view
  - `ReadingPage.jsx` - Displays full story content with metadata
  - `ReadingPage.module.css` - Styles for reading interface

#### `src/services/`
API and data fetching logic separated from components.

#### `src/routes/`
Routing configuration and route definitions.
- **`AppRouter.jsx`** - Defines all application routes using React Router, mapping URLs to page components

#### Root Files
- **`App.jsx`** - Root component that wraps the entire application with providers and router
- **`index.js`** - Application entry point that renders App into the DOM

## 🛠️ Technologies Used

- **React 18** - UI library
- **React Router v6** - Client-side routing
- **TailwindCSS** - Utility-first CSS framework
- **Bootstrap 5** - Component library
- **CSS Modules** - Scoped styling for pages

## 📦 Installation

1. **Clone or download the project**

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Start the development server**
   \`\`\`bash
   npm start
   \`\`\`

4. **Open your browser**
   Navigate to `http://localhost:3000` (or the port shown in your terminal)

## 🎨 Customization

### Colors
Edit the color palette in `src/assets/styles/variables.css`:
\`\`\`css
:root {
  --color-primary: #ff6b00;
  --color-secondary: #1a1a1a;
  --color-background: #ffffff;
  --color-text: #333333;
}
\`\`\`

## 📱 Routes

- `/` - Home page with story listings
- `/read/:id` - Reading page for individual stories

## 🏗️ Building for Production

\`\`\`bash
npm run build
\`\`\`

The built files will be in the `dist/` directory, ready to be deployed to any static hosting service.

## 🔮 Future Enhancements

- User authentication and profiles
- Story creation and editing interface
- Comments and voting system
- Search and filter functionality
- Genre-based browsing
- Reading lists and bookmarks
- Backend API integration

## 📄 License

This is a learning project and is free to use for educational purposes.

## 🤝 Contributing

Feel free to fork this project and submit pull requests with improvements!
