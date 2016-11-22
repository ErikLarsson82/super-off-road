define('app/game', [
    'Ob',
    'underscore',
    'userInput',
    'utils',
    'Box2D',
    'mapLoader',
    'json!physics_data/map1.json',
    'json!physics_data/car.json'
], function (
    Ob,
    _,
    userInput,
    utils,
    _box2d,
    mapLoader,
    map1,
    car
) {   
    
    var DEBUG_WRITE_BUTTONS = false;
    
    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');

    let gameObjects = [];
    let world = null;
    const FPS = 60;
    const delta = 1.0/FPS;

    var b2Vec2 = Box2D.Common.Math.b2Vec2;

    function debugWriteButtons(pad) {
        if (!DEBUG_WRITE_BUTTONS) return;
        _.each(pad && pad.buttons, function(button, idx) {
            if (button.pressed) console.log(idx + " pressed");
        })
    }

    class GameObject {
        constructor(world, body) {
            this.world = world;
            this.body = body;
            this.markedForRemoval = false;
        }
        tick() {}
        draw() {}
        removeIfApplicable() {
            if (this.markedForRemoval) this.world.DestroyBody(this.body);
        }
    }

    class Player extends GameObject {
        constructor(world, body, id, color) {
            super(world, body);
            this.id = id;
            this.color = color;
            //this.body.SetAngularDamping( 0.1 )
        }
        tick() {
            var pad = userInput.getInput(0);
            debugWriteButtons(pad);

            var rotate = function(v, angle) {
               angle = normaliseRadians(angle);
               return [v[0]* Math.cos(angle)-v[1]*Math.sin(angle),
                       v[0]* Math.sin(angle)+v[1]*Math.cos(angle)];
            }

            var normaliseRadians = function(radians){
                radians=radians % (2*Math.PI);
                if(radians<0) {
                    radians+=(2*Math.PI);
                }
                return radians;
            };

            var dot = function(v1, v2){
               return (v1[0] * v2[0]) + (v1[1] * v2[1]);
            };

            var velocity = this.body.GetLinearVelocity();
            var sideways_axis = rotate((velocity[1]>0) ? [0, 1]:[0, -1] , this.body.GetAngle())
         
            var dotprod = dot([velocity.x, velocity.y], sideways_axis);
            var killedVelocityVector = [sideways_axis[0]*dotprod, sideways_axis[1]*dotprod]

            this.body.SetLinearVelocity(new b2Vec2(killedVelocityVector[0], killedVelocityVector[1]));
            
            if (pad.buttons[2].pressed) {
                const angle = this.body.GetAngle() + Math.PI / 2;
                var vector = {
                    x: Math.cos(angle) * 0.05,
                    y: Math.sin(angle) * 0.05
                }
                this.body.ApplyImpulse(new b2Vec2(vector.x, vector.y), this.body.GetWorldCenter())
            }

            if (pad.buttons[14].pressed) {
                this.body.SetAngularVelocity( 2 )
            }

            if (pad.buttons[15].pressed) {
                this.body.SetAngularVelocity( -2 )
            }
            if (!pad.buttons[14].pressed && !pad.buttons[15].pressed)
                this.body.SetAngularVelocity( 0 )
        }
        draw() {}
    }

    function createAllGameObjects() {
        for (var b = world.m_bodyList; b; b = b.m_next) {
            if (b.name === "car") {
                var player = new Player(world, b, 0, "blue");
                b.gameObject = player;
                gameObjects.push(player);
            }
        }
    }

    function convertToScreenCoordinates(pos) {
        return {
            x: pos.x * 45,
            y: pos.y * -45
        }
    }
    function convertToBox2dCoordinates(pos) {
        return {
            x: pos.x / 45,
            y: pos.y / 45 * -1
        }
    }

    var debugDraw = new Box2D.Dynamics.b2DebugDraw();
    debugDraw.SetSprite(context);
    debugDraw.SetDrawScale(45.0);
    debugDraw.SetFillAlpha(0.3);
    debugDraw.SetLineThickness(1.0);
    debugDraw.SetFlags(Box2D.Dynamics.b2DebugDraw.e_shapeBit | Box2D.Dynamics.b2DebugDraw.e_jointBit);


    return new Ob.Scene({
        name: 'Game',
        create: function() {
            gameObjects = [];
            world = new Box2D.Dynamics.b2World(new Box2D.Common.Math.b2Vec2(0, 0), true);
            world.SetDebugDraw(debugDraw);

            mapLoader.loadJson(world, map1);
            mapLoader.loadJson(world, car, convertToBox2dCoordinates({ x: 300, y: 240}));

            createAllGameObjects();
            
            context.font = "20px Georgia";
        },
        destroy: function() {
            gameObjects = [];
        },
        update: function() {
            _.each(gameObjects, function(gameObject) {
                gameObject.tick(delta);
            });

            world.Step(delta, 4, 4);
        },
        draw: function() {
            context.fillStyle = "white";
            context.fillRect(0,0,canvas.width, canvas.height);

            _.each(gameObjects, function(gameObject) {
                gameObject.draw();
            });

            context.save()
            context.scale(1, -1);
            world.DrawDebugData();
            context.restore();
        }
    })
});