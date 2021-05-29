var delay = 50;
var comp = {};
comp.transitions = [];
var target;
comp.minGap = 3;
comp.lastFind = 0;


comp.reportFrame = function(time) {
    var self = this;
    this.lastFind = time;
    var num = document.createElement('span');
    num.textContent = time + " ";
    document.querySelector('#moments').appendChild(num);
    comp.transitions.push(time);
    this.addMark(time);
   
};

comp.upImage = async function (data) {
    //for nongallery version, don't save findings
    return Promise.resolve();
        let url = this.url.searchParams.get("event");
    if (url !== "mdocs"){
       return Promise.resolve();
    }
    form = {
        "page": this.hearing,
        "pageImg": c3.toDataURL(),
        "threshold": data.threshold,
	"measure": data.measure,
	"timestamp1": data.pos1,
	"timestamp2": data.pos2
    
    };

    var sData = JSON.stringify(form);
    console.log("sending image");
    try {
        let resp = await fetch("https://illegible.us:3000", {
            method: "post",
            body: sData
        });
        //let jsn = await resp.json();
        //console.log(jsn);
        return Promise.resolve();
        
    } catch (e) {
        console.log("fetch catch backup", e);
    }
};
comp.json = async function(id){
 try {
    var url = "https://oversightmachin.es/oversee/media/video/" + id + ".json";

    console.log(url);
    var record = await fetch(url);
    record = await record.json();
	 console.log(record);
    document.querySelector("#metadata").textContent = JSON.stringify(record,undefined,2);
 } catch(e) {
   throw(e);
 }
}


 var target;
 var url = new URL(window.location.href);
    if (url.searchParams.get("v")) {
        target = url.searchParams.get("v");
    } else {
        target = "180509_0930";
    }
        console.log(video.src);
        comp.json(target);
        video.src = "https://oversightmachin.es/oversee/media/video/" + target + ".mp4";
        video.load();
        console.log(video.src);



comp.setup = async function() {

    var self = this;
    this.hearing = '180509_0930';
    this.roughThreshold = 100;
    this.finds = 0;	
    this.roughInterval = 60.3;
    this.fineThreshold = 90;
    this.fineInterval = 2.31;
    this.ultraThreshold = 65;
    this.ultraInterval = 0.304;
    this.pos1 = 0;
    this.pos2 = 0;
    this.video = document.querySelector('video');
    this.c1 = document.getElementById('c1');
    this.ctx1 = this.c1.getContext('2d');
    this.c2 = document.getElementById('c2');
    this.ctx2 = this.c2.getContext('2d');
    this.c3 = document.getElementById('c3');
    this.ctx3 = this.c3.getContext('2d');
    console.log("a");

	
	/* try {

    var record = await fetch("https://oversightmachin.es/mdocs/" + this.hearing + ".json");
    record = await record.json();
    var highest = 0;
	for (let r of record){
	   if (r.timestamp2 > highest)
		highest = r.timestamp2;
	}
    } catch {
	    console.log("it's ok");
    } */

	console.log("b");
    /*this.socket = io.connect("http://localhost:3000");
    this.socket.emit('subscribe', {
        hearing: this.hearing,
        name: 'shot'
    });*/
    this.mode = "rough";
    this.cur = document.querySelector("#cur");
    this.video.addEventListener("canplay", function() {
        console.log('asdfg');
        this.pause();
        self.width = self.video.videoWidth;
        self.height = self.video.videoHeight;
        this.removeEventListener("canplay", arguments.callee);

        self.advance();
    }, false);

    this.video.addEventListener("error", function(error) {
        console.log("UH OH");
        console.log(error);
        console.log(error.target.error);
        video.load();
        comp.advance();
    }, true);


};




