import { Group, Cache, Box3 } from 'three'
import { Box, Body, Vec3 } from 'cannon'

export default class DieBlock extends Group {
  constructor (world) {
    super()
    this.world = world

    this.name = 'Die Block'

    this.isDie = true
    this.userData.alive = true

    let model = Cache.get('die_block').scene.clone(true)
    this.add(model)

    this.box = new Box3().setFromObject(this)

    this.initPhysicsBody()
  }

  initPhysicsBody () {
    let size = this.box.getSize()
    let shape = new Box(new Vec3(
      size.x / 2,
      size.y / 2,
      size.z / 2
      )
    )
    this.body = new Body({
      mass: 1,
      type: Body.STATIC
    })
    let shapeOffset = new Vec3().copy(this.box.getCenter())
    this.body.addShape(shape, shapeOffset)
    this.world.addBody(this.body)

    this.body.object = this
  }

  getSize() {
    return this.box.getSize()
  }

  update () {
    this.position.copy(this.body.position);
    this.quaternion.copy(this.body.quaternion);
  }
}