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

            const linear = this.body.GetLinearVelocity();
            const angle = this.body.GetAngle();
            var vector = {
                x: Math.abs(Math.cos(angle) * 0.05),
                y: Math.abs(Math.sin(angle) * 0.05)
            }
        
            var modX = (linear.x > 0) ? -vector.x : vector.x;
            var modY = (linear.y > 0) ? -vector.y : vector.y;
            console.log(linear, angle, vector, modX, modY)
            this.body.ApplyImpulse(new b2Vec2(modX, modY), this.body.GetWorldCenter())

            if (pad.buttons[0].pressed) {
                //const currentRightNormal = this.body.GetWorldVector( b2Vec2(1,0) );
                
            }

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

            /*if (!(pad && pad.axes && pad.axes[2] && pad.axes[3])) return;

            if (pad && pad.buttons && pad.buttons[4] && pad.buttons[4].pressed) {
                findBodyByName('player1') && findBodyByName('player1').gameObject.markForRemove();
                spawnPlayer(0, ship2);
                
            }

            if (pad && pad.buttons && pad.buttons[5] && pad.buttons[5].pressed) {
                this.thrusting = true;
            } else {
                this.thrusting = false;
            }
            const divider = 100;
            const threshold = 0.5;
            const thrust = 0.05;
            this.axes[0] = pad.axes[2] * -1;
            this.axes[1] = pad.axes[3] * -1;
            this.rotationVector[0] = this.rotationVector[0] + (this.axes[0] - this.rotationVector[0]) / divider;
            this.rotationVector[1] = this.rotationVector[1] + (this.axes[1] - this.rotationVector[1]) / divider;
            const craftAngle = Math.atan2( this.rotationVector[0], this.rotationVector[1] )// - (Math.PI / 2);
            this.body.SetAngle(craftAngle);

            const fixedVector = [Math.cos(craftAngle - (Math.PI / 2)), Math.sin(craftAngle + (Math.PI / 2))];

            if (this.thrusting) {
                this.body.ApplyImpulse(new b2Vec2(fixedVector[0] * -thrust * impulseModifier,
                     fixedVector[1] * thrust * impulseModifier),
                     this.body.GetWorldCenter());
            }*/
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
            mapLoader.loadJson(world, car, convertToBox2dCoordinates({ x: 300, y: 300}));

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