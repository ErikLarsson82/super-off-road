define('app/game', [
    'Ob',
    'underscore',
    'userInput',
    'utils',
    'Box2D',
    'mapLoader',
    'app/images',
    'json!physics_data/map1.json',
    'json!physics_data/car.json'
], function (
    Ob,
    _,
    userInput,
    utils,
    _box2d,
    mapLoader,
    images,
    map1,
    car
) {   
    
    var DEBUG_WRITE_BUTTONS = false;
    var DEBUG_SUPER_IMPOSED = true;
    
    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');

    let gameObjects;
    let customCollisions;
    let lapTracker;
    let world;
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
            this.body.gameObject = this;
            this.name = this.body.name;
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
            
            if (pad.buttons[0].pressed) {
                var currentVelocity = this.body.GetLinearVelocity();
                var limit = 5;
                var goingSlow = (Math.abs(currentVelocity.x) < limit && Math.abs(currentVelocity.y) < limit);
                var magnitude = (goingSlow) ? 0.18 : 0.05;
                const angle = this.body.GetAngle() + Math.PI / 2;
                var vector = {
                    x: Math.cos(angle) * magnitude,
                    y: Math.sin(angle) * magnitude
                }
                this.body.ApplyImpulse(new b2Vec2(vector.x, vector.y), this.body.GetWorldCenter())
            }
            if (pad.buttons[2].pressed) {
                const angle = this.body.GetAngle() + Math.PI / 2;
                var vector = {
                    x: Math.cos(angle) * -0.08,
                    y: Math.sin(angle) * -0.08
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
        draw() {
            context.fillStyle = "white";
            var screenPos = convertToScreenCoordinates(this.body.GetPosition())
            var a = this.body.GetAngle();
            var cars = [
                images.car1,
                images.car2,
                images.car3,
                images.car4,
                images.car5,
                images.car6,
                images.car7,
                images.car8
            ];
            const step = Math.PI * 2 / 8;
            var idx = Math.floor(a / step + step/2) % 8
            if (idx < 0)
                idx = idx + 8;
            context.drawImage(cars[idx], screenPos.x - (images.car1.width/2),screenPos.y - (images.car1.height/2));
        }
    }

    class LapTracker {
        constructor() {
            this.playerIdx = 0;
            this.playerLaps = 0;
            this.timer = new Date();
            this.bestLap = null;
            var idx = 1;
            while(getGameObjectByName('checkpoint' + idx)) {
                customCollisions.push({
                  obj1: 'car',
                  obj2: 'checkpoint' + idx,
                  callback: this.finish.bind(this, idx)
                }); 
                idx++;
            }
            customCollisions.push({
              obj1: 'car',
              obj2: 'finish',
              callback: this.finish.bind(this, 0)
            });
            this.nrOfCheckPoints = idx-1;
        }
        finish(idx) {
            if (idx === this.playerIdx + 1)
                this.playerIdx++;
            
            if (this.playerIdx === this.nrOfCheckPoints && idx === 0) {
                this.playerIdx = 0;
                this.playerLaps++;
                if (this.bestLap === null || Date.now() - this.timer.getTime() < this.bestLap) {
                    this.bestLap = Date.now() - this.timer.getTime();
                }
                this.timer = new Date();
            }
        }
        getFormattedCurrentTime() {
            var lapTime = (Date.now() - lapTracker.timer.getTime()) / 1000;
            return lapTime.toFixed(2);
        }
        getFormattedBestTime() {
            if (this.bestLap) {
                var best = lapTracker.bestLap / 1000;
                return best.toFixed(2)
            } else {
                return "-"
            }
        }
    }

    function getGameObjectByName(name) {
        return _.find(gameObjects, function (v) {
          return v['name'] === name;
        });
    };

    function createAllGameObjects() {
        for (var b = world.m_bodyList; b; b = b.m_next) {
            switch(b.name) {
                case 'car':
                    var player = new Player(world, b, 0, "blue");
                    gameObjects.push(player);
                break;
                case 'finish':
                    var finish = new GameObject(world, b);
                    gameObjects.push(finish);
                break;
                default:
                    gameObjects.push(new GameObject(world, b));
                break;
            }
        }
    }

    function convertToScreenCoordinates(pos) {
        return {
            x: pos.x * 45,
            y: pos.y * -22.5
        }
    }
    function convertToBox2dCoordinates(pos) {
        return {
            x: pos.x / 45,
            y: pos.y / 22.5 * -1
        }
    }

    var debugDraw = new Box2D.Dynamics.b2DebugDraw();
    debugDraw.SetSprite(context);
    debugDraw.SetDrawScale(45.0);
    debugDraw.SetFillAlpha(0.3);
    debugDraw.SetLineThickness(1.0);
    debugDraw.SetFlags(Box2D.Dynamics.b2DebugDraw.e_shapeBit | Box2D.Dynamics.b2DebugDraw.e_jointBit);

    function createContactListener() {
        var contactListener = new Box2D.Dynamics.b2ContactListener();
        contactListener.BeginContact = function(contact) {
            var contactGameObject1 = contact.m_fixtureA.GetBody().gameObject;
            var contactGameObject2 = contact.m_fixtureB.GetBody().gameObject;
            _.each(customCollisions, function(element) {
                var condition1 = element.obj1 === contactGameObject1.name && (element.obj2 === contactGameObject2.name || element.obj2 === null);
                var condition2 = element.obj1 === contactGameObject2.name && (element.obj2 === contactGameObject1.name || element.obj2 === null);
                if (condition1 || condition2) {
                    element.callback();
                }
            });
        };

        contactListener.EndContact = function(contact) {
            var contactGameObject1 = contact.m_fixtureA.GetBody().gameObject;
            var contactGameObject2 = contact.m_fixtureB.GetBody().gameObject;
            _.each(customCollisions, function(element) {
              var condition1 = element.obj1 === contactGameObject1.name && (element.obj2 === contactGameObject2.name || element.obj2 === null);
              var condition2 = element.obj1 === contactGameObject2.name && (element.obj2 === contactGameObject1.name || element.obj2 === null);
              if ((condition1 || condition2) && element.endCallback) {
                element.endCallback();
              }
            });
        };

        return contactListener;
    }

    return new Ob.Scene({
        name: 'Game',
        create: function() {
            gameObjects = [];
            customCollisions = [];
            
            world = new Box2D.Dynamics.b2World(new Box2D.Common.Math.b2Vec2(0, 0), true);
            world.SetDebugDraw(debugDraw);
            world.SetContactListener(createContactListener());

            mapLoader.loadJson(world, map1);
            mapLoader.loadJson(world, car, { x: 11.5486, y: -29.1572 });

            createAllGameObjects();
            
            lapTracker = new LapTracker();
            
            context.font = "20px Georgia";
        },
        destroy: function() {
            gameObjects = null;
            customCollisions = null;
            lapTracker = null;
            world = null;
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

            context.save()
            var scale = (DEBUG_SUPER_IMPOSED) ? -0.5 : -1;
            context.scale(1, scale);
            world.DrawDebugData();
            context.restore();

            context.fillStyle = "gray";
            context.fillRect(0,768,canvas.width, 768);

            if (!DEBUG_SUPER_IMPOSED) {
                context.save();
                context.translate(0, 768);
            }
            
            context.drawImage(images.map1, 0, 0)
            _.each(gameObjects, function(gameObject) {
                gameObject.draw();
            });

            context.fillStyle = "white";
            context.font = "30px Georgia";
            context.fillText("Laps: " + lapTracker.playerLaps, 250, 190)
            context.fillText(lapTracker.getFormattedCurrentTime(), 500, 190)
            context.fillText(lapTracker.getFormattedBestTime(), 600, 190)
            
            if (!DEBUG_SUPER_IMPOSED) {
                context.restore()
            }
        }
    })
});