import MyPlugin from "main";
import { requestUrl, Notice } from "obsidian";
import type { Blocks } from "@notion-stuff/v4-types";

export interface SimpleMarkdownPage {
	title: string;
	id: string;
	content: string;
}

const API = "https://api.notion.com/v1";

export class NotionService {
	private app: MyPlugin;
	private headers: any;

	constructor(app: MyPlugin) {
		this.app = app;

		this.headers = {
			Accept: "application/json",
			Authorization: "Bearer " + this.app.settings.notionAPI,
			"Notion-Version": "2021-08-16",
		};
	}

	public async getPages(): Promise<any[] | null> {
		const reqBody: any = {
			page_size: 100,
		};
		try {
			const response = await requestUrl({
				url: `${API}/databases/${this.app.settings.databaseID}/query`,
				method: "POST",
				headers: this.headers,
				body: JSON.stringify(reqBody),
			});
			if (response.json.object === "error") throw response.json.message;
			return response.json.results;
		} catch (err) {
			this.handleError(err);
			return null;
		}
	}

	public async getPageBlocks(pageId: string): Promise<Blocks | null> {
		try {
			const response = await requestUrl({
				url: `${API}/blocks/${pageId}/children?page_size=100`,
				method: "GET",
				headers: this.headers,
			});
			if (response.json.object === "error") throw response.json.message;
			return this.fixApiResponse(response.json.results);
		} catch (err) {
			this.handleError(err);
			return null;
		}
	}

	// after a lot of searching in the types I fount out that this is not mapped correctly 😠
	// Use any instead of blocks because blocks will remove the property
	private fixApiResponse(blocks: any): Blocks {
		return blocks.map((block: any) => {
			if (block[block.type]?.text) {
				block[block.type].rich_text = block[block.type].text;
			}
			return block;
		}) as Blocks;
	}

	private handleError(error: any): void {
		console.error(error);
		new Notice(`Obsididan Notion Sync: Something went wrong.\n"${error}"`);
	}
}
