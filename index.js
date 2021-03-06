var zon = true; // set to false to turn off console messages from zim
var zns = false; // set to true to require zim namespace - eg. new zim.Frame()

// SCALING OPTIONS
// scaling can have values as follows with full being the default
// "fit"	sets canvas and stage to dimensions and scales to fit inside window size
// "outside"	sets canvas and stage to dimensions and scales to fit outside window size
// "full"	sets stage to window size with no scaling
// "tagID"	add canvas to HTML tag of ID - set to dimensions if provided - no scaling

var scaling = "fit";
var width = 1024;
var height = 768;

// as of ZIM 5.5.0 you do not need to put zim before ZIM functions and classes
var frame = new Frame(scaling, width, height);
frame.on("ready", function () {

    zog("ready from ZIM Frame"); // output string in console

    var stage = frame.stage;
    var stageW = frame.width;
    var stageH = frame.height;
    frame.outerColor = "#333";
    frame.color = "#000";

    // see http://zimjs.com/learn.html for video and code tutorials
    // see http://zimjs.com/docs.html for documentation
    // see http://zimjs.com/bits.html for 64 Interactive Media techniques

    // put your code here (you can delete this sample code)

    var asteroidsAssets = [];

    //loop 6x adding all the asteroid pictures (file name) into the asteroidsAssets array
    loop(6, function (i) {
        asteroidsAssets.push("a" + i + ".png");
    });

    var assets = ["background.png", "start.png", "pod.png", "boom.png", "boom.mp3", "starting.mp3", "ending.mp3"];
    /* 
    starting.mp3 source:
    Track: 32Stitches - Olympus [NCS Release]
    Music provided by NoCopyrightSounds.
    Watch: https://youtu.be/2HhAz5rWzsI
    Free Download / Stream: http://ncs.io/Olympus

    ending.mp3 source:
    Track: RudeLies & Facading - Arabian Nights [NCS Release]
    Music provided by NoCopyrightSounds.
    Watch: https://youtu.be/g-PtIjywmac
    Free Download / Stream: http://ncs.io/ArabianNights
    */

    assets = assets.concat(asteroidsAssets);

    frame.loadAssets(assets, "assets/");

    frame.on("complete", function () {
        //New Item 1: Starting frame
        var start = frame.asset("start.png");
        var startScreen = start.addTo(stage);
        stage.update();

        startScreen.on("click", gamePlay);

        //main game
        function gamePlay() {

            var starting = frame.asset("starting.mp3").play({ volume: .4 });
            start.removeFrom(stage); //remove starting frame

            var background = frame.asset("background.png");
            var backgroundPic = background.addTo(stage);

            var asteroids = new Container().addTo(); //container: hold other display objects, add that container to the current stage

            interval({ min: 1000, max: 4000 }, function () {
                var margin = 200;
                var data = [
                    [rand(stageW), -margin, rand(stageW), stageH + margin],
                    [stageW + margin, rand(stageH), -margin, rand(stageH)],
                    [rand(stageW), stageH + margin, rand(stageW), -margin],
                    [-margin, rand(stageH), stageW + margin, rand(stageH)]
                ];

                //randomly shuffles elements in data array and the new array is now the location array
                var location = shuffle(data)[0];

                var asteroid = frame.asset(shuffle(asteroidsAssets)[0])
                    .clone()
                    .sca(rand(.5, 1))
                    .centerReg(asteroids)
                    .pos(location[0], location[1])
                    .animate({
                        obj: { rotation: 360 * (rand() > .5 ? -1 : 1) },
                        time: rand(3000, 6000),
                        loop: true,
                        ease: "linear"
                    })
                    .animate({
                        override: false,
                        obj: { x: location[2], y: location[3] },
                        time: rand(6000, 12000),
                        ease: "linear"
                    })

            }, null, true);

            var pod = frame.asset("pod.png")
                .sca(.5)
                .centerReg();

            //New item 2: counter box to track asteroids destroyed
            var counter = 0;
            var counterBox = new Label({
                text: counter,
                backing: new Circle(60, "#ffff4d", "white", 3),
                color: "black",
                align: "center"
            })
                .addTo(stage)
                .pos(stageW - 110, stageH - 100);

            //New item 3: timer box to track time in seconds
            var time = 0;
            var timerBox = new Label({
                text: time + " s",
                backing: new Rectangle(240, 60, "orange", "white", 3),
                color: "black",
                align: "center"
            })
                .addTo(stage)
                .pos(stageW - (stageW / 2) - 120, 50);

            stage.update();

            //timer goes up every 1 second
            var timer = interval(1000, function updateTime() {
                timerBox.text = String(++time + " s");
            }, null, false);

            //destroy asteroid after effects, update counter box
            asteroids.on("mousedown", function (e) {
                var explosion = new Sprite(frame.asset("boom.png"), 8, 6)
                    .centerReg()
                    .sca(2)
                    .pos(e.target.x, e.target.y)
                    .run(1000);
                frame.asset("boom.mp3").play();

                e.target.removeFrom();

                counterBox.text = String(++counter);

                stage.update();
            });

            Ticker.add(function () {
                asteroids.loop(function (asteroid) {
                    //if asteroid hits spaceship, remove everything and display message
                    if (asteroid.hitTestCircle(pod)) {
                        zim.animate(starting, { volume: 0 }, 1000);
                        pod.removeFrom();
                        asteroids.removeFrom();
                        var explosion = new Sprite(frame.asset("boom.png"), 8, 6)
                            .centerReg()
                            .sca(2)
                            .pos(pod.x, pod.y)
                            .run(5000);
                        frame.asset("boom.mp3").play();

                        timer.pause();

                        //New item 4: pop up explaining to player they lost
                        var pane = new Pane({
                            width: 672,
                            height: 378,
                            label: "\nThanks for destroying: \n" + counter + " meteorite(s). But.....\n\nYOUR SPECIES IS \nNOW EXTINCT!\n\nSurvival time: " + time + " s.",
                            color: "#f2f2f2",
                            drag: true,
                            modal: false,
                            corner: 12,
                            barColor: "#cccccc",
                            bar: "Exterminated!",
                            close: true,
                            closeColor: "white"
                        })
                            .show();

                        stage.update();
                    }

                    //if player survived for 120 seconds, remove everything and display success message, play music!
                    if (time === 120) {
                        zim.animate(starting, { volume: 0 }, 1000);
                        pod.removeFrom();
                        asteroids.removeFrom();
                        timer.pause();

                        var ending = frame.asset("ending.mp3").play({ volume: .4 });

                        var pane = new Pane({
                            width: 672,
                            height: 378,
                            label: "\nCongratulations! \n\nThanks for clearing: " + counter + " meteorite(s). \n\nSince you survived for 120 seconds, \nyou win!",
                            color: "#f2f2f2",
                            drag: true,
                            modal: false,
                            corner: 12,
                            barColor: "#cccccc",
                            bar: "Success!",
                            close: true,
                            closeColor: "white"
                        })
                            .show();

                        time = 0;
                        stage.update();
                    }
                })
            });

            new MotionController(stage, pod, "keydown");

            stage.update();

        } // end of gamePlay function

    }); // end of complete

}); // end of ready