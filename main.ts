import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";

import { DownloadFromNotion } from "./src/download-pages";

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	notionAPI: string;
	databaseID: string;
	notionWorkspace: string;
	outputDir: string;
	fileHeaderTemplate: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	notionAPI: "",
	databaseID: "",
	notionWorkspace: "YOUR_NOTION_WORKSPACE_NAME",
	outputDir: "Notion",
	fileHeaderTemplate: "",
};

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		// const ribbonIconEl = this.addRibbonIcon(
		// 	"dice",
		// 	"Obsidian Notion Download",
		// 	(evt: MouseEvent) => {
		// 		// Called when the user clicks the icon.
		// 		const downloader = new DownloadFromNotion(this);
		// 		downloader.downloadPages();
		// 		new Notice("Check the console!");
		// 	}
		// );
		// Perform additional things with the ribbon
		// ribbonIconEl.addClass("my-plugin-ribbon-class");

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		// const statusBarItemEl = this.addStatusBarItem();
		// statusBarItemEl.setText("Status Bar Text");

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: "sync-notes",
			name: "Sync notes",
			callback: () => {
				const downloader = new DownloadFromNotion(this);
				downloader.downloadPages();
				// new SampleModal(this.app).open();
			},
		});

		// This adds an editor command that can perform some operation on the current editor instance
		// this.addCommand({
		// 	id: "sample-editor-command",
		// 	name: "Sample editor command",
		// 	editorCallback: (editor: Editor, view: MarkdownView) => {
		// 		console.log(editor.getSelection());
		// 		editor.replaceSelection("Sample Editor Command");
		// 	},
		// });

		// This adds a complex command that can check whether the current state of the app allows execution of the command
		// this.addCommand({
		// 	id: "open-sample-modal-complex",
		// 	name: "Open sample modal (complex)",
		// 	checkCallback: (checking: boolean) => {
		// 		// Conditions to check
		// 		const markdownView =
		// 			this.app.workspace.getActiveViewOfType(MarkdownView);
		// 		if (markdownView) {
		// 			// If checking is true, we're simply "checking" if the command can be run.
		// 			// If checking is false, then we want to actually perform the operation.
		// 			if (!checking) {
		// 				new SampleModal(this.app).open();
		// 			}

		// 			// This command will only show up in Command Palette when the check function returns true
		// 			return true;
		// 		}
		// 	},
		// });

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		// this.registerDomEvent(document, "click", (evt: MouseEvent) => {
		// 	console.log("click", evt);
		// });

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		// this.registerInterval(
		// 	window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000)
		// );
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText("Woah!");
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", {
			text: "Settings for Obsidian Notion sync",
		});

		containerEl.createEl("h3", {
			text: "Notion settings",
		});

		const notionApiInput = new Setting(containerEl)
			.setName("Notion API Token")
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder("Enter your Notion API Token")
					.setValue(this.plugin.settings.notionAPI)
					.onChange(async (value) => {
						this.plugin.settings.notionAPI = value;
						await this.plugin.saveSettings();
					})
			);
		notionApiInput.controlEl.querySelector("input").type = "password";

		const notionDatabaseId = new Setting(containerEl)
			.setName("Notion Database ID")
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder("Enter your Notion database ID")
					.setValue(this.plugin.settings.databaseID)
					.onChange(async (value) => {
						this.plugin.settings.databaseID = value;
						await this.plugin.saveSettings();
					})
			);
		notionDatabaseId.controlEl.querySelector("input").type = "password";

		new Setting(containerEl)
			.setName("Notion workspace name")
			.setDesc(
				"Your Notion workspace name to create a url on the local files"
			)
			.addText((text) =>
				text
					.setPlaceholder("Your Notion workspace")
					.setValue(this.plugin.settings.notionWorkspace)
					.onChange(async (value) => {
						this.plugin.settings.notionWorkspace = value;
						await this.plugin.saveSettings();
					})
			);

		containerEl.createEl("h3", {
			text: "Obsidian settings",
		});

		new Setting(containerEl)
			.setName("Obsidian output directory")
			.setDesc("Local output directory of the downloaded Notion pages")
			.addText((text) =>
				text
					.setPlaceholder("Enter the output directory")
					.setValue(this.plugin.settings.outputDir)
					.onChange(async (value) => {
						this.plugin.settings.outputDir = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Obsidian file header template")
			.setDesc(
				'The header template that gets added to the top of the file. Leave empty to use the default. (Example: "templates/sync_file_header")'
			)
			.addText((text) =>
				text
					.setPlaceholder("File header template path")
					.setValue(this.plugin.settings.fileHeaderTemplate)
					.onChange(async (value) => {
						this.plugin.settings.fileHeaderTemplate = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
