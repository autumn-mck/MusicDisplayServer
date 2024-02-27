Bun.serve({
    port: 3000,
    async fetch(req) {
        const body = await req.json() as PlayingData;

        console.table({
            ...body, 
            playState: PlayState[body.playState],
            albumArt: "base64 encoded"
        });

        const buffer = Buffer.from(body.albumArt, "base64");
        Bun.write("albumArt.jpg", buffer);

        return new Response();
    }
});

interface PlayingData {
    artist: string;
    title: string;
    album: string;
    durationMs: number;
    positionMs: string;
    playState: PlayState;

    albumArt: string; // base64 encoded
}

enum PlayState {
    Playing,
    Paused,
    Other
}