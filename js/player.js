function formatSecs(asecs) {
    var secs = parseInt(asecs);
    var mins = parseInt(secs / 60);
    var secs = parseInt(secs % 60);

    //    if (secs < 0) {
    //        secs = 0;
    //    }
    return String(mins) + ":" + ("0" + secs).slice(-2);
}

function fadeIn(el, time) {
    el.volume = 0;
    el.play();
    var last = +new Date();
    var tick = function () {
        el.volume = +el.volume + (new Date() - last) / time;
        last = +new Date();

        if (+el.volume < 1) {
            (window.requestAnimationFrame && requestAnimationFrame(tick)) || setTimeout(tick, 16);
        }
    };

    tick();
}

function fadeOut(el, time) {
    //    el.volume = 1;
    var last = +new Date();
    var tick = function () {
        el.volume = +el.volume - (new Date() - last) / time;
        last = +new Date();

        if (+el.volume > 0) {
            (window.requestAnimationFrame && requestAnimationFrame(tick)) || setTimeout(tick, 16);
        }
    };

    tick();

    el.pause();
}

const sb_template = document.createElement('template');
sb_template.innerHTML = `
    <h1 class="songheader"><slot name="title">A</slot></h1>
    <h2 class="songheader"><slot name="subtitle">A<br>A</slot></h2>
`;

