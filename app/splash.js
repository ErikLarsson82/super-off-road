define('app/splash', [
    'Ob',
    'userInput'
], function (
    Ob,
    userInput
) {    
    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');

    return new Ob.Scene({
        name: 'Splash',
        create: function() {
            context.font = "20px Georgia";
            window.addEventListener('keydown', function(event) {
                this.changeScene('Game')
            }.bind(this))
        },
        destroy: function() {},
        update: function() {},
        draw: function() {
            context.font = "20px Georgia";
            context.fillStyle = "gray";
            context.fillRect(0,0,canvas.width, canvas.height);

            context.fillStyle = "white";
            context.fillText("Press any key to start", 100, 100);
        }
    })
});