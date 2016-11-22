define('Ob', [], function () {

  class SceneManager {
    constructor() {
      this.scenes = []
      this.currentScene = null
    }
    changeScene(sceneName, nextSceneParams) {

      nextSceneParams = nextSceneParams || {}
      if (this.currentScene) {
        this.currentScene.destroy(nextSceneParams)
      }
      this.currentScene = this.scenes.find(function (scene) {
        return scene.name === sceneName
      })

      if (!this.currentScene) {

      }


      this.currentScene.create(nextSceneParams)
    }
    setScenes(scenes) {

      if (!(scenes instanceof Array)) {

      }

      this.scenes = scenes

      this.scenes.forEach(function (scene) {
        scene.sceneManager = this
      }.bind(this))
    }
    update() {

      this.currentScene.update.apply(this.currentScene, arguments)
    }
    draw() {

      this.currentScene.draw.apply(this.currentScene, arguments)
    }
  }

  class Scene {
    constructor(config) {
      this.name = config.name
      this.ownCreate = config.create
      this.ownUpdate = config.update
      this.ownDraw = config.draw
      this.ownDestroy = config.destroy


    }
    changeScene(sceneName, nextSceneParams) {
      this.sceneManager.changeScene(sceneName, nextSceneParams)
    }
    create() {

      this.ownCreate && this.ownCreate.apply(this, arguments)
    }
    update() {

      this.ownUpdate && this.ownUpdate.apply(this, arguments)
    }
    draw() {

      this.ownDraw && this.ownDraw.apply(this, arguments)
    }
    destroy() {

      this.ownDestroy && this.ownDestroy.apply(this, arguments)
    }
  }

  const Ob = {
    SceneManager: SceneManager,
    Scene: Scene,
  }

  return Ob
})