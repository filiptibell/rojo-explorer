import * as vscode from "vscode";

import {
	deleteExistingInstance,
	promptNewInstanceCreation,
	promptRenameExistingInstance,
} from "../utils/instances";

import { updateAllWorkspaces } from "../workspaces";

import { RojoTreeItem } from "./tree";

export class CommandsProvider implements vscode.Disposable {
	private commands: Map<string, (...args: any[]) => any> = new Map();
	private disposables: Array<vscode.Disposable> = new Array();

	private register(name: string, command: (...args: any[]) => any) {
		const fullName = `rojoExplorer.${name}`;
		const disposable = vscode.commands.registerCommand(fullName, command);
		this.disposables.push(disposable);
	}

	dispose() {
		for (const disposable of this.disposables) {
			disposable.dispose();
		}
		this.commands.clear();
		this.commands = new Map();
		this.disposables = new Array();
	}

	constructor() {
		this.register("refresh", updateAllWorkspaces);
		this.register("insertObject", (item: RojoTreeItem) => {
			promptNewInstanceCreation(item.getFolderPath(), item.getFilePath());
		});
		this.register("renameObject", (item: RojoTreeItem) => {
			promptRenameExistingInstance(
				item.getFolderPath(),
				item.getFilePath()
			);
		});
		this.register("deleteObject", (item: RojoTreeItem) => {
			deleteExistingInstance(item.getFolderPath(), item.getFilePath());
		});
		this.register("openProjectRoot", (item: RojoTreeItem) => {
			item.openFile();
		});
	}
}