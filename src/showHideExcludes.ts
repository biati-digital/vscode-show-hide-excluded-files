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
            let configUpdated: boolean = event.affectsConfiguration("showHideExcludedConfig");
            if (configUpdated) {
                const statusBarVisible = this.extensionConfig('showStatusBar');
                statusBarVisible ? this.statusBar.show() : this.statusBar.hide();
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
        let ignores: string[] = this.extensionConfig('ignoreExcludes') as string[];
        let excludes: ExcludeOptions = {};

        for (const key in userExcludes) {
            if (userExcludes.hasOwnProperty(key) && !ignores.includes(key)) {
                excludes[key] = userExcludes[key];
            }
        }

        if (this.extensionConfig('keepSystemFilesHidden')) {
            for (const file of systemFiles) {
                if (excludes?.[file]) {
                    delete excludes[file];
                }
            }
        }

        console.log('ignores', ignores);
        console.log('userExcludes', userExcludes);
        console.log('excludes', excludes);

        return excludes;
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

        // When hiding, if the user had no workspace excludes then
        // simply delete the excludes from the workspace configuration
        if (this.storageGet('hadEmptyWorkspaceExcludes')) {
            this.resetWorkspaceExcludes();
            return;
        }

        // If there were other excludes then update the exclude status
        this.updateExcludes(this.updateExcludesValue('hide'));
    }


    showExcludes(): void {
        const existingWokspaceExcludes = this.hasWorkspaceExcludes();
        if (!existingWokspaceExcludes) {
            this.storageSet('hadEmptyWorkspaceExcludes', true);
        } else {
            this.storageSet('hadEmptyWorkspaceExcludes', false);
        }

        this.storageSet('excludedStatus', 'on');
        this.updateExcludes(this.updateExcludesValue('show'));
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