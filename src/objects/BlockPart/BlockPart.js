import { Group, Cache, Box3, Vector3 } from 'three';
import { Box, Body, Vec3 } from 'cannon'
import * as TWEEN from '@tweenjs/tween.js'

export default class BlockPart extends Group {
  constructor(world, type) {
    super();
    this.world = world

    if (type === undefined) {
      type = 0
    }

    this.name = 'Block part';
    this.matrixAutoUpdate = true

    let bodyKey
    let hasDie = false
    let dieType
    switch (type) {
      case 0:
        bodyKey = 'block_unbreak'
        break
      case 1:
        bodyKey = 'block_part'
        break
      case 2:
        bodyKey = 'block_part'
        hasDie = true
        dieType = 'die_plank'
        break
      case 3:
        bodyKey = 'block_part'
        hasDie = true
        dieType = 'die_cone'
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

    if (hasDie) {
      this.addDiePlank(dieType)
    }
  }

  getSize () {
    return this.box.getSize()
  }

  getAbsolutePosition () {
    let center = this.box.getCenter()

    return new Vector3(
      this.x - center.x,
      this.y - center.y,
      this.z - center.z
    )
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
    this.hasBody = true

    this.bodiesToRemove = []

    this.world.addBody(this.body)
  }

  addDiePlank (dieType) {
    let model = Cache.get(dieType).scene.clone(true)

    this.add(model)

    let plankBox = new Box3().setFromObject(model)
    this.plankBox = plankBox
    this.diePlank = model
    this.diePlank.isDie = true
    this.diePlank.visible = false

    this.initDiePlankBody()
    
    // this.diePlank.rotation.y = this.diePlank.rotation.y - 0.3
    let rotationY = this.diePlank.rotation.y
    this.tween = new TWEEN.Tween(this.diePlank.rotation)
      .to({y: rotationY + 0.6}, 2000)
      .easing(TWEEN.Easing.Linear.None)
      .yoyo(true)
      .repeat(Infinity)
      .onUpdate(() => {
        
      })
      // .start()
  }

  initDiePlankBody() {
    let size = this.plankBox.getSize()
    let boxCenter = this.plankBox.getCenter()
    let shape = new Box(new Vec3(size.x / 2, size.y / 2, size.z / 2))
    this.diePlank.body = new Body({
      mass: 0,
      type: Body.STATIC
    })
    let shapeOffset = new Vec3().copy(boxCenter)
    this.diePlank.body.addShape(shape, shapeOffset)
    this.diePlank.body.name = 'Plank Die'
    this.diePlank.body.object = this.diePlank

    this.world.addBody(this.diePlank.body)
  }

  kill () {
    this.userData.alive = false
    this.destroy()
  }

  destroy () {
    this.removeBody()
    this.removeObject()
  }

  removeBody () {
    if (this.hasBody) {
      this.bodiesToRemove.push(this.body)
      this.hasBody = false
    }
    if (this.diePlank && this.diePlank.body) {
      this.bodiesToRemove.push(this.diePlank.body)
    }
  }

  removeObject() {
    this.pendingDestroy = true
  }

  showDie () {
    if (this.diePlank) {
      this.diePlank.visible = true
    }
  }

  update () {
    if (this.body) {
      this.position.copy(this.body.position)
      this.quaternion.copy(this.body.quaternion)  
    }

    if (this.diePlank && this.diePlank.body) {
      this.diePlank.body.position.copy(this.position)
      this.diePlank.body.quaternion.copy(this.quaternion)
    }

    this.bodiesToRemove.forEach(body => {
      if (body.world) {
        body.world.remove(body)
      }
    })

    if (this.pendingDestroy) {
      if (this.parent) {
        this.parent.remove(this)
      }
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
