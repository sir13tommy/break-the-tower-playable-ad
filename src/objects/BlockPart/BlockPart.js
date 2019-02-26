import { Group, Cache, Box3 } from 'three';
import { Box, Body, Vec3 } from 'cannon'

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

    this._bodyMesh = model.children[0].children[0].children[0]

    // add edges geometry
    var geo = new THREE.EdgesGeometry( this._bodyMesh.geometry, 45);
    var mat = new THREE.LineBasicMaterial( { color: 0x000000, linewidth: 1 } );
    var wireframe = new THREE.LineSegments( geo, mat );
    wireframe.renderOrder = 1; // make sure wireframes are rendered 2nd
    this._bodyMesh.add( wireframe );

    this.add(model)
  }

  getSize () {
    let box3 = new Box3().setFromObject(this)
    return box3.getSize()
  }

  initPhysicsBody () {
    let size = this.getSize()
    let shape = new Box(new Vec3(size.x, size.y, size.z))
    this.body = new Body({
      mass: 0,
      type: Body.KINEMATIC
    })
    this.body.addShape(shape)
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
}
