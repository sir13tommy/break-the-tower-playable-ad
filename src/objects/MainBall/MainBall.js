import { Group, Cache, Box3 } from 'three'
import { Sphere, Body, Vec3, Material } from 'cannon'

export default class MainBall extends Group {
  constructor (world) {
    super()
    this.world = world

    this.name = 'Main Ball'

    let model = Cache.get('main_ball').scene.clone(true)
    this.add(model)

    this.initPhysicsBody()
  }

  getSize () {
    let box = new Box3().setFromObject(this)
    return box.getSize()
  }

  initPhysicsBody () {
    let size = this.getSize()
    let shape = new Sphere(size.x);
    let material = new Material()
    this.body = new Body({
      mass: 1,
      linearFactor: new Vec3(0, 1, 0),
      material
    });
    this.body.addShape(shape);
    this.world.addBody(this.body);

    this.body.addEventListener('collide', (event) => {
      this.body.velocity.y = 20
    })
  }
  update () {
    this.position.copy(this.body.position);
    this.quaternion.copy(this.body.quaternion);
  }
}