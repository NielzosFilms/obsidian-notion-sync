import { requestUrl } from "obsidian";
import type { Blocks } from "@notion-stuff/v4-types";
import MyPlugin from "../main";

import { NotionToMarkdown } from "notion-to-md";

import { Client } from "@notionhq/client";

import { SimpleMarkdownPage, NotionService } from "./notion-service";

export class DownloadFromNotion {
	app: MyPlugin;
	notionService: NotionService;

	constructor(app: MyPlugin) {
		this.app = app;
		this.notionService = new NotionService(this.app);
	}

	public async downloadPages() {
		const pages = await this.notionService.getPages();
		if (!pages) return;
		const markdownPages: SimpleMarkdownPage[] = [];

		const parser = new NotionToMarkdown({ notionClient: new Client() });

		await Promise.all(
			// Use map instead of foreach to do this in parallel
			pages.map(async (page) => {
				const blocks = await this.notionService.getPageBlocks(page.id);
				if (!blocks) return;

				markdownPages.push({
					title: page.properties.Name.title[0].plain_text,
					id: page.id,
					content: parser.toMarkdownString(
						await parser.blocksToMarkdown(blocks)
					),
				});
			})
		);
		this.writeToFiles(markdownPages);
	}

	private async writeToFiles(mdPages: SimpleMarkdownPage[]) {
		const vault = this.app.app.vault;
		const files = vault.getFiles();
		mdPages.forEach((page) => {
			const file = files.find(
				(file) => file.path === this.getPageFilePath(page)
			);
			if (file) {
				vault.modify(file, this.getFileHeader(page) + page.content);
			} else {
				vault.create(
					this.getPageFilePath(page),
					this.getFileHeader(page) + page.content
				);
			}
		});
	}

	private getPageFilePath(mdPage: SimpleMarkdownPage): string {
		return `${this.app.settings.outputDir}/${mdPage.title}_${mdPage.id}.md`;
	}

	private getFileHeader(mdPage: SimpleMarkdownPage): string {
		return `%%
Note: This page was downloaded from Notion, any changes will be overwritten.
%%
links: [[Notion]]
notion-url: [${mdPage.title}](https://www.notion.so/${
			this.app.settings.notionWorkspace
		}/${mdPage.title.split(" ").join("-")}-${mdPage.id})

---
`;
	}
}
