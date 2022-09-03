# # Show/Hide Excluded Files

This extension will quickly show/hide excluded files from the files explorer. There's another extension but has not been updated in a few years. Also it shows files that are not part of the project like **.DS_Store** or **Thumbs.db** and it can be really annoying.
This extension was built using entirely the vscode API to be fast and small, includes some options to adjust the excludes and remembers if files are hidden or visible between sessions using vscode storage API.

## Features

- **Status Bar Toggle** Quickly Show or hide excluded files from the status bar. it can be disabled in the extension configuration.
- **Right Click** Do right click anywhere in the sidebar to show/hide excluded files.
- **Multiple Commands** Assign keyboard shortcuts or call the commands from the command palette.

![sidebar show](https://raw.githubusercontent.com/biati-digital/vscode-show-hide-excluded-files/main/assets/show-excluded.jpg)

![sidebar hide](https://raw.githubusercontent.com/biati-digital/vscode-show-hide-excluded-files/main/assets/hide-excluded.jpg)

![statusbar show](https://raw.githubusercontent.com/biati-digital/vscode-show-hide-excluded-files/main/assets/statusbar-show.jpg)

![statusbar hide](https://raw.githubusercontent.com/biati-digital/vscode-show-hide-excluded-files/main/assets/statusbar-hide.jpg)

## Commands

The extension contributes the following commands. You can use the command palette or assign a keyboard shortcut to execute this commands.

- **Show Excluded Files**
- **Hide Excluded Files**
- **Toggle Excluded Files**

## Extension Settings

This extension contributes the following settings:

- `showHideExcludedConfig.showStatusBar`: enable/disable the status bar icon
- `showHideExcludedConfig.keepSystemFilesHidden`: Keep system files like .DS_Store or Thumbs.db hidden.
- `showHideExcludedConfig.ignoreExcludes`: `[]` Define a list of files to ignore when doing "Show Excluded files". See **Ignore exclusions**

## Ignore exclusions

You can use the option `showHideExcludedConfig.ignoreExcludes` to define a list of files that you wish to ignore, this means that this extension will not show this files and will respect your excludes configuration.

For example: if your `file.excludes` configuration contains `node_modules` then vscode will hide `node_modules` from the files explorer, if you select `Show Excluded Files` the `node_modules` folder will be visible. You can customize this behavior, if you add `node_modules` to the extension option `showHideExcludedConfig.ignoreExcludes` then calling
`Show Excluded Files` will not change your configuration for `node_modules` so the folder will not be displayed.

This option can be useful if you only want to toggle the visibility of certain files. You need to add the files exactly as they appear in the `file.excludes` option.

## Things you need to know

- The extension works per workspace, does not modify the global settings so toggling excluded files will only affect your current active workspace.
