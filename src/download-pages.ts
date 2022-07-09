import { requestUrl } from "obsidian";
import type { Blocks } from "@notion-stuff/v4-types";
import MyPlugin from "../main";

import { NotionToMarkdown } from "notion-to-md";

import { Client } from "@notionhq/client";

interface SimpleMarkdownPage {
	title: string;
	id: string;
	content: string;
}

export class DownloadFromNotion {
	app: MyPlugin;

	constructor(app: MyPlugin) {
		this.app = app;
	}

	public async downloadPages() {
		const pages = await this.getPages();
		const markdownPages: SimpleMarkdownPage[] = [];

		const parser = new NotionToMarkdown({ notionClient: new Client() });

		await Promise.all(
			// Use map instead of foreach to do this in parallel
			pages.map(async (page) => {
				const blocks = await this.getPageBlocks(page.id);

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

	private async getPages(): Promise<any[]> {
		const bodyString: any = {
			page_size: 100,
		};
		const response = await requestUrl({
			url: `https://api.notion.com/v1/databases/${this.app.settings.databaseID}/query`,
			method: "POST",
			headers: {
				Accept: "application/json",
				// 'User-Agent': 'obsidian.md',
				Authorization: "Bearer " + this.app.settings.notionAPI,
				"Notion-Version": "2021-08-16",
			},
			body: JSON.stringify(bodyString),
		});
		return response.json.results;
	}

	private async getPageBlocks(pageId: string): Promise<Blocks> {
		const response = await requestUrl({
			url: `https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`,
			method: "GET",
			headers: {
				Accept: "application/json",
				// 'User-Agent': 'obsidian.md',
				Authorization: "Bearer " + this.app.settings.notionAPI,
				"Notion-Version": "2021-08-16",
			},
		});
		return response.json.results.map((block: any) => {
			// after a lot of searching in the types I fount out that this is not mapped correctly :angry:
			if (block[block.type]?.text) {
				block[block.type].rich_text = block[block.type].text;
			}
			return block;
		}) as Blocks;
	}
}
