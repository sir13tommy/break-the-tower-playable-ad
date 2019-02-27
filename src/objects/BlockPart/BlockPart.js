import { Group, Cache, Box3 } from 'three';
import { Box, Body, Vec3 } from 'cannon'
import * as TWEEN from '@tweenjs/tween.js'

export default class BlockPart extends Group {
  constructor(world, type) {
    super();
    this.world = world

    if (type === undefined) {
      type = 0
    }
    if (type === 0) {
      
    }

    this.name = 'Block part';
    this.matrixAutoUpdate = true

    let bodyKey
    switch (type) {
      case 0:
        bodyKey = 'block_unbreak'
        break
      case 1:
        bodyKey = 'block_part'
        break
      default:
        break
    }
    let model = Cache.get(bodyKey).scene.clone(true)

    this.bodyType = bodyKey
    this.userData.alive = true

    this._bodyMesh = model.children[0].children[0].children[0]
    

    // add edges geometry
    var geo = new THREE.EdgesGeometry( this._bodyMesh.geometry, 45);
    var mat = new THREE.LineBasicMaterial( { color: 0x000000, linewidth: 1 } );
    var wireframe = new THREE.LineSegments( geo, mat );
    wireframe.renderOrder = 1; // make sure wireframes are rendered 2nd
    this._bodyMesh.add( wireframe );

    this.add(model)

    this.box = new Box3().setFromObject(this)

    this.initPhysicsBody()
  }

  getSize () {
    return this.box.getSize()
  }

  initPhysicsBody () {
    let size = this.getSize()
    let boxCenter = this.box.getCenter()
    let shape = new Box(new Vec3(size.x / 2, size.y / 2, size.z / 2))
    this.body = new Body({
      mass: 0,
      type: Body.STATIC
    })
    let shapeOffset = new Vec3().copy(boxCenter)
    this.body.addShape(shape, shapeOffset)
    this.body.name = 'Block part'
    this.body.object = this

    this.world.addBody(this.body)
  }

  update () {
    if (this.body) {
      this.position.copy(this.body.position)
      this.quaternion.copy(this.body.quaternion)  
    }
  }

  shake () {
    if (this.bodyType === 'block_unbreak') {
      this.tween = new TWEEN.Tween(this.scale)
        .to({ x: [this.scale.x + 0.2, this.scale.x], y: [this.scale.y - 0.2, this.scale.y]}, 1000)
        .easing(TWEEN.Easing.Elastic.Out)
        .start();

    }
  }
}
