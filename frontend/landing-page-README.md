# RE:Q Marketing Landing Page

A clean, modern landing page for the RE:Q browser extension that automatically accepts match queues on Renown.gg.

## Overview

This landing page serves as a marketing funnel for the RE:Q browser extension, directing users to install the extension on their preferred browser. The design is inspired by modern SaaS landing pages with a dark theme and clean UI components.

## Features

- Responsive design that works on all device sizes
- Modern, clean UI with attractive animations
- Browser-specific install buttons
- Feature showcase section
- Smooth scrolling navigation
- SEO-optimized with appropriate meta tags

## Project Structure

```
landing-page/
├── index.html         # Main HTML file
├── script.js          # JavaScript for animations and interactivity
├── robots.txt         # Search engine instructions
└── landing-page-README.md  # This file
```

## Development

The landing page is built with vanilla HTML, CSS, and JavaScript without any frameworks or build tools for simplicity and maximum compatibility.

### CSS

CSS is written directly in the `<style>` tag in the HTML file using CSS variables for consistent theming:

```css
:root {
    --primary: #FF5500;
    --background: #0D0D0D;
    --bg-card: #181818;
    --bg-gradient-from: #151515;
    --bg-gradient-to: #0D0D0D;
    --text: #E0E0E0;
    --text-secondary: #9CA3AF;
    --border: #333333;
}
```

### JavaScript

The JavaScript file (`script.js`) adds the following functionality:
- Scroll effects for the header
- Smooth scrolling for navigation links
- Intersection Observer animations for feature cards

## Deployment

To deploy the landing page:

1. Upload all files to your web server
2. Ensure proper URL redirects are set up
3. Update the browser extension download links to point to the appropriate stores

## Customization

### Colors

To change the color scheme, modify the CSS variables in the `:root` selector at the top of the CSS section.

### Content

Update the content in the HTML file to match your extension's specific features and benefits.

### Browser Links

Make sure to update the browser extension links to point to your actual extension pages on the Chrome Web Store, Firefox Add-ons, and other platforms.

## License

This landing page template is available for use with the RE:Q extension. 