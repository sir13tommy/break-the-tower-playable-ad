import 'three/examples/js/loaders/GLTFLoader'
import { Group, GLTFLoader, Cache, Box3 } from 'three';
import { Box, Body, Vec3 } from 'cannon'
import BlockPart from './BlockPart/BlockPart.js'
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

    this.lights = new BasicLights();
    this.add(this.lights);

    this.tower = new Group()
    this.add(this.tower)

    this.objects = []

    this.load()
  }

  create () {
    this.initTower()
    this.addMainBall()
    this.addInputControls()

    utils.fitCameraToObject(this.camera, this.tower)
  }

  load () {
    this.fileList = [
      { key: 'block_part', url: require('./BlockPart/BlockPart.model.gltf'), loaded: false},
      { key: 'block_die', url: require('./BlockPart/BlockDie.model.gltf'), loaded: false},
      { key: 'block_unbreak', url: require('./BlockPart/BlockUnbreakable.model.gltf'), loaded: false},
      { key: 'main_ball', url: require('./MainBall/MainBall.model.gltf'), loaded: false}
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
        let blockPart = new BlockPart(this.world, blockType)
        blockPart.rotation.y = (2 * Math.PI / 10) * x
        blockPart.position.y = blockPart.getSize().y * (towerScheme.length - y)

        this.tower.add(blockPart)
        this.objects.push(blockPart)
      }
    }

    this.initTowerPhysicsBody()

    var helper = new THREE.BoundingBoxHelper(this.tower, 0x00ff00);
    helper.update();
    // If you want a visible bounding box
    this.add(helper);

    this.tower.body.position.y -= this.getTowerSize().y * 1.8

    this.update()
  }

  getTowerSize () {
    let towerBox = new Box3().setFromObject(this.tower)
    return towerBox.getSize()
  }

  initTowerPhysicsBody () {
    let size = this.getTowerSize()
    let shape = new Box(new Vec3(size.x, size.y, size.z));
    this.tower.body = new Body({
      mass: 1,
      type: Body.KINEMATIC
    });
    this.tower.body.addShape(shape);
    this.world.addBody(this.tower.body);
  }

  addMainBall () {
    const offsetBallTower = 7
    this.mainBall = new MainBall(this.world)
    this.add(this.mainBall)

    console.log(this.mainBall.getSize())

    this.ballHelper = new THREE.BoundingBoxHelper(this.mainBall, 0xff0000);
    // If you want a visible bounding box
    this.add(this.ballHelper);

    let towerSize = this.getTowerSize()
    this.mainBall.body.position.y = this.tower.position.y + towerSize.y + offsetBallTower
    this.mainBall.body.position.z = this.tower.position.z + towerSize.z / 2 - this.mainBall.getSize().z / 2

    this.objects.push(this.mainBall)
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
        this.tower.rotation.y += (targetRotationX * this.inputData.speedRotationFactor)
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

    if (this.ballHelper) {
      this.ballHelper.update();
    }

    if (this.tower && this.tower.body) {
      this.tower.position.copy(this.tower.body.position);
      this.tower.quaternion.copy(this.tower.body.quaternion);
    }
  }
}