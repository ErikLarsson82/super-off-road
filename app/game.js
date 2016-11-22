define('app/game', [
    'Ob',
    'underscore',
    'userInput',
    'utils'
], function (
    Ob,
    _,
    userInput,
    utils
) {    
    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');

    let gameObjects = [];

    class GameObject {
        constructor(config) {
            this.game = config.game;
            this.hitbox = config.hitbox;
            this.color = config.color || "#444444";
        }
        tick() {
            //Will take approx 2783 to cross screen once
            this.hitbox.x = (this.hitbox.x > canvas.width) ? 0 : this.hitbox.x + 1;
        }
        draw() {
            context.fillStyle = this.color;
            context.fillRect(this.hitbox.x, this.hitbox.y, this.hitbox.width, this.hitbox.height);
        }
    }

    return new Ob.Scene({
        name: 'Game',
        create: function() {
            gameObjects = [];
            gameObjects.push(new GameObject({
                hitbox: {
                    x: 0,
                    y: 0,
                    width: 10,
                    height: 10
                }
            }));
            context.font = "20px Georgia";
        },
        destroy: function() {
            gameObjects = [];
        },
        update: function(delta) {
            _.each(gameObjects, function(gameObject) {
                gameObject.tick(delta);
            });
        },
        draw: function() {
            context.fillStyle = "white";
            context.fillRect(0,0,canvas.width, canvas.height);

            _.each(gameObjects, function(gameObject) {
                gameObject.draw();
            });
        }
    })
});