import { Group, Cache, Box3 } from 'three'
import { Sphere, Body, Vec3, Material } from 'cannon'

export default class MainBall extends Group {
  constructor (world) {
    super()
    this.world = world

    this.name = 'Main Ball'

    let model = Cache.get('main_ball').scene.clone(true)
    this.add(model)

    let scaleFactor = 0.5
    this.scale.set(scaleFactor, scaleFactor, scaleFactor)

    this.userData.alive = true
    this.objectsToRemove = []

    this.initPhysicsBody()
  }

  getSize () {
    let box = new Box3().setFromObject(this)
    return box.getSize()
  }

  initPhysicsBody () {
    let size = this.getSize()
    let radius = size.x / 2
    let shape = new Sphere(radius);
    let material = new Material()
    this.body = new Body({
      mass: 1,
      linearFactor: new Vec3(0, 1, 0),
      material
    });
    let shapeOffset = new Vec3(0, radius, 0)
    this.body.addShape(shape, shapeOffset);
    this.world.addBody(this.body);

    this.body.angularDamping = 1

    this.body.addEventListener('collide', (event) => {
      this.needToJump = true

      // remove block
      if (event.body.object.isDie) {
        this.objectsToRemove.push(this)

        this.body.dispatchEvent({
          type: 'die',
          object: event.body.object
        })
      }

      if (event.body.object.bodyType === 'block_part') {
        event.body.object.kill()

        this.body.dispatchEvent({
          type: 'kill',
          object: event.body.object
        })
      }

      if (event.body.object.bodyType === 'block_unbreak') {
        event.body.object.shake()
      }
    })
  }

  jump() {
    this.body.velocity.set(0, 50, 0)
  }

  kill (object) {
    this.objectsToRemove.push(object)
  }

  update () {
    this.objectsToRemove.forEach(object => {
      object.userData.alive = false
      if (object.parent) {
        object.parent.remove(object)
      }
      if (object.body.world) {
        object.body.world.remove(object.body)
      }
    })
    this.objectsToRemove = []

    if (this.body) {
      this.body.velocity.x = 0
      this.body.velocity.z = 0

      if (this.needToJump) {
        this.jump()
        this.needToJump = false
      }
  
      this.position.copy(this.body.position);
      this.quaternion.copy(this.body.quaternion);
    }
  }
}