# Stardew Valley Host Swap Tool - Module Structure

This directory contains the JavaScript modules that make up the Stardew Valley Host Swap Tool application.

## Structure

- **config.js** - Application configurations and global variables
- **utils.js** - General utility functions
- **fileHandler.js** - File handling (upload, processing, download)
- **characterHandler.js** - Character processing and manipulation
- **dataProcessor.js** - Data processing and manipulation from files
- **uiController.js** - User interface controller
- **main.js** - Main file that integrates all modules

## Workflow

1. The `main.js` file is the entry point and initializes the application
2. User events are handled in `uiController.js`
3. Files are processed in `fileHandler.js`
4. Characters are parsed and manipulated in `characterHandler.js`
5. Data is processed and modified in `dataProcessor.js`
6. Global settings and variables are stored in `config.js`
7. General utility functions are in `utils.js`