class Songbox extends HTMLElement {
    constructor() {
        super();
        const shadow = this.attachShadow({
            mode: 'open'
        });

        var cssLink1 = document.createElement('link');
        cssLink1.setAttribute("rel", "stylesheet");
        cssLink1.setAttribute("href", "/css/style.css");
        
        var cssLink2 = document.createElement('link');
        cssLink2.setAttribute("rel", "stylesheet");
        cssLink2.setAttribute("href", "/css/player.css");

//        style.textContent = `
//            @import url("css/style.css");
//            @import url("css/player.css");
//        `;

        shadow.appendChild(cssLink1);
        shadow.appendChild(cssLink2);
        shadow.appendChild(sb_template.content.cloneNode(true));
    }
    connectedCallback() {
        const shadow = this.shadowRoot;

        //Add pieces
        var audioPlayer = document.createElement('audio');
        audioPlayer.src = this.getAttribute('src');
        audioPlayer.setAttribute('id', "player");
        audioPlayer.setAttribute('type', "audio/mp3");
        shadow.appendChild(audioPlayer);

        var playbtn = document.createElement('button');
        //    playbtn.innerHTML = "Play";
        playbtn.setAttribute('id', "playbtn");
        playbtn.onclick = function () {
            //            var player = this.previousSibling;
            var ispaused = audioPlayer.paused;

            if (ispaused) {
                //                fadeIn(audioPlayer, 800);
                audioPlayer.play();
                this.firstChild.setAttribute('class', "icon evald-pause");
            } else {
                //                fadeOut(audioPlayer, 1000);
                audioPlayer.pause();
                this.firstChild.setAttribute('class', "icon evald-play");
            }
        }

        //Button Image
        var playIcon = document.createElement('i');
        playIcon.setAttribute('class', "icon evald-play");
        playbtn.appendChild(playIcon);
        shadow.appendChild(playbtn);

        //Time Line + Stamps
        var timebar = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        timebar.setAttribute('id', "timebar");
        //calc'ed to match CSS
        // width - (border + padding) * 2 - left column - gap - right column
        var songboxStyle = window.getComputedStyle(this),
            gridGap = songboxStyle.getPropertyValue('grid-column-gap').replace("px", ""),
            columns = songboxStyle.getPropertyValue('grid-template-columns').split(" "),
            col1 = columns[0].replace("px", ""),
            col2 = columns[1].replace("px", "");
        
        var barCellW = col2;
        var circler = 4.5;
        var circlestroke = 1.5;
        var startX = circler + circlestroke;
        var centerY = col1 / 2;

        //back line
        var backline = document.createElementNS("http://www.w3.org/2000/svg", 'line');
        backline.setAttribute('id', "backline");
        backline.setAttribute('x1', startX);
        backline.setAttribute('y1', centerY);
        backline.setAttribute('x2', (barCellW - startX));
        backline.setAttribute('y2', centerY);
        timebar.appendChild(backline);

        //load line
        var loadline = document.createElementNS("http://www.w3.org/2000/svg", 'line');
        loadline.setAttribute('id', "loadline");
        loadline.setAttribute('x1', startX);
        loadline.setAttribute('y1', centerY);
        loadline.setAttribute('x2', startX);
        loadline.setAttribute('y2', centerY);
        timebar.appendChild(loadline);

        //timedot
        var circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
        circle.setAttribute('id', "timedot");
        circle.setAttribute('cx', startX);
        circle.setAttribute('cy', centerY);
        circle.setAttribute('r', circler);
        timebar.appendChild(circle);

        //Timestamps
        var timestamps = document.createElementNS("http://www.w3.org/2000/svg", 'text');
        timestamps.setAttribute('id', "timestamps");
        timestamps.setAttribute('x', 4);
        timestamps.setAttribute('y', String(centerY + 2.5 + 13));

        //Current Time Stamp
        var ctime = document.createElementNS("http://www.w3.org/2000/svg", 'tspan');
        ctime.setAttribute('id', "ctime");
        ctime.textContent = "<0:00>";
        timestamps.appendChild(ctime);

        //Duration Time Stamp
        var dtime = document.createElementNS("http://www.w3.org/2000/svg", 'tspan');
        dtime.setAttribute('id', "dtime");
        dtime.textContent = "</0:00>";
        dtime.setAttribute('style', "text-anchor: end");
        dtime.setAttribute('x', barCellW - 4);
        timestamps.appendChild(dtime);

        timebar.appendChild(timestamps);

        //Bubble
        var stime = document.createElement('blockquote');
        stime.setAttribute('id', "stime");
        stime.textContent = "<0:00>";

        shadow.appendChild(stime);
        shadow.appendChild(timebar);

        var backrect = backline.getBoundingClientRect();
        var backW = backrect.right - backrect.left;

        //Events for <audio>
        audioPlayer.onprogress = function () {
            if (this.buffered.length != 0) {
                //Add startX to offset x1 = startX
                var newX = startX + (backW * this.buffered.end(0) / this.duration);
                loadline.setAttribute('x2', newX);
            }
        };
        audioPlayer.oncanplay = function () {
            dtime.textContent = "</" + formatSecs(this.duration) + ">";
        }

        audioPlayer.oncanplaythrough = function () {
            loadline.setAttribute('x2', backW + startX);
        };
        audioPlayer.ontimeupdate = function () {
            var newX = startX + (backW * this.currentTime / this.duration);
            circle.setAttribute('cx', newX);

            //UPDATE TIME STAMP TEXT
            ctime.innerHTML = "<" + formatSecs(this.currentTime) + ">";
        };

        //Mouseover Bar Events
        var mousemove = function (event) {
            var hoverX = event.screenX;

            backrect = backline.getBoundingClientRect();
            backW = backrect.right - backrect.left;
            //take out top margin (there is no longer a body margin)
            var bodytop = document.body.getBoundingClientRect().top - 0; 
            stime.style.top = String(backrect.top - bodytop - 20) + "px";

            if (hoverX < backrect.left) {
                hoverX = backrect.left;
            } else if (hoverX > backrect.right) {
                hoverX = backrect.right;
            }

            //new position = hoverX - half of bubble w
            stime.style.left = String(hoverX - 25) + "px";

            var secs = audioPlayer.duration * (hoverX - backrect.left) / backW;
            stime.innerHTML = "<" + formatSecs(secs) + ">";
        };

        //        this._backline = backline;
        backline.addEventListener("mousemove", mousemove, false);
        circle.addEventListener("mousemove", function (event) {
            stime.style.opacity = "1";
            mousemove(event);
        }, false);

        backline.addEventListener("mouseenter", function (event) {
            stime.style.opacity = "1";
        }, false);
        backline.addEventListener("mouseleave", function (event) {
            stime.style.opacity = "0";
        }, false);
        circle.addEventListener("mouseleave", function (event) {
            stime.style.opacity = "0";
        }, false);
        backline.addEventListener("click", function (event) {
            var hoverX = event.screenX;

            backrect = backline.getBoundingClientRect();
            backW = backrect.right - backrect.left;
            if (hoverX < backrect.left) {
                hoverX = backrect.left;
            } else if (hoverX > backrect.right) {
                hoverX = backrect.right;
            }

            //Find time in song
            var secs = audioPlayer.duration * (hoverX - backrect.left) / backW;

            //Check if buffered to there
            var range = audioPlayer.buffered;
            if (secs >= range.start(0) && secs <= range.end(0)) {
                audioPlayer.currentTime = secs;
            }
        }, false);
    }
}

window.customElements.define('song-box', Songbox);
