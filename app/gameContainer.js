requirejs.config({
    waitSeconds: '60',
    baseUrl: 'lib',
    paths: {
      'app': '../app',
      'physics_data': '../physics_data',
      'GameLoop': '../node_modules/gameloop-schwein/GameLoop',
      'SpriteSheet': '../node_modules/spritesheet-canvas/SpriteSheet',
      'Box2D': 'Box2D',
    }
});

requirejs([
  'app/game',
  'app/splash',
  'GameLoop',
  'Ob',
], function (game, splash, GameLoop, Ob) {
    
    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');

    const sceneManager = new Ob.SceneManager()
 
    sceneManager.setScenes([game, splash])
     
    sceneManager.changeScene('Game')
    
    var config = {
        callback: function(delta) { sceneManager.update(delta); sceneManager.draw(context, canvas); },
        fpsMode: 'fixed',
        fps: 60,
        autoStart: true,
        createDebugKeyBoardShortcuts: true
    }

    var gameLoop = new GameLoop(config);
})