var VirtualSpin = require('./jaxcore-virtualspin');

document.addEventListener('DOMContentLoaded', function (e) {
    var canvas = document.getElementById('canvas');

    var ledElms = [];
    var ledsElm = document.getElementById('leds');
    var div;
    for (var i=0;i<24;i++) {
        div = document.createElement('div');
        div.id = 'led-'+i;
        div.className = 'led';
        ledsElm.appendChild(div);
        ledElms.push(div);
    }

    var spin = new VirtualSpin({
        elm: canvas,
        ledElms: ledElms
    });

    window.spin = spin;

    // spin.on('rotate', function(angle) {
    //     console.log('angle = '+angle);
    // });

    spin.on('spin', function (direction, position) {
        console.log('on spin position = ' + position + ' direction = '+direction+' angle = ' + spin.angle);
        var color;
        if (spin.knobPushed) color = [255,0,255];
        else if (spin.buttonPushed) color = [255,255];
        else color = [0,0,255];
        spin.rotateLeds(direction, color);
    });

    spin.on('knob-pushed', function() {
        console.log('on knob-pushed');
        var color = spin.buttonPushed? [0,255,0]:[255,0,0];
        spin.flashColor(color);
    });

    spin.on('knob-released', function() {
        console.log('on knob-released');
        spin.ledsOff();
    });

    spin.on('button-pushed', function() {
        console.log('on button-pushed');
        spin.ledsOn([0,0,255]);
    });

    spin.on('button-released', function() {
        console.log('on button-released');
        spin.ledsOff();
    });

    spin.on('print', function(data) {
        console.log('print: '+data);
    });

    spin.startSimulation();

    window.startSpinLeft = function () {
        spin.startSpinLeft();
    }
    window.stopSpinLeft = function () {
        spin.stopSpinLeft();
    }

    window.startSpinRight = function () {
        spin.startSpinRight();
    }

    window.stopSpinRight = function () {
        spin.stopSpinRight();
    }

    window.rotateLeft = function () {
        spin.rotateLeft();
    }

    window.rotateRight = function () {
        spin.rotateRight();
    }

    window.pushKnob = function () {
        if (window.knobHeld) return;
        spin.pushKnob();
    }

    window.releaseKnob = function () {
        if (window.knobHeld) return;
        spin.releaseKnob();
    }

    window.pushButton = function () {
        if (window.buttonHeld) return;
        spin.pushButton();
    }

    window.releaseButton = function () {
        if (window.buttonHeld) return;
        spin.releaseButton();
    }

    window.knobHeld = false;
    window.toggleHoldKnob = function () {
        window.knobHeld = !window.knobHeld;
        if (window.knobHeld) {
            spin.pushKnob();
            document.getElementById('holdknob').innerHTML = 'Release Knob';
        }
        else {
            spin.releaseKnob();
            document.getElementById('holdknob').innerHTML = 'Hold Knob';
        }
    }

    window.buttonHeld = false;
    window.toggleHoldButton = function () {
        window.buttonHeld = !window.buttonHeld;
        if (window.buttonHeld) {
            spin.pushButton();
            document.getElementById('holdbutton').innerHTML = 'Release Button';
        }
        else {
            spin.releaseButton();
            document.getElementById('holdbutton').innerHTML = 'Hold Button';
        }
    }

}, false);
