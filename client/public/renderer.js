// module aliases
var Engine = Matter.Engine,
	World = Matter.World,
	Composites = Matter.Composites,
	Composite = Matter.Composite,
	Bodies = Matter.Bodies;

// create an engine
var engine = Engine.create();
// engine.world.gravity.scale = 0; //turn off gravity (it's added back in later)

var stackA = Composites.stack(100, 100, 6, 6, 0, 0, function(x, y) {
	return Bodies.rectangle(x, y, 15, 15,{
		// friction: 0,
		// frictionAir: 0,
		// frictionStatic: 0,
		// restitution: 1
	});
	
});
//access stackA elements with:   stackA.bodies[i]   i = 1 through 6x6

var wall = Bodies.rectangle(400, 300, 500, 20, {
	isStatic: true
});
World.add(engine.world, [stackA, wall]);

var offset = 5;
World.add(engine.world, [
	Bodies.rectangle(400, -offset, 800 + 2 * offset, 50, {
		isStatic: true,
	}),
	Bodies.rectangle(400, 600 + offset, 800 + 2 * offset, 50, {
		isStatic: true,
	}),
	Bodies.rectangle(800 + offset, 300, 50, 600 + 2 * offset, {
		isStatic: true,
	}),
	Bodies.rectangle(-offset, 300, 50, 600 + 2 * offset, {
		isStatic: true,
	})
]);

// run the engine
// Engine.run(engine);

//render
var canvas = document.createElement('canvas'),
	ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.body.appendChild(canvas);

window.onresize = function(event) {
	ctx.canvas.width = window.innerWidth;
	ctx.canvas.height = window.innerHeight;
};

(function render() {
	Engine.update(engine, 16);
	var bodies = Composite.allBodies(engine.world);
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.beginPath();
	for (var i = 0; i < bodies.length; i += 1) {
		var vertices = bodies[i].vertices;
		ctx.moveTo(vertices[0].x, vertices[0].y);
		for (var j = 1; j < vertices.length; j += 1) {
			ctx.lineTo(vertices[j].x, vertices[j].y);
		}
		ctx.lineTo(vertices[0].x, vertices[0].y);
	}
	ctx.lineWidth = 1;
	ctx.strokeStyle = '#000000';
	ctx.stroke();
	
	window.requestAnimationFrame(render);
})();