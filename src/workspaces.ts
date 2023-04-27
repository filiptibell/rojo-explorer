import * as vscode from "vscode";

import { RojoTreeProvider } from "./providers/explorer";
import { SettingsProvider } from "./providers/settings";
import { rojoSupportsSourcemapWatch } from "./utils/rojo";
import {
	connectSourcemapUsingFile,
	connectSourcemapUsingRojo,
} from "./utils/sourcemap";

const workspaceDestructors: Map<string, Function> = new Map();
const workspaceUpdaters: Map<string, Function> = new Map();

export const updateWorkspace = (folder: vscode.WorkspaceFolder) => {
	const update = workspaceUpdaters.get(folder.uri.fsPath);
	if (update) {
		update();
	}
};

export const updateAllWorkspaces = () => {
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (workspaceFolders) {
		workspaceFolders.forEach(updateWorkspace);
	}
};

export const connectWorkspace = (
	folder: vscode.WorkspaceFolder,
	settings: SettingsProvider,
	treeProvider: RojoTreeProvider
) => {
	const workspacePath = folder.uri.fsPath;

	// Check for autogeneration setting, and ensure sourcemap
	// with watching is supported if we want to autogenerate
	let autogenerate = settings.get("sourcemap.autogenerate");
	if (autogenerate) {
		if (!rojoSupportsSourcemapWatch(workspacePath)) {
			autogenerate = false;
		}
	}

	if (autogenerate) {
		// Autogeneration is enabled and available, we can
		// watch for changes using the rojo sourcemap cli command
		const [update, destroy] = connectSourcemapUsingRojo(
			workspacePath,
			settings,
			treeProvider
		);
		workspaceUpdaters.set(workspacePath, update);
		workspaceDestructors.set(workspacePath, destroy);
	} else {
		// Autogeneration is either disabled or not available, so we will
		// instead watch the sourcemap.json file in this workspace folder
		const [update, destroy] = connectSourcemapUsingFile(
			workspacePath,
			settings,
			treeProvider
		);
		workspaceUpdaters.set(workspacePath, update);
		workspaceDestructors.set(workspacePath, destroy);
	}
};

export const connectAllWorkspaces = (
	settings: SettingsProvider,
	provider: RojoTreeProvider
) => {
	if (vscode.workspace.workspaceFolders) {
		vscode.workspace.workspaceFolders.forEach((folder) => {
			disconnectWorkspace(folder);
		});
		vscode.workspace.workspaceFolders.forEach((folder) => {
			connectWorkspace(folder, settings, provider);
		});
	}
};

export const disconnectWorkspace = (folder: vscode.WorkspaceFolder) => {
	const destroy = workspaceDestructors.get(folder.uri.fsPath);
	if (destroy) {
		destroy();
	}
};

export const disconnectAllWorkspaces = () => {
	let workspacePaths = [...workspaceDestructors.keys()];
	workspacePaths.forEach((workspacePath) => {
		const destroy = workspaceDestructors.get(workspacePath);
		if (destroy) {
			destroy();
		}
	});
};
