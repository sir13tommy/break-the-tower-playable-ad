import 'three/examples/js/loaders/GLTFLoader'
import 'cannon/tools/threejs/CannonDebugRenderer'

import { 
  Group,
  GLTFLoader,
  Cache,
  Box3,
  CannonDebugRenderer,
  Points,
  ParticleBasicMaterial,

} from 'three';
import * as TWEEN from '@tweenjs/tween.js'
import BlockPart from './BlockPart/BlockPart.js'
import DieBlock from './DieBlock/DieBlock.js'
import MainBall from './MainBall/MainBall'
import BasicLights from './Lights.js';
import UI from './UI/ui'
import utils from '../common/utils';

Cache.enabled = true

let towerScheme = [
  [2, 0, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 0, 1, 1, 1, 2, 1, 1],
  [0, 1, 1, 1, 1, 1, 0, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
]

export default class SeedScene extends Group {
  constructor(camera, world) {
    super();
    this.camera = camera
    this.world = world

    this.loader = new GLTFLoader()

    this.ui = new UI()

    this.debugRenderer = new CannonDebugRenderer(this, world)

    this.lights = new BasicLights();
    this.add(this.lights);

    this.tower = new Group()
    this.add(this.tower)

    this.objects = []
    this.objectsToRemove = []

    this.load()
  }

  create () {
    this.initTower()
    this.addMainBall()
    this.addInputControls()

    this.ui.show('Swipe to rotate tower', true)
    this.world.allowSleep = true

    this.mainBall.body.sleep()

    utils.fitCameraToObject(this.camera, this.tower)

    this.camera.position.x = 0
    this.camera.position.y = this.getTowerSize().y
    this.camera.lookAt(this.tower.position)
  }

  load () {
    this.fileList = [
      { key: 'block_part', url: require('./BlockPart/BlockPart.model.gltf'), loaded: false},
      { key: 'block_unbreak', url: require('./BlockPart/BlockUnbreakable.model.gltf'), loaded: false},
      { key: 'main_ball', url: require('./MainBall/MainBall.model.gltf'), loaded: false},
      { key: 'die_block', url: require('./DieBlock/DieBlock.model.gltf'), loaded: false},
      { key: 'die_plank', url: require('./BlockPart/DiePlank.model.gltf'), loaded: false}
    ]

    this.fileList.forEach(file => {
      this.loader.load(file.url, (gltf) => {
        file.loaded = true
        Cache.add(file.key, gltf)
        this.checkLoaded()
      })
    })
  }

  checkLoaded () {
    let filesLoaded = true
    if (this.fileList) {
      for (let file of this.fileList) {
        if (!file.loaded) {
          filesLoaded = false
        }
      }
    }
    if (filesLoaded) {
      this.create()
    }
  }

  initTower () {
    let offsetY = 0
    this.rows = []
    for (let y = towerScheme.length - 1; y >= 0; y--) {
      let row = {}

      let dieBlock = new DieBlock(this.world)
      dieBlock.body.position.y = offsetY
      dieBlock.userData.angleY = dieBlock.rotation.y
      dieBlock.update()
      this.tower.add(dieBlock)
      this.objects.push(dieBlock)
      offsetY += dieBlock.getSize().y

      row.dieBlock = dieBlock
      row.blockParts = []

      let maxBlockSizeY = 0
      for (let x = 0; x < towerScheme[y].length; x++) {
        let blockType = towerScheme[y][x]
        let blockPart = new BlockPart(this.world, blockType)
        let blockAngle = (2 * Math.PI / 10) * x
        blockPart.userData.angleY = blockAngle

        blockPart.body.quaternion.setFromEuler(0, blockAngle, 0, 'XYZ')
        blockPart.body.position.y = offsetY + blockPart.getSize().y / 2
        blockPart.update()

        this.tower.add(blockPart)
        this.objects.push(blockPart)
        row.blockParts.push(blockPart)

        let blockSizeY = blockPart.getSize().y
        if (blockSizeY > maxBlockSizeY) {
          maxBlockSizeY = blockSizeY
        }

      }

      let rowSizeY = dieBlock.getSize().y + maxBlockSizeY
      offsetY += maxBlockSizeY

      row.sizeY = rowSizeY
      this.rows.push(row)
    }


    this.tower.children.forEach(child => {
      child.body.position.y -= this.getTowerSize().y * 0.8
    })

    this.checkRows()
    this.update()
  }

  getTowerSize () {
    let towerBox = new Box3().setFromObject(this.tower)
    return towerBox.getSize()
  }

  addMainBall () {
    const offsetBallTower = 7
    this.mainBall = new MainBall(this.world)
    this.add(this.mainBall)

    let towerSize = this.getTowerSize()
    this.mainBall.body.position.y = this.tower.position.y + towerSize.y + offsetBallTower
    this.mainBall.body.position.z = this.tower.position.z + towerSize.z / 2 - this.mainBall.getSize().z / 2

    this.mainBall.body.addEventListener('kill', (event) => {
      this.checkRows()
      this.explode(this.mainBall.position)
    })

    this.mainBall.body.addEventListener('die', (event) => {
      this.explode(this.mainBall.position, 0xffffff)
      this.shakeTower()
    })

    this.mainBall.body.addEventListener('collide', (event) => {
      if (event.body.object.isDie) {
        this.lockUI = true
        this.ui.show('Want to play more?', false, {
          ctaCallback: () => {
            utils.action()
          },
          restartCallback: () => {
            this.restart()
          }
        })
      }
    })

    this.objects.push(this.mainBall)
  }

  explode (position, color) {
    let maxPoints = 25
    color = color || 0xd22f36
    let geometry = new THREE.Geometry()
    let points

    for (let i = 0; i < maxPoints; i++) {
      let vertex = new THREE.Vector3().copy(position)
      let maxExplodeDistance = 60
      let movePosition = new THREE.Vector3(
        -maxExplodeDistance / 2 + Math.random() * maxExplodeDistance,
        -60 * Math.random(),
        -maxExplodeDistance / 2 + Math.random() * maxExplodeDistance
      )

      let explosionTime = 900

      let tween = new TWEEN.Tween(vertex)
        .to({
          x: vertex.x + movePosition.x,
          z: vertex.z + movePosition.z
        }, explosionTime)
        .easing(TWEEN.Easing.Linear.None)
        .start()
        .onUpdate(() => {
          geometry.verticesNeedUpdate = true;
        })

      let tweenY = new TWEEN.Tween(vertex)
        .to({
          y: vertex.y + movePosition.y
        }, explosionTime)
        .easing(TWEEN.Easing.Back.In)
        .start()

      setTimeout(() => {
        this.remove(points)
      }, explosionTime)

      geometry.vertices.push(vertex)
    }

    let material = new THREE.PointsMaterial({
      size: 2,
      color
    })

    points = new THREE.Points(geometry, material)

    this.add(points)
  }

  shakeTower() {
    let tween = new TWEEN.Tween(this.tower.position)
      .to({y: [this.tower.position.y - 1, this.tower.position.y + 1, this.tower.position.y]}, 400)
      .easing(TWEEN.Easing.Bounce.InOut)
      .start()
  }

  checkRows () {
    let topRow = this.rows[this.rows.length - 1]

    let hasAlive = false
    topRow.blockParts.forEach(blockPart => {
      if (blockPart.bodyType === 'block_part' && blockPart.userData.alive) {
        hasAlive = true
      }
    })

    if (!hasAlive) {
      this.removeTopRow()
    }

    topRow.blockParts.forEach(blockPart => {
      blockPart.showDie()
    })
  }

  removeTopRow() {
    let rowToRemove = this.rows.pop()

    this.objectsToRemove.push(rowToRemove.dieBlock, ...rowToRemove.blockParts)

    // move tower up
    this.tower.children.forEach(child => {
      let tween = new TWEEN.Tween(child.body.position)
        .to({y: child.body.position.y + rowToRemove.sizeY}, 1000)
        .start()
    })

    if (this.rows.length === 0) {
      this.finishGame()
    }

    this.checkRows()
  }

  finishGame () {
    this.objectsToRemove.push(this.mainBall)
    this.ui.show('Want to play more?', false, {
      ctaCallback: () => {
        utils.action()
      },
      restartCallback: () => {
        this.restart()
      }
    })
  }

  restart () {
    let parent = this.parent
    let world = this.world
    let camera = this.camera


    this.parent.remove(this)
    let newScene = new SeedScene(camera, world)
    parent.add(newScene)
  }

  addInputControls() {
    this.inputData = {
      lastMouseX: 0,
      speedRotationFactor: 40
    }

    let onDocumentMouseDown = ( event ) => {

      if (this.ui.visible) {
        setTimeout(() => {
          if (!this.lockUI) {
            this.ui.hide()
            this.mainBall.body.wakeUp()
          }
        }, 200)
      }

      this.addEventsListener( ['mousemove', 'touchmove'], onDocumentMouseMove, false );
      this.addEventsListener( ['mouseup', 'touchend'], onDocumentMouseUp, false );
      this.addEventsListener( ['mouseout', 'touchend'], onDocumentMouseOut, false );

      let mouseX
      if (event.clientX !== undefined) {
        mouseX = event.clientX
      } else {
        mouseX = event.touches[0] && event.touches[0].clientX;
      }
      this.inputData.lastMouseX = mouseX
    }

    let onDocumentMouseMove = ( event ) => {
      let mouseX
      if (event.clientX !== undefined) {
        mouseX = event.clientX
      } else {
        mouseX = event.touches[0] && event.touches[0].clientX;
      }

      if (!this.inputData.lastMouseX) {
        this.inputData.lastMouseX = mouseX
      }
      let targetRotationX = ( mouseX - this.inputData.lastMouseX) * 0.00025;

      // update tower rotation to use Cannon physics
      let angleStep = targetRotationX * this.inputData.speedRotationFactor
      this.tower.children.forEach(child => {
        let targetAngle = child.userData.angleY + angleStep
        child.body.quaternion.setFromEuler(0, targetAngle, 0, 'XYZ')
        child.userData.angleY = targetAngle
      })
      this.inputData.lastMouseX = mouseX
    }

    let onDocumentMouseUp = ( event ) => {
        this.removeEventsListener( ['mousemove', 'touchmove'], onDocumentMouseMove, false );
        this.removeEventsListener( ['mouseup', 'touchend'], onDocumentMouseUp, false );
        this.removeEventsListener( ['mouseout', 'touchend'], onDocumentMouseOut, false );
    }

    let onDocumentMouseOut = ( event ) => {
        this.removeEventsListener( ['mousemove', 'touchmove'], onDocumentMouseMove, false );
        this.removeEventsListener( ['mouseup', 'touchend'], onDocumentMouseUp, false );
        this.removeEventsListener( ['mouseout', 'touchend'], onDocumentMouseOut, false );
    }

    this.addEventsListener(['mousedown', 'touchstart'], onDocumentMouseDown, false)
  }

  addEventsListener (events, listener) {
    events.forEach(event => {
      window.addEventListener(event, listener, false)
    })
  }

  removeEventsListener (events, listener) {
    events.forEach(event => {
      window.removeEventListener(event, listener, false)
    })
  }

  update () {
    this.objects.forEach(object => {
      if (object.update && typeof object.update === 'function') {
        object.update.call(object)
      }
    })

    this.objectsToRemove.forEach(object => {
      if (object.userData.alive) {
        object.userData.alive = false
        if (object.parent) {
          object.parent.remove(object)
        }
        if (object.body && object.body.world) {
          object.body.world.remove(object.body)
        }
      }
    })
    this.objectsToRemove = []

    if (this.debugRenderer) {
      this.debugRenderer.update()
    }
  }
}