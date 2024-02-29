class MusicDisplay extends HTMLElement {
	css = /*css*/ `
:host {
    --albumArtSize: 100px;
    --seekbarPositionMarkerSize: 16px;
    --border-radius: 8px;

    --baseMDC: var(--base, #1e2030);
    --textMDC: var(--text, #cad3f5);
    --accentMDC: var(--accent, #ddb6f2);

    color: var(--textMDC);

    max-width: 30rem;
    width: 100%;
    display: flex;

    container-type: inline-size;
    container-name: musicDisplay;
}

#nowPlaying {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 0.8rem;
    background-color: var(--baseMDC);
    border: 1px solid var(--accentMDC);
    border-radius: var(--border-radius);
    gap: 0.8rem;
    width: 100%;
}

#artContainer {
    position: relative;
    height: var(--albumArtSize);
    width: var(--albumArtSize);
    display: flex;
    justify-content: center;
    align-items: center;

    #pauseSymbol {
        position: absolute;
        left: 0;
        filter: drop-shadow(5px 5px 2px var(--baseMDC));
        display: none;
    }

    #albumArt {
        width: var(--albumArtSize);
        max-height: var(--albumArtSize);
        border-radius: var(--border-radius);

        &.paused {
            filter: grayscale(70%) brightness(70%);
        }
    }
}

#info {
    width: 100%;

    #songInfo {
        display: block;

        #songTitle {
            font-weight: bold;
        }
    }

    #artist {
        display: block;
    }
}

#progressInfo {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.6rem;
    margin-top: 1rem;

    #durationContainer {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.4rem;
    }
}

#seekBarContainer {
    width: 100%;
    height: 1rem;
    display: flex;
    align-items: center;
    position: relative;

    #seekBar {
        width: 100%;
        height: 6px;
        background-color: var(--textMDC);
        border-radius: var(--border-radius);
        overflow: hidden;

        #seekBarFilled {
            height: 100%;
            background-color: var(--accentMDC);
            width: 0;

            animation: widen 999999s linear forwards;
        }
    }

    #seekBarPositionMarker {
        width: var(--seekbarPositionMarkerSize);
        height: var(--seekbarPositionMarkerSize);
        background-color: var(--baseMDC);
        border-radius: 50%;
        position: absolute;
        left: 0;
        border: 3px solid var(--accentMDC);
        transform: translateX(-50%);

        animation: moveRight 999999s linear forwards;
    }
}

@container musicDisplay (max-width: 28rem) {
    #nowPlaying {
        padding: 0.5rem;
    }

    #artContainer {
        --albumArtSize: 80px;
    }

    #progressInfo {
        flex-direction: column;
        align-items: flex-start;
    }

    #seekBarContainer {
        --seekbarPositionMarkerSize: 14px;
    }
}

/* animation keyframes for seek bar */
@keyframes moveRight {
    from {
        left: calc(var(--seekbarPositionMarkerSize) / 2);
    }
    to {
        left: calc(100% - var(--seekbarPositionMarkerSize) / 2);
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

	html = /*html*/ `
<div id="nowPlaying">
    <div id="artContainer">
        <img id="albumArt"/>
        <svg id="pauseSymbol" width="var(--albumArtSize)" height="var(--albumArtSize)" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="30" y="20" width="10" height="60" fill="var(--textMDC)" rx="calc(var(--border-radius) / 2)"/>
            <rect x="60" y="20" width="10" height="60" fill="var(--textMDC)" rx="calc(var(--border-radius) / 2)"/>
        </svg>
    </div>
    <div id="info">
        <div id="songInfo">
            <span id="songTitle"></span>
            <span id="album"></span>
        </div>
        <span id="artist"></span>
        <div id="progressInfo">
            <div id="durationContainer">
                <span id="position"></span> / <span id="duration"></span>
            </div>
            <div id="seekBarContainer">
                <div id="seekBar">
                    <div id="seekBarFilled"></div>
                </div>
                <div id="seekBarPositionMarker"></div>
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
			albumArt.classList.add("paused");

			let pauseSymbol = document.getElementById("pauseSymbol");
			pauseSymbol.style.display = "block";
		} else {
			albumArt.classList.remove("paused");

			let pauseSymbol = document.getElementById("pauseSymbol");
			pauseSymbol.style.display = "none";
		}

		let position = document.getElementById("position");
		position.innerText = new Date(currentPosition).toISOString().substr(14, 5);

		let duration = document.getElementById("duration");
		duration.innerText = new Date(playingData.durationMs).toISOString().substr(14, 5);

		let percentComplete = currentPosition / playingData.durationMs;

		let seekBarFilled = document.getElementById("seekBarFilled");
		seekBarFilled.style.width = `${percentComplete * 100}%`;
		seekBarFilled.style.animation = "none";

		let seekBarPositionMarker = document.getElementById("seekBarPositionMarker");
		seekBarPositionMarker.style.left = `calc(${
			percentComplete * 100
		}% + var(--seekbarPositionMarkerSize) / 2 - ${percentComplete} * var(--seekbarPositionMarkerSize))`;

		seekBarPositionMarker.style.animation = "none";

		setTimeout(() => {
			seekBarFilled.style.animation = `widen ${playingData.durationMs / 1000}s linear -${currentPosition / 1000}s forwards`;
			seekBarFilled.style.animationPlayState = playingData.playState === 0 ? "running" : "paused";

			seekBarPositionMarker.style.animation = `moveRight ${playingData.durationMs / 1000}s linear -${
				currentPosition / 1000
			}s forwards`;
			seekBarPositionMarker.style.animationPlayState = playingData.playState === 0 ? "running" : "paused";
		}, 100);
	}
}

customElements.define("music-display", MusicDisplay);
