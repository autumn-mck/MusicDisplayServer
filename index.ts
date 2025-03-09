import { EventEmitter } from "node:events";
import { PlayState, type PlayingData } from "./playingData";

import config from "./config.json";

class PlayingDataEmitter extends EventEmitter {}
const playingDataEmitter = new PlayingDataEmitter();

playingDataEmitter.on("update", (playingData: PlayingData) => {
	console.table({
		...playingData,
		playState: PlayState[playingData.playState],
		albumArt: "base64 encoded",
	});
});

const auth = `Basic ${config.authToken}`;

const notPlayingData: PlayingData = {
	title: "Currently offline",
	artist: "",
	album: "",
	durationMs: 0,
	positionMs: 0,
	playState: PlayState.Offline,
	timestamp: Date.now(),
};

let lastPlayingData: PlayingData = notPlayingData;

Bun.serve({
	port: 3000,
	async fetch(req, server) {
		const url = new URL(req.url);

		if (url.pathname === "/now-playing" && req.method === "POST") {
			if (req.headers.get("Authorization") !== auth)
				return new Response("Unauthorized", { status: 401 });

			const playingData = (await req.json()) as PlayingData;
			playingData.timestamp = Date.now();

			updateNowPlaying(playingData);
			return new Response();
		}

		if (url.pathname === "/now-playing" && req.method === "GET") {
			return new Response(JSON.stringify(lastPlayingData), {
				headers: {
					"Content-Type": "application/json",
					"Access-Control-Allow-Origin": "*",
				},
			});
		}

		if (url.pathname === "/now-playing-ws") {
			if (server.upgrade(req)) return;
			return new Response("Upgrade failed", { status: 500 });
		}

		if (url.pathname === "/") return new Response(Bun.file("index.html"));
		if (url.pathname === "/musicDisplayComponent.js")
			return new Response(Bun.file("musicDisplayComponent.js"), {
				headers: {
					"Content-Type": "application/javascript",
					"Cache-Control": "public, max-age=86400",
				},
			});

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
	if (playingData.playState === PlayState.Offline) {
		playingData = notPlayingData;
	}

	if (!playingData.albumArt) {
		playingData.albumArt = undefined;
	}

	const artistsToHideAlbumArt = config.hiddenAlbumArt.artists;
	const artistName = playingData.artist;

	if (artistsToHideAlbumArt.includes(artistName)) {
		playingData.albumArt = undefined;
	}

	const albumsToHideAlbumArt = config.hiddenAlbumArt.albums;
	const albumName = playingData.album;
	const trackName = playingData.title;

	if (albumName === `${trackName} - Single`) {
		playingData.album = "";
	}

	if (albumsToHideAlbumArt.includes(albumName)) {
		playingData.albumArt = undefined;
	}

	lastPlayingData = playingData;
	playingDataEmitter.emit("update", playingData);
}

function guessWentSilentlyOffline() {
	// if 10 seconds after end of current song and no new song, assume went offline
	const timeSinceLastUpdate = Date.now() - lastPlayingData.timestamp;

	if (timeSinceLastUpdate > lastPlayingData.durationMs + 10000) {
		updateNowPlaying(notPlayingData);
	}
}

setInterval(guessWentSilentlyOffline, 5000);

console.log("Started!");
