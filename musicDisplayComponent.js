class MusicDisplay extends HTMLElement {
	css = `
#nowPlaying {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 0.8rem;
    background-color: var(--base);
    border: 1px solid var(--accent);
    border-radius: 5px;
    gap: 1rem;
    width: 30rem;
}

#albumArt {
    width: 100px;
    max-height: 100px;
    border-radius: 5px;
}

#artContainer {
    position: relative;
    height: 100px;
    width: 100px;
    display: flex;
    justify-content: center;
    align-items: center;
}

#pausedOverlay {
    position: absolute;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    border-radius: 5px;
    justify-content: center;
    align-items: center;
    display: none;
}

#pauseSymbol {
    position: absolute;
    top: 0;
    filter: drop-shadow(0 0 5px var(--base));
    display: none;
}

#songInfo {
    width: 100%;
}

#songTitle {
    font-weight: bold;
}

#artist {
    margin-top: 0.2rem;
    display: block;
}

#seekBarContainer {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 1rem;
    margin-top: 1rem;
}

#seekBar {
    width: 100%;
    pointer-events: none;
    user-select: none;
    display: none;
}

#durationContainer {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.4rem;
}

#styledSeekBarContainer {
    width: 100%;
    height: 1rem;
    display: flex;
    align-items: center;
    position: relative;
}

#styledSeekBar {
    width: 100%;
    height: 6px;
    background-color: var(--text);
    border-radius: 5px;
    overflow: hidden;
}

#styledSeekBarFilled {
    height: 100%;
    background-color: var(--accent);
    width: 0;

    animation: widen 999999s linear forwards;
}

#styledSeekBarPositionMarker {
    width: 16px;
    height: 16px;
    background-color: var(--base);
    border-radius: 50%;
    position: absolute;
    left: 0;
    border: 3px solid var(--accent);
    transform: translateX(-50%);

    animation: moveRight 999999s linear forwards;
}

/* animations for styled seek bar */
@keyframes moveRight {
    from {
        left: 0;
    }
    to {
        left: 100%;
    }
}

@keyframes widen {
    from {
        width: 0;
    }
    to {
        width: 100%;
    }
}
`;

	html = `
<div id="nowPlaying">
    <div id="artContainer">
        <img id="albumArt"/>
        <svg id="pauseSymbol" width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M30 20H40V80H30V20Z" fill="var(--text)"/>
            <path d="M60 20H70V80H60V20Z" fill="var(--text)"/>
        </svg>
    </div>
    <div id="songInfo">
        <span id="songTitle"></span><span id="album"></span>
        <br />
        <span id="artist"></span>
        <div id="seekBarContainer">
            <div id="durationContainer"><span id="position"></span> / <span id="duration"></span></div>
            <div id="styledSeekBarContainer">
                <div id="styledSeekBar">
                    <div id="styledSeekBarFilled"></div>
                </div>
                <div id="styledSeekBarPositionMarker"></div>
            </div>
        </div>
    </div>
</div>
`;

	webSocket;

	lastMessage;

	constructor() {
		super();

		const shadow = this.attachShadow({ mode: "open" });

		shadow.innerHTML = this.html;

		const styleSheet = new CSSStyleSheet();
		styleSheet.replaceSync(this.css);

		shadow.adoptedStyleSheets = [styleSheet];
	}

	connectedCallback() {
		setInterval(() => {
			this.updateProgress();
		}, 1000);

		// shouldn't be needed, but just in case
		setInterval(() => {
			this.fetchNowPlaying();
		}, 10000);

		this.connectWebSocket();
	}

	connectWebSocket() {
		this.webSocket = new WebSocket(this.getAttribute("websocketUrl"));

		this.webSocket.onmessage = (event) => {
			this.lastMessage = JSON.parse(event.data);
			this.fullUpdate(this.lastMessage);
		};

		// on socket close, try to reconnect
		this.webSocket.onclose = () => {
			setTimeout(() => {
				this.connectWebSocket();
			}, 1000);
		};
	}

	async updateProgress() {
		// only #position needs to be updated
		let document = this.shadowRoot;
		let playingData = this.lastMessage;

		let currentPosition = playingData.positionMs;
		if (playingData.playState === 0) currentPosition = Date.now() - playingData.timestamp + playingData.positionMs;
		currentPosition = Math.min(currentPosition, playingData.durationMs);

		let position = document.getElementById("position");
		position.innerText = new Date(currentPosition).toISOString().substr(14, 5);
	}

	async fetchNowPlaying() {
		const response = await fetch(this.getAttribute("nowPlayingApi"));
		const playingData = await response.json();
		this.lastMessage = playingData;
		this.fullUpdate(playingData);
	}

	async fullUpdate(playingData) {
		if (playingData === undefined) return;

		let document = this.shadowRoot;

		let albumArt = document.getElementById("albumArt");
		albumArt.src = `data:image/png;base64, ${playingData.albumArt}`;

		let songTitle = document.getElementById("songTitle");
		songTitle.innerText = playingData.title;

		let artist = document.getElementById("artist");
		artist.innerText = playingData.artist;

		let album = document.getElementById("album");
		if (playingData.album === null || playingData.album === "") {
			album.innerText = "";
		} else {
			album.innerText = ` - ${playingData.album}`;
		}

		let currentPosition = playingData.positionMs;
		if (playingData.playState === 0) currentPosition = Date.now() - playingData.timestamp + playingData.positionMs;

		if (playingData.playState === 1) {
			albumArt.style.filter = "grayscale(70%)";

			let pauseSymbol = document.getElementById("pauseSymbol");
			pauseSymbol.style.display = "block";
		} else {
			albumArt.style.filter = "none";

			let pauseSymbol = document.getElementById("pauseSymbol");
			pauseSymbol.style.display = "none";
		}

		let position = document.getElementById("position");
		position.innerText = new Date(currentPosition).toISOString().substr(14, 5);

		let duration = document.getElementById("duration");
		duration.innerText = new Date(playingData.durationMs).toISOString().substr(14, 5);

		let styledSeekBarFilled = document.getElementById("styledSeekBarFilled");
		styledSeekBarFilled.style.width = `${(currentPosition / playingData.durationMs) * 100}%`;
		styledSeekBarFilled.style.animation = "none";

		let styledSeekBarPositionMarker = document.getElementById("styledSeekBarPositionMarker");
		styledSeekBarPositionMarker.style.left = `${(currentPosition / playingData.durationMs) * 100}%`;
		styledSeekBarPositionMarker.style.animation = "none";

		setTimeout(() => {
			styledSeekBarFilled.style.animation = `widen ${playingData.durationMs / 1000}s linear -${currentPosition / 1000}s forwards`;
			styledSeekBarFilled.style.animationPlayState = playingData.playState === 0 ? "running" : "paused";

			styledSeekBarPositionMarker.style.animation = `moveRight ${playingData.durationMs / 1000}s linear -${
				currentPosition / 1000
			}s forwards`;
			styledSeekBarPositionMarker.style.animationPlayState = playingData.playState === 0 ? "running" : "paused";
		}, 10);
	}
}

customElements.define("music-display", MusicDisplay);