comp.advance = function() {
    if (this.stop) {
        return false;
    }
    var interval;
    if (this.mode === "rough") {
        interval = this.roughInterval;
        threshold = this.roughThreshold;
        delay = 50;
    } else if (this.mode === "fine") {
        interval = this.fineInterval;
        threshold = this.fineThreshold;
        delay = 350;
    } else if (this.mode === "ultra") {
        interval = this.ultraInterval;
        threshold = this.ultraThreshold;
        delay = 525;
    }
    var self = this;
    try {
        this.ctx1.drawImage(this.video, 0, 0, this.width, this.height);
    } catch (e) {
        if (e.name == "NS_ERROR_NOT_AVAILABLE") {
            // Wait a bit before trying again; you may wish to change the
            // length of this delay.
            setTimeout(comp.advance, 100);
        } else {
            throw e;
        }
    }
    this.video.addEventListener('seeked', function() {
        self.video.removeEventListener('seeked', arguments.callee);

        var pct = (self.video.currentTime / self.video.duration * 100) + "%";
        self.cur.style.left = pct;


        self.ctx2.drawImage(self.video, 0, 0, self.width, self.height);

        self.ctx3.globalCompositeOperation = "source-over";
        self.ctx3.drawImage(self.c1, 0, 0, self.width, self.height);
        self.ctx3.globalCompositeOperation = "difference";
        self.ctx3.drawImage(self.c2, 0, 0, self.width, self.height);

        var pixels = self.ctx3.getImageData(0, 0, self.width, self.height);


        var br = 0;
        for (var i = 0, n = pixels.data.length; i < n; i += 4) {
            var red = pixels.data[i];
            var green = pixels.data[i + 1];
            var blue = pixels.data[i + 2];
            br = br + red + green + blue;
        }
        var thresh = (br / (self.width * self.height)).toFixed(4);
        var meter = document.querySelector('#meter');
        var metadata = document.querySelector('#metadata');
        meter.textContent = self.video.currentTime + " " + thresh;
        if (thresh > threshold) {
	    self.finds++;
	   
            if (self.mode === "rough") {
                console.log(thresh);
                console.log('threshold passed ' + threshold + ', moving to fine at ' + self.video.currentTime);
                self.mode = "fine";
                metadata.style.opacity = '0';
                self.video.currentTime = self.video.currentTime - interval;

            } else if (self.mode === "fine") {
                console.log('threshold passed ' + threshold + ', moving to ultra at ' + self.video.currentTime);

                self.mode = "ultra";
                self.video.currentTime = self.video.currentTime - interval;
            } else {
                console.log('threshold passed ' + threshold + ', recording transition at ' + self.video.currentTime);
		if (self.video.currentTime > self.lastFind + self.minGap){
                delay = 10000;
                comp.reportFrame(self.video.currentTime);
                self.upImage({ threshold: threshold, measure: thresh, pos1: self.pos1, pos2: self.pos2});

		self.mode = "fine";
                meter.classList.add('hit');
		}
            }
        } else {
            meter.classList.remove('hit');
        }
	if (self.finds > 80){
		window.location.assign("https://oversightmachin.es/oversee");
	}
        window.setTimeout(function() {
            
            comp.advance();
        }, delay);
    }, false);
    this.pos1 = this.video.currentTime;
    this.pos2 = (this.video.currentTime + interval).toFixed(4);
    this.video.currentTime = (this.video.currentTime + interval).toFixed(4);

};

comp.addMark = function(seconds) {
    console.log('adding ' + seconds);
    var add = document.createElement('div');
    add.id = 'loc' + seconds;
    add.classList.add('loc');

    document.querySelector('#durbar').appendChild(add);
    var pct = (seconds / this.video.duration * 100) + "%";
    console.log(seconds + " " + this.video.duration + " " + pct);
    add.style.left = pct;
};

function secondsToSMPTE(seconds, framerate) {
    var f = Math.floor((seconds % 1) * framerate);
    var s = Math.floor(seconds);
    var m = Math.floor(s / 60);
    var h = Math.floor(m / 60);
    m = m % 60;
    s = s % 60;

    return h + ":" + m + ":" + s + "." + f;
}

document.querySelector('video').addEventListener('loadedmetadata', function() {
    console.log('meta loaded');
    for (var i = 0; i < document.querySelectorAll('canvas').length; i++) {
        var canvas = document.querySelectorAll('canvas')[i];

        canvas.style.width = document.querySelector('video').videoWidth;
        canvas.style.height = document.querySelector('video').videoHeight;
    }
    comp.setup();
    var rando = Math.floor(Math.random() * 2);
    if (rando && comp.highest > document.querySelector('video').duration - 300){
//	document.querySelector('video').currentTime = comp.highest	    
    }
});

document.querySelector('video').addEventListener('seeked', function() {
   let v = document.querySelector('video');
   if (v.currentTime > v.duration - 50){
	   console.log("RELOADING");
	   window.location.reload();

   }
});

