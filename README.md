# Stardew Valley Host Swap Tool

A web-based tool for changing the host of Stardew Valley multiplayer save files. This allows farmhands to become the host of a farm, enabling them to play the save file without the original host present.

## Features

- **Modern UI**: Clean, responsive interface with drag-and-drop functionality
- **ZIP File Support**: Upload your entire save folder as a ZIP file
- **Save File Backups**: Creates backup copies of your save files automatically
- **Character Selection**: Visual selection of the new host character
- **Download Modified Files**: Get a complete ZIP with the modified save files
- **Legacy Mode**: Still supports the original text paste method for backward compatibility

## How It Works

1. **Upload your save folder as a ZIP**: The tool expects a ZIP containing your save folder with the main save file, SaveGameInfo, and optionally AdditionalCropData
2. **Select a new host**: Choose which farmhand character should become the new host
3. **Download modified files**: Get a ZIP with the modified save files, including backups

## Technical Details

The tool modifies several parts of the save files:

1. In the main save file:
   - Swaps the `<player>` and `<farmhand>` tags between the current host and the selected farmhand
   - Transfers important event flags, mail, and house upgrade information

2. In the SaveGameInfo file:
   - Updates the character information to match the new host

## Development

This tool uses:
- JSZip for ZIP file handling
