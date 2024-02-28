import { EventEmitter } from "node:events";
import { PlayState, type PlayingData } from "./playingData";

import config from "./config.json";

class PlayingDataEmitter extends EventEmitter {}
const playingDataEmitter = new PlayingDataEmitter();
let lastPlayingData: PlayingData = {
	artist: "",
	title: "",
	album: "",
	durationMs: 0,
	positionMs: 0,
	playState: PlayState.Offline,
	timestamp: Date.now(),
};

playingDataEmitter.on("update", (playingData: PlayingData) => {
	console.table({
		...playingData,
		playState: PlayState[playingData.playState],
		albumArt: "base64 encoded",
	});
});

const auth = `Basic ${config.authToken}`;

// Read NoArtwork.png to base64 encode it
const noArtwork = await Bun.file("NoArtworkBase64.txt").text();

Bun.serve({
	port: 3000,
	async fetch(req, server) {
		const url = new URL(req.url);

		if (url.pathname === "/now-playing" && req.method === "POST") {
			if (req.headers.get("Authorization") !== auth) return new Response("Unauthorized", { status: 401 });

			const playingData = (await req.json()) as PlayingData;
			playingData.timestamp = Date.now();

			updateNowPlaying(playingData);
			return new Response();
		}

		if (url.pathname === "/now-playing" && req.method === "GET") {
			return new Response(JSON.stringify(lastPlayingData), {
				headers: {
					"Content-Type": "application/json",
				},
			});
		}

		if (url.pathname === "/now-playing-ws") {
			if (server.upgrade(req)) return;
			return new Response("Upgrade failed", { status: 500 });
		}

		if (url.pathname === "/") return new Response(Bun.file("index.html"));
		if (url.pathname === "/musicDisplayComponent.js") return new Response(Bun.file("musicDisplayComponent.js"));

		return new Response();
	},
	websocket: {
		open(ws) {
			ws.send(JSON.stringify(lastPlayingData));
			playingDataEmitter.on("update", (playingData: PlayingData) => {
				ws.send(JSON.stringify(playingData));
			});
		},
		message(ws, message) {}, // not used, just used one way
	},
});

function updateNowPlaying(playingData: PlayingData) {
	if (playingData.albumArt) {
		const buffer = Buffer.from(playingData.albumArt, "base64");
		Bun.write("albumArt.jpg", buffer);
	} else {
		Bun.write("albumArt.jpg", Buffer.from(noArtwork, "base64"));
		playingData.albumArt = noArtwork;
	}

	lastPlayingData = playingData;
	playingDataEmitter.emit("update", playingData);
}

console.log("Started!");
