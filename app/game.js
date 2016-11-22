define('app/game', [
    'Ob',
    'underscore',
    'userInput',
    'utils',
    'Box2D',
    'mapLoader',
    'json!physics_data/map1.json',
    'json!physics_data/ship1.json'
], function (
    Ob,
    _,
    userInput,
    utils,
    _box2d,
    mapLoader,
    map1,
    ship1
) {   
    
    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');

    let gameObjects = [];
    let world = null;
    const FPS = 60;
    const delta = 1.0/FPS;

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
            mapLoader.loadJson(world, ship1, convertToBox2dCoordinates({ x: 50, y: 50}));
            
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