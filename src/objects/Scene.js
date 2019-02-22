import { Group } from 'three';
import '../lib/physi'
import BlockPart from './BlockPart/BlockPart.js'
import BasicLights from './Lights.js';

export default class SeedScene extends Group {
  constructor() {
    super();
    
    this.lights = new BasicLights();
    this.add(this.lights);
    
    for (var i = 0; i < 10; i++) {
      let blockPart = new BlockPart();
      let scaleFactor = 0.2
      blockPart.scale.x = scaleFactor
      blockPart.scale.y = scaleFactor
      blockPart.scale.z = scaleFactor
      blockPart.rotation.y = (2 * Math.PI / 10) * i
      this.add(blockPart)
    }
  }

  update(timeStamp) {
    this.rotation.y = timeStamp / 10000;
  }
}