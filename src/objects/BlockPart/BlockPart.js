import { Group, Cache, Box3, Color } from 'three';

export default class BlockPart extends Group {
  constructor(type) {
    super();

    if (type === undefined) {
      type = 0
    }
    if (type === 0) {
      
    }

    this.name = 'Block part';
    this.matrixAutoUpdate = true

    this.diePart = Cache.get('block_die').scene.clone(true)
    this.diePart.name = 'die'

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
    this.bodyPart = Cache.get(bodyKey).scene.clone(true)
    this.bodyPart.name = 'body'
    this._bodyMesh = this.bodyPart.children[0].children[0].children[0]

    var geo = new THREE.EdgesGeometry( this._bodyMesh.geometry, 45);
    var mat = new THREE.LineBasicMaterial( { color: 0x000000, linewidth: 1 } );
    var wireframe = new THREE.LineSegments( geo, mat );
    wireframe.renderOrder = 1; // make sure wireframes are rendered 2nd
    this._bodyMesh.add( wireframe );

    this.add(this.bodyPart, this.diePart)
  }

  getSize (object) {
    if (!object) {
      object = this
    }

    let box3 = new Box3().setFromObject(object)
    return box3.getSize()
  }

  getBodySize() {
    return this.getSize(this.bodyPart)
  }

  getDieSize() {
    return this.getSize(this.diePart)
  }

  removeDiePart () {
    this.remove(this.diePart)
  }
}
