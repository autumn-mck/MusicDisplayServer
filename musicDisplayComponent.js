"use strict";

class MusicDisplay extends HTMLElement {
	css = /*css*/ `
:host {
	--albumArtSize: 100px;
	--seekbarPositionMarkerSize: 16px;
	--border-radius: 8px;

	--baseMDC: var(--base, #1e2030);
	--textMDC: var(--text, #cad3f5);
	--accentMDC: var(--accent, #c6a0f6);

	color: var(--textMDC);

	max-width: 30rem;
	width: 100%;
	display: flex;
	margin: 0 auto;

	container-type: inline-size;
	container-name: musicDisplay;
}

#nowPlaying {
	display: grid;
	grid-template-columns: var(--albumArtSize) 1fr;
	grid-template-rows: min-content min-content;
	gap: 0.8rem;

	padding: 0.8rem;
	background-color: var(--baseMDC);
	border: 1px solid var(--accentMDC);
	border-radius: var(--border-radius);
	width: 100%;
}

#artContainer {
	position: relative;
	height: 100%;
	min-height: var(--albumArtSize);
	width: var(--albumArtSize);
	display: flex;
	justify-content: center;
	align-items: center;

	grid-row: 1 / 3;
	grid-column: 1;

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
	}

	&.paused {
		#pauseSymbol {
			display: block;
		}

		#albumArt {
			filter: grayscale(70%) brightness(70%);
		}
	}
}

#info {
	width: 100%;

	grid-row: 1;
	grid-column: 2;

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

	grid-row: 2;
	grid-column: 2;

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
		--albumArtSize: 80px;
		--seekbarPositionMarkerSize: 14px;
		row-gap: 0.5rem;
		padding: 0.5rem;
		align-items: flex-start;
	}

	#artContainer {
		grid-row: 1;
	}

	#progressInfo {
		grid-column: 1 / 3;
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
	<div id="artContainer" aria-hidden="true">
		<img id="albumArt"/>
		<svg id="pauseSymbol" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
			<rect x="30" y="20" width="10" height="60" fill="var(--textMDC)" /> <!-- rx="calc(var(--border-radius) / 2)" when chrome supports it -->
			<rect x="60" y="20" width="10" height="60" fill="var(--textMDC)" />
		</svg>
	</div>
	<div id="info">
		<div id="songInfo">
			<span id="songTitle">Currently offline</span>
			<span id="album"></span>
		</div>
		<span id="artist"></span>
	</div>
	<div id="progressInfo">
		<div id="durationContainer">
			<span id="position">00:00</span> / <span id="duration">00:00</span>
		</div>
		<div id="seekBarContainer">
			<div id="seekBar">
				<div id="seekBarFilled"></div>
			</div>
			<div id="seekBarPositionMarker"></div>
		</div>
	</div>
</div>
`;

	noArtwork = /*html*/ `<?xml version="1.0" encoding="UTF-8"?>
<!-- Created with Inkscape (http://www.inkscape.org/) -->
<svg
   width="400"
   height="400"
   viewBox="0 0 105.83333 105.83333"
   version="1.1"
   id="svg5"
   xmlns="http://www.w3.org/2000/svg"
   xmlns:svg="http://www.w3.org/2000/svg">
  <defs
     id="defs2" />
    <rect
       style="fill:#24273a;stroke-width:0.132291"
       id="rect55"
       width="105.83333"
       height="105.83333"
       x="0"
       y="0" />
    <circle
       style="fill:#494d64;stroke-width:0.066146"
       id="path163"
       cx="52.916668"
       cy="52.916668"
       r="38.232292" />
    <circle
       style="fill:#c6a0f6;stroke-width:0.191042"
       id="path1289"
       cx="52.916668"
       cy="52.916668"
       r="35.189583" />
    <circle
       style="fill:#494d64;stroke-width:0.026321"
       id="circle1394"
       cx="52.916668"
       cy="52.916668"
       r="15.213541" />
    <circle
       style="fill:#1e2030;stroke-width:0.188746"
       id="path4405"
       cx="52.916668"
       cy="52.916668"
       r="12.170834" />
    <circle
       style="fill:#494d64;stroke-width:0.118374;"
       id="path4774"
       cx="52.916668"
       cy="52.916668"
       r="2.9104166" />
</svg>
`;

	/**
	 * @type {WebSocket}
	 */
	webSocket;

	/**
	 * @typedef {import("./playingData.ts").PlayingData} PlayingData
	 */

	/**
	 * @type {PlayingData}
	 */
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
		if (playingData.playState === 0)
			currentPosition = Date.now() - playingData.timestamp + playingData.positionMs;
		currentPosition = Math.min(currentPosition, playingData.durationMs);

		let position = document.getElementById("position");
		position.innerText = new Date(currentPosition).toISOString().slice(14, 19);
	}

	async fetchNowPlaying() {
		const response = await fetch(this.getAttribute("nowPlayingApi"));
		const playingData = await response.json();
		this.lastMessage = playingData;
		this.fullUpdate(playingData);
	}

	/**
	 * @param {PlayingData} playingData
	 */
	async fullUpdate(playingData) {
		if (playingData === undefined) return;

		if (playingData.durationMs === 0) {
			playingData.durationMs = 1;
			playingData.positionMs = 0.33;
		}

		let document = this.shadowRoot;

		let albumArt = document.getElementById("albumArt");
		if (playingData.albumArt) albumArt.src = `data:image/png;base64, ${playingData.albumArt}`;
		else albumArt.src = `data:image/svg+xml;base64, ${btoa(this.noArtwork)}`;

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
		if (playingData.playState === 0)
			currentPosition = Date.now() - playingData.timestamp + playingData.positionMs;

		let artContainer = document.getElementById("artContainer");
		artContainer.classList.toggle("paused", playingData.playState === 1);

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
			seekBarFilled.style.animation = `widen ${playingData.durationMs / 1000}s linear -${
				currentPosition / 1000
			}s forwards`;
			seekBarFilled.style.animationPlayState = playingData.playState === 0 ? "running" : "paused";

			seekBarPositionMarker.style.animation = `moveRight ${
				playingData.durationMs / 1000
			}s linear -${currentPosition / 1000}s forwards`;
			seekBarPositionMarker.style.animationPlayState =
				playingData.playState === 0 ? "running" : "paused";
		}, 100);
	}
}

if (!customElements.get("music-display")) customElements.define("music-display", MusicDisplay);
