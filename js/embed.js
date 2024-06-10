//import "modernizer.js";

var btnS,
    strokeW = 4,
    btnW;
var minXY,
    maxX,
    maxY,
    midY;
var navwrap;
//var navitems = {
//    "works" : "works",
//    "resume" : 
//}

function setValues() {
    navwrap = document.querySelector('#nav-wrap');

    btnS = navwrap.offsetHeight - 2 - 8, //Take out bottom border and make some padding
        btnW = btnS + strokeW / 2;
    minXY = strokeW / 2, //3
        maxX = btnS, //36
        maxY = btnS - minXY, //33
        midY = btnS / 2; //18
}

function addMenuBtn() {
    var menuBtn = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    menuBtn.setAttribute('id', 'menu-btn');
    menuBtn.setAttribute('height', btnS);
    menuBtn.setAttribute('width', btnW);
    menuBtn.setAttribute('stroke-width', strokeW);
    menuBtn.setAttribute('onclick', 'menuBtn(this)');
    var topLine = document.createElementNS("http://www.w3.org/2000/svg", "path");
    topLine.setAttribute('d', "M" + minXY + "," + minXY + " L" + maxX + "," + minXY);
    var midLine = document.createElementNS("http://www.w3.org/2000/svg", "path");
    midLine.setAttribute('d', "M" + minXY + "," + midY + " L" + maxX + "," + midY);
    var botLine = document.createElementNS("http://www.w3.org/2000/svg", "path");
    botLine.setAttribute('d', "M" + minXY + "," + maxY + " L" + maxX + "," + maxY);
    menuBtn.appendChild(topLine);
    menuBtn.appendChild(midLine);
    menuBtn.appendChild(botLine);
    navwrap.appendChild(menuBtn);
}

function setDropMenu() {
    var navItems = navwrap.children;
    var j = 1;
    for (var i = 0; i < navItems.length; i++) {
        if (navItems[i].offsetHeight == 0) {
            navItems[i].style['grid-area'] = "op" + j;
            navItems[i].style.display = "inline"; //so it doesn't hide
            navItems[i].querySelector("a").style.color = "var(--color-yellow)";
            j++;
        } else if (navItems[i].tagName != "svg") {
            navItems[i].style['grid-area'] = "current";
        }
    }
}

function menuBtn(x) {
    x.classList.toggle("open");
    navwrap.classList.toggle("open");
    if (x.classList.contains("open")) {
        x.children[0].setAttribute("d", "M" + minXY + "," + minXY + " L" + maxX + "," + maxY);
        x.children[2].setAttribute("d", "M" + minXY + "," + maxY + " L" + maxX + "," + minXY);
    } else {
        //minXY,minXY maxX,minXY
        x.children[0].setAttribute("d", "M" + minXY + "," + minXY + " L" + maxX + "," + minXY);
        x.children[2].setAttribute("d", "M" + minXY + "," + maxY + " L" + maxX + "," + maxY);
    }
}

var header = `
    <div id="head-wrap">
        <div id="title-wrap">
            <span id="head-logo" class="noselect">&lt;valdman-works /&gt;</span>
            <span id="head-sub" class="noselect">audio, music, apps, design</span>
            <a href="http://soundcloud.com/edonv" target="_blank" id="sc-icon" class="styled social"><i class="icon evald-sc"></i></a>
            <a href="http://linkedin.com/in/evaldman" target="_blank" id="li-icon" class="styled social"><i class="icon evald-li"></i></a>
            <a href="mailto:edon@valdman.works" id="mail-icon" class="styled social"><i class="icon evald-mail"></i></a>
        </div>
        <div id="nav-wrap">
            <div class="subnav nav-item works">
                <span><a class="styled nav-link noselect">Works</a></span>
                <div class="subnav-content">
                    <span><a class="styled nav-link sd noselect" href="sd.html">SwiftDex</a></span>
                    <span><a class="styled nav-link ra noselect" href="ra.html">RA Box</a></span>
                    <span><a class="styled nav-link yaya noselect" href="yaya.html">YaYa</a></span>
                </div>
            </div>
            <span class="nav-item res"><a class="styled nav-link res noselect" href="resume.html">Resume</a></span>
            <span class="nav-item abt"><a class="styled nav-link abt noselect" href="about.html">About</a></span>
            <span class="nav-item con"><a class="styled nav-link con noselect" href="contact.html">Contact</a></span>
        </div>
    </div>
    `;



var footer = `
    <div id="foot-wrap">
        &copy; 2019 Valdman Works
    </div>
`;

function embedHeader() {
    //    var el = document.getElementById('header');
    //    var xhttp, response, file;
    //    file = el.getAttribute('src');
    //    var url = document.URL;
    //    file = url.replace(url.substring(url.lastIndexOf('/')+1), "header.html");
    //    if (file) {
    //        xhttp = new XMLHttpRequest();
    //        xhttp.onreadystatechange = function () {
    //            if (this.readyState == 4) {
    //                if (this.status == 200) {
    //                    response.innerHTML = this.responseText;
    //                }
    //                if (this.status == 404) {
    //                    response.innerHTML = "Page not found.";
    //                }
    //                el.removeAttribute("src");
    //                embedHeader();
    //            }
    //        }
    //        xhttp.open("GET", file, true);
    //        xhttp.send();
    //        return;
    //    }

    var body = document.body;
    body.innerHTML = header + body.innerHTML + footer;
    if (Modernizr.touchevents) {
        document.querySelector('.subnav-content').onclick = function () {
            this.classList.toggle("clicked");
        }
    }
    //    if (window.matchMedia("screen and (max-width: 600px)").matches) {
    if (Modernizr.mq("screen and (max-width: 600px)")) {
        setValues();
        addMenuBtn();
        setDropMenu();
    }

}
