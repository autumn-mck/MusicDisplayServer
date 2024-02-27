import { EventEmitter } from "node:events";
import { PlayState, type PlayingData } from "./playingData";

class PlayingDataEmitter extends EventEmitter { }
const playingDataEmitter = new PlayingDataEmitter();
let lastPlayingData: PlayingData = {
    artist: "",
    title: "",
    album: "",
    durationMs: 0,
    positionMs: "0",
    playState: PlayState.Offline,
    timestamp: Date.now()
}

playingDataEmitter.on("update", (playingData: PlayingData) => {
    console.table({
        ...playingData, 
        playState: PlayState[playingData.playState],
        albumArt: "base64 encoded"
    });
});

Bun.serve({
    port: 3000,
    async fetch(req) {
        const url = new URL(req.url);

        if (url.pathname === "/now-playing" && req.method === "POST") {
            // todo auth
            
            const playingData = await req.json() as PlayingData;
            playingData.timestamp = Date.now();

            updateNowPlaying(playingData);
            return new Response();
        }

        if (url.pathname === "/now-playing" && req.method === "GET") {
            return new Response(JSON.stringify(lastPlayingData), {
                headers: {
                    "Content-Type": "application/json"
                }
            });   
        }

        return new Response();
    }
});

function updateNowPlaying(playingData: PlayingData) {
    if (playingData.albumArt) {
        const buffer = Buffer.from(playingData.albumArt, "base64");
        Bun.write("albumArt.jpg", buffer);
    } else {
        // todo placeholder image
    }

    lastPlayingData = playingData;
    playingDataEmitter.emit("update", playingData);
}

console.log("Started!");
