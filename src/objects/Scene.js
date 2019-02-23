import 'three/examples/js/loaders/GLTFLoader'
import { Group, GLTFLoader, Cache, Box3 } from 'three';
import '../lib/physi'
import BlockPart from './BlockPart/BlockPart.js'
import BasicLights from './Lights.js';
import utils from '../common/utils';

Cache.enabled = true

let towerScheme = [
  [1, 0, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 0, 1, 1, 1, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 0, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
]

export default class SeedScene extends Group {
  constructor(camera) {
    super();
    this.camera = camera
    this.loader = new GLTFLoader()

    this.lights = new BasicLights();
    this.add(this.lights);

    this.tower = new Group()
    this.add(this.tower)

    this.load()
  }

  create () {
    this.initTower()

    this.inputData = {
      targetRotationOnMouseDownX: 0,
      targetRotationX: 0,
      mouseXOnMouseDown: 0
    }
    this.speedRotationFactor = 2

    utils.fitCameraToObject(this.camera, this.tower)

    this._addInputControls()
  }

  load () {
    this.fileList = [
      { key: 'block_part', url: require('./BlockPart/BlockPart.model.gltf'), loaded: false},
      { key: 'block_die', url: require('./BlockPart/BlockDie.model.gltf'), loaded: false},
      { key: 'block_unbreak', url: require('./BlockPart/BlockUnbreakable.model.gltf'), loaded: false}
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
    for (let y = towerScheme.length - 1; y >= 0; y--) {
      for (let x = 0; x < towerScheme[y].length; x++) {
        let blockType = towerScheme[y][x]
        let blockPart = new BlockPart(blockType)
        blockPart.rotation.y = (2 * Math.PI / 10) * x
        blockPart.position.y = blockPart.getSize().y * (towerScheme.length - y)
        // top layer should be without die part
        if (y === 0) {
          blockPart.removeDiePart()
        }
        this.tower.add(blockPart)
      }
    }

    let boxTower = new Box3().setFromObject(this.tower)
    this.tower.position.y -= boxTower.getSize().y * 1.5
  }
  
  update () { }

  _addInputControls() {
    let onDocumentMouseDown = ( event ) => {

      event.preventDefault();

      document.addEventListener( 'mousemove', onDocumentMouseMove, false );
      document.addEventListener( 'mouseup', onDocumentMouseUp, false );
      document.addEventListener( 'mouseout', onDocumentMouseOut, false );

      this.inputData.mouseXOnMouseDown = event.clientX;
      this.inputData.targetRotationOnMouseDownX = this.inputData.targetRotationX;
    }

    let onDocumentMouseMove = ( event ) => {

        let mouseX = event.clientX;

        this.inputData.targetRotationX = ( mouseX - this.inputData.mouseXOnMouseDown ) * 0.00025;

        this.tower.rotation.y = this.tower.rotation.y + this.inputData.targetRotationX * this.speedRotationFactor
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
}