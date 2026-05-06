# Shervin Shirzad — Portfolio 2023

A production-ready personal portfolio website built with pure HTML, CSS, and Vanilla JavaScript.

## 🚀 GitHub Pages Deployment

1. Push all files to your GitHub repository
2. Go to **Settings → Pages**
3. Set source to **Deploy from a branch → main / root**
4. Your site will be live at `https://yourusername.github.io/repo-name`

## 📁 File Structure

```
├── index.html        # Main HTML
├── style.css         # All styles + theme system
├── script.js         # JS — theme, portfolio, lightbox, animations
├── data.json         # Portfolio image data (edit this!)
├── images/           # Add your portfolio images here
│   ├── 1.jpg
│   ├── 2.jpg
│   └── ...
└── README.md
```

## 🖼️ Adding Your Images

1. Create an `images/` folder
2. Add your project images (JPG/PNG/WebP recommended)
3. Update `data.json` with your image paths and titles:

```json
[
  { "src": "images/my-project.jpg", "title": "Project Name" },
  { "src": "images/branding.jpg",   "title": "Brand Identity" }
]
```

## 🌗 Dark / Light Mode

- Default: **Dark mode**
- Toggle button in top-right corner
- Saves preference to `localStorage`
- Respects system `prefers-color-scheme`

## ✨ Features

- Dark/Light mode with smooth transitions
- Scroll-triggered reveal animations
- Portfolio grid with lazy loading
- Load More (9 initial → +6 per click)
- Fullscreen lightbox with keyboard support
- Custom cursor (desktop)
- Hero letter animation
- Subtle parallax on hero
- Grain/noise texture overlay
- Fully responsive (1/2/3 column grid)
- Image protection (no right-click, no drag)
- Smooth nav scroll behavior

## 🎨 Customization

Edit CSS variables in `style.css` under `[data-theme="dark"]` and `[data-theme="light"]` to change the color palette.

Update contact links in `index.html` with your real email, phone, Instagram, LinkedIn, and WhatsApp.
