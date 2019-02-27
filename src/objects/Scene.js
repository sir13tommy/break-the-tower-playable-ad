import 'three/examples/js/loaders/GLTFLoader'
import 'cannon/tools/threejs/CannonDebugRenderer'

import { Group, GLTFLoader, Cache, Box3, CannonDebugRenderer } from 'three';
import * as TWEEN from '@tweenjs/tween.js'
import BlockPart from './BlockPart/BlockPart.js'
import DieBlock from './DieBlock/DieBlock.js'
import MainBall from './MainBall/MainBall'
import BasicLights from './Lights.js';
import utils from '../common/utils';

Cache.enabled = true

let towerScheme = [
  [1, 0, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 0, 1, 1, 1, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 0, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
]

export default class SeedScene extends Group {
  constructor(camera, world) {
    super();
    this.camera = camera
    this.world = world

    this.loader = new GLTFLoader()

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

    utils.fitCameraToObject(this.camera, this.tower)

    window.camera = this.camera
    window.tower = this.tower
  }

  load () {
    this.fileList = [
      { key: 'block_part', url: require('./BlockPart/BlockPart.model.gltf'), loaded: false},
      { key: 'block_unbreak', url: require('./BlockPart/BlockUnbreakable.model.gltf'), loaded: false},
      { key: 'main_ball', url: require('./MainBall/MainBall.model.gltf'), loaded: false},
      { key: 'die_block', url: require('./DieBlock/DieBlock.model.gltf'), loaded: false}
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
      offsetY = this.getTowerSize().y

      row.dieBlock = dieBlock
      row.blockParts = []

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
      }
      let rowSizeY = this.getTowerSize().y - offsetY
      offsetY = this.getTowerSize().y

      row.rowSizeY = rowSizeY
      this.rows.push(row)
    }


    this.tower.children.forEach(child => {
      child.body.position.y -= this.getTowerSize().y * 1.6
    })

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

    this.mainBall.body.addEventListener('kill', () => {
      this.checkRows()
    })

    this.objects.push(this.mainBall)
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
  }

  removeTopRow() {
    let rowToRemove = this.rows.pop()

    this.objectsToRemove.push(rowToRemove.dieBlock, ...rowToRemove.blockParts)

    // move tower up
    this.tower.children.forEach(child => {
      let tween = new TWEEN.Tween(child.body.position)
        .to({y: child.body.position.y + rowToRemove.rowSizeY}, 1000)
        .start()
    })

    if (this.rows.length === 0) {
      this.finishGame()
    }
  }

  finishGame () {
    this.objectsToRemove.push(this.mainBall)
  }

  addInputControls() {
    this.inputData = {
      lastMouseX: 0,
      speedRotationFactor: 20
    }

    let onDocumentMouseDown = ( event ) => {

      event.preventDefault();

      document.addEventListener( 'mousemove', onDocumentMouseMove, false );
      document.addEventListener( 'mouseup', onDocumentMouseUp, false );
      document.addEventListener( 'mouseout', onDocumentMouseOut, false );

      this.inputData.lastMouseX = event.clientX;
    }

    let onDocumentMouseMove = ( event ) => {
        let mouseX = event.clientX;

        let targetRotationX = ( mouseX - this.inputData.lastMouseX) * 0.00025;

        // update tower rotation to use Cannon physics
        let angleStep = targetRotationX * this.inputData.speedRotationFactor
        this.tower.children.forEach(child => {
          let targetAngle = child.userData.angleY + angleStep
          child.body.quaternion.setFromEuler(0, targetAngle, 0, 'XYZ')
          child.userData.angleY = targetAngle
        })
        this.inputData.lastMouseX = event.clientX
    }

    let onDocumentMouseUp = ( event ) => {
        document.removeEventListener( 'mousemove', onDocumentMouseMove, false );
        document.removeEventListener( 'mouseup', onDocumentMouseUp, false );
        document.removeEventListener( 'mouseout', onDocumentMouseOut, false );
    }

    let onDocumentMouseOut = ( event ) => {
        document.removeEventListener( 'mousemove', onDocumentMouseMove, false );
        document.removeEventListener( 'mouseup', onDocumentMouseUp, false );
        document.removeEventListener( 'mouseout', onDocumentMouseOut, false );
    }

    window.addEventListener('mousedown', onDocumentMouseDown, false)
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