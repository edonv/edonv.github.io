const crsl_template = document.createElement('template');
crsl_template.innerHTML = `
    <div class="carousel-frame">
        <div class="allslides">
            <a class="prev noselect">&#10094;</a>
            <a class="next noselect">&#10095;</a>
        </div>

        <div class="slide-caption"></div>
        <div class="dot-div"></div>
    </div>`;

class HTMLBaseElement extends HTMLElement {
    constructor() {
        const self = super();
        self.parsed = false; // guard to make it easy to do certain stuff only once
        self.parentNodes = [];
        return self;
    }

    setup() {
        // collect the parentNodes
        let el = this;
        while (el.parentNode) {
            el = el.parentNode
            this.parentNodes.push(el)
        }
        // check if the parser has already passed the end tag of the component
        // in which case this element, or one of its parents, should have a nextSibling
        // if not (no whitespace at all between tags and no nextElementSiblings either)
        // resort to DOMContentLoaded or load having triggered
        if ([this, ...this.parentNodes].some(el => el.nextSibling) || document.readyState !== 'loading') {
            this.childrenAvailableCallback();
        } else {
            this.mutationObserver = new MutationObserver(() => {
                if ([this, ...this.parentNodes].some(el => el.nextSibling) || document.readyState !== 'loading') {
                    this.childrenAvailableCallback()
                    this.mutationObserver.disconnect()
                }
            });

            this.mutationObserver.observe(this, {
                childList: true
            });
        }
    }
}

class Carousel extends HTMLBaseElement {
    constructor() {
        super();
        var shadow = this.attachShadow({
            mode: 'open'
        });

        this._captions = [];
        this._slideIndex;
        var style = document.createElement('style');

        style.textContent = `
            @import url("css/style.css");
            @import url("css/carousel.css");`;

        shadow.appendChild(style);
        shadow.appendChild(crsl_template.content.cloneNode(true));

        //onclick="plusSlides(-1)
        //onclick="plusSlides(1)"
        var prevnext = shadow.children[1].children[0].getElementsByTagName('a');
        prevnext[0].onclick = function () {
            shadow.host.plusSlides(-1);
        };
        prevnext[1].onclick = function () {
            shadow.host.plusSlides(1);
        };
    }
    connectedCallback() {
        super.setup()
    }
    childrenAvailableCallback() {
        const shadow = this.shadowRoot;
        const allSlidesDiv = shadow.children[1].children[0];
        const dotsDiv = shadow.children[1].children[2];

        //        var imgs = document.getElementById("crslimgs").content.children;
        var imgs = this.children;
        var gridCols = "";
        var dotW = (dotsDiv.offsetWidth - (imgs.length - 1) * 4) / imgs.length;
        for (var i = 0; i < imgs.length; i++) {
            //Img Stuff
            var imgDiv = document.createElement('div');
            imgDiv.setAttribute('class', 'slide');

            var imgElem = document.createElement('img');
            this._captions.push(imgs[i].getAttribute('desc'));
            imgElem.setAttribute('src', imgs[i].getAttribute('src'));
            imgElem.setAttribute('style', 'width:100%');
            imgDiv.appendChild(imgElem);
            allSlidesDiv.appendChild(imgDiv);

            //Dot Stuff
            var newDot = document.createElement('span');
            if (i == 0) {
                newDot.setAttribute('class', 'picdot active');
            } else {
                newDot.setAttribute('class', 'picdot');
            }

            newDot._dotNum = i;
            newDot.onclick = function () {
                shadow.host.currentSlide(this._dotNum);
            };

//            var colNum = 1 + i * 2;
//            newDot.style["grid-area"] = '1 / ' + String(colNum) + ' / 1 / ' + String(colNum);
//            newDot.style.width = String(dotW) + "px";
//            gridCols += " auto";

            dotsDiv.appendChild(newDot);
        }
        dotsDiv.style["grid-template-columns"] = gridCols;

        this._slideIndex = 0;
        this.showSlides(this._slideIndex);

    }
    plusSlides(n) {
        this.showSlides(this._slideIndex += n);
    }
    currentSlide(n) {
        this.showSlides(this._slideIndex = n);
    }
    showSlides(n) {
        var slides = this.shadowRoot.children[1].children[0].getElementsByTagName('div');
        //            document.getElementsByClassName("slide");
        var dots = this.shadowRoot.children[1].children[2].children;
        //            document.getElementsByClassName("picdot");
        if (n == slides.length) {
            this._slideIndex = 0;
        }
        if (n < 0) {
            this._slideIndex = slides.length - 1;
        }
        for (var i = 0; i < slides.length; i++) {
            slides[i].style.display = "none";
            dots[i].className = dots[i].className.replace(" active", "");
        }
        slides[this._slideIndex].style.display = "grid";
        dots[this._slideIndex].className += " active";
        this.shadowRoot.children[1].children[1].innerHTML = "<h2>" + this._captions[this._slideIndex] + "</h2>";
    }
}



//var slideIndex;
//
//function plusSlides(n) {
//    showSlides(slideIndex += n);
//}
//
//function currentSlide(n) {
//    showSlides(slideIndex = n);
//}
//
//function showSlides(n) {
//    var slides = document.getElementsByClassName("slide");
//    var dots = document.getElementsByClassName("picdot");
//    if (n == slides.length) {
//        slideIndex = 0;
//    }
//    if (n < 0) {
//        slideIndex = slides.length - 1;
//    }
//    for (var i = 0; i < slides.length; i++) {
//        slides[i].style.display = "none";
//        dots[i].className = dots[i].className.replace(" active", "");
//    }
//    slides[slideIndex].style.display = "grid";
//    dots[slideIndex].className += " active";
//    //    this.shadowRoot.children[1].children[1].textContent = this._captions[n];
//}
//
//function setup() {
//    // Grid Setup
//    var dots = document.getElementsByClassName("picdot");
//    var dotdiv = document.getElementsByClassName("dot-div")[0];
//    var gridCols = "";
//    var dotW = (dotdiv.offsetWidth - (dots.length - 1) * 4) / dots.length;
//    for (var i = 0; i < dots.length; i++) {
//        var colNum = 1 + i * 2;
//        dots[i].style["grid-area"] = '1 / ' + String(colNum) + ' / 1 / ' + String(colNum);
//        dots[i].style.width = String(dotW) + "px";
//
//        dots[i].setAttribute('onclick', 'currentSlide(' + i + ')');
//
//        gridCols += " auto";
//    }
//    dotdiv.style["grid-template-columns"] = gridCols;
//
//    slideIndex = 0;
//    showSlides(slideIndex);
//
//    var prevnext = document.querySelectorAll('.allslides > a');
//    prevnext[0].onclick = function () {
//        plusSlides(-1);
//    };
//    prevnext[1].onclick = function () {
//        plusSlides(1);
//    };
//}



window.customElements.define('my-carousel', Carousel);
