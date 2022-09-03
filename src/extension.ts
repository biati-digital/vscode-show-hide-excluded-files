import * as vscode from 'vscode';
import { ShowHideExcludes } from './showHideExcludes';

export function activate(context: vscode.ExtensionContext) {
	const excludes = new ShowHideExcludes(context);
	context.subscriptions.push(vscode.commands.registerCommand('biati.excludedfiles.toggle', () => {
		if (!vscode.workspace.workspaceFolders?.length) {
			return;
		}

		excludes.toggle();
	}));

	context.subscriptions.push(vscode.commands.registerCommand('biati.excludedfiles.show', () => {
		if (!vscode.workspace.workspaceFolders?.length) {
			return;
		}

		excludes.showExcludes();
	}));

	context.subscriptions.push(vscode.commands.registerCommand('biati.excludedfiles.hide', () => {
		if (!vscode.workspace.workspaceFolders?.length) {
			return;
		}

		excludes.hideExcludes();
	}));
}

export function deactivate() { }
