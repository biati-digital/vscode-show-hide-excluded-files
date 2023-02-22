import * as vscode from 'vscode';

type ExcludeOptions = {
    [key: string]: boolean
};

export class ShowHideExcludes {
    private currentStatus: string = 'off';
    readonly statusBar: vscode.StatusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100
    );

    constructor(private context: vscode.ExtensionContext) {
        this.currentStatus = this.storageGet('excludedStatus', 'off');
        vscode.commands.executeCommand('setContext', 'biati.excludedStatus', this.currentStatus);

        if (this.currentStatus === 'off') {
            this.updateStatusBar('off');
        }
        if (this.currentStatus === 'on') {
            this.updateStatusBar('on');
        }

        vscode.workspace.onDidChangeConfiguration(event => {
            const configUpdated: boolean = event.affectsConfiguration("showHideExcludedConfig");
            if (configUpdated) {
                const statusBarVisible = this.extensionConfig('showStatusBar');
                statusBarVisible ? this.statusBar.show() : this.statusBar.hide();
            }

            const excludeUpdated: boolean = event.affectsConfiguration("showHideExcludedConfig.exclude");
            if (excludeUpdated) {
                // Force update the hidden list
                if (this.excludeIsHidden) {
                    this.hideExcludes();
                } else {
                    this.showExcludes();
                }
            }
        });
    }

    get excludeIsVisible() {
        return this.storageGet('excludedStatus') === 'on';
    }

    get excludeIsHidden() {
        return this.storageGet('excludedStatus') === 'off';
    }

    get userExcludes(): ExcludeOptions {
        let userExcludes = vscode.workspace.getConfiguration('files.exclude');
        let systemFiles: string[] = ['**/.DS_Store', '**/Thumbs.db'];
        let defaultExcludes = this.defaultExcludes;

        let ignores: string[] = this.extensionConfig('ignoreExcludes') as string[];
        let excludes: ExcludeOptions = {};
        let forceRemove = this.compareDefaultExcludes(defaultExcludes);


        for (const key in userExcludes) {
            if (userExcludes.hasOwnProperty(key) && !ignores.includes(key)) {
                excludes[key] = userExcludes[key];
            }
        }

        // Check if user excludes doesn't have the default exclude and if not add it
        for (const key of this.defaultExcludes) {
            if (!userExcludes.hasOwnProperty(key)) {
                excludes[key] = false;
            }
        }

        if (this.extensionConfig('keepSystemFilesHidden')) {
            for (const file of systemFiles) {
                if (excludes?.[file]) {
                    delete excludes[file];
                }
            }
        }

        // Remove files that were removed from the default exclude list
        for (const file of forceRemove) {
            if (excludes?.hasOwnProperty(file)) {
                delete excludes[file];
            }
        }

        return excludes;
    }

    get defaultExcludes(): string[] {
        const machineConfig = vscode.workspace.getConfiguration();
        return machineConfig.get('showHideExcludedConfig.exclude', []);
    }

    compareDefaultExcludes(excludes: string[]) {
        const remove: string[] = [];

        // Get the previously saved excluded list
        const savedExcludes = this.storageGet('excludedList', []);

        // Check if the new exclude list omits a previously excluded item
        // If its missing, mark it for removal
        savedExcludes.forEach((file: string) => {
            if (excludes.includes(file) === false) {
                remove.push(file);
            }
        });

        // Update the excluded storage
        this.storageSet('excludedList', excludes ?? []);

        // Return the files to force remove from the exclude list
        return remove;
    }

    toggle(): void {
        if (this.excludeIsVisible) {
            return this.hideExcludes();
        }
        return this.showExcludes();
    }

    hideExcludes(): void {
        const status: string = 'off';
        this.storageSet('excludedStatus', status);
        this.updateStatusBar(status);
        vscode.commands.executeCommand('setContext', 'biati.excludedStatus', status);

        // When hiding, store whether the user had workspace excludes defined
        const existingWorkspaceExcludes = this.hasWorkspaceExcludes();
        if (!existingWorkspaceExcludes) {
            this.storageSet('hadEmptyWorkspaceExcludes', true);
        } else {
            this.storageSet('hadEmptyWorkspaceExcludes', false);
        }

        // If there were other excludes then update the exclude status
        this.updateExcludes(this.updateExcludesValue('hide'));
    }


    showExcludes(): void {
        // When showing, if the user had no workspace excludes then
        // simply delete the excludes from the workspace configuration
        if (this.storageGet('hadEmptyWorkspaceExcludes')) {
            this.resetWorkspaceExcludes();
        } else {
            this.updateExcludes(this.updateExcludesValue('show'));
        }

        this.storageSet('excludedStatus', 'on');
        this.updateStatusBar('on');
        vscode.commands.executeCommand('setContext', 'biati.excludedStatus', 'on');
    }

    updateStatusBar(visibility: string = 'off'): void {
        if (!this.extensionConfig('showStatusBar')) {
            this.statusBar.hide();
            return;
        }

        this.statusBar.command = 'biati.excludedfiles.toggle';
        this.statusBar.show();

        if (visibility === 'on') {
            this.statusBar.text = `$(eye-closed)`;
            this.statusBar.tooltip = "Hide Excluded Files";
            return;
        }

        this.statusBar.text = `$(eye)`;
        this.statusBar.tooltip = "Show Excluded Files";
    }


    updateExcludesValue(visibility: string = 'show'): ExcludeOptions {
        const excludes = this.userExcludes;

        for (const key in excludes) {
            if (visibility === 'show' && excludes[key] === true) {
                excludes[key] = false;
            } else if (visibility === 'hide' && excludes[key] === false) {
                excludes[key] = true;
            }
        }

        return excludes;
    }


    async updateExcludes(config: ExcludeOptions): Promise<void> {
        const configuration = vscode.workspace.getConfiguration('files');
        await configuration.update('exclude', config, vscode.ConfigurationTarget.Workspace);
    }


    async resetWorkspaceExcludes(): Promise<void> {
        const configuration = vscode.workspace.getConfiguration('files');
        await configuration.update('exclude', undefined, vscode.ConfigurationTarget.Workspace);
    }


    hasWorkspaceExcludes(): undefined | object {
        const config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('files');
        const inspectExcludes: {
            key: string;
            defaultValue?: any;
            globalValue?: any;
            workspaceValue?: any;
            workspaceFolderValue?: any;
            defaultLanguageValue?: any;
            globalLanguageValue?: any;
            workspaceLanguageValue?: any;
            workspaceFolderLanguageValue?: any;
            languageIds?: string[];

        } | undefined = config.inspect('exclude');

        if (!inspectExcludes?.workspaceValue) {
            return;
        }

        const workspaceExcludes: object = inspectExcludes?.workspaceValue;
        if (workspaceExcludes) {
            return workspaceExcludes;
        }

        return;
    }


    storageGet(name: string, defaultValue: any = null): any {
        const val = this.context.workspaceState.get(name);
        if (val === undefined && defaultValue !== null) {
            return defaultValue;
        }

        return val;
    }

    storageSet(name: string, value: any): void {
        this.context.workspaceState.update(name, value);
    }

    extensionConfig(key: string = ''): unknown {
        if (key) {
            return vscode.workspace.getConfiguration('showHideExcludedConfig').get(key);
        }

        return vscode.workspace.getConfiguration('showHideExcludedConfig');
    }
}