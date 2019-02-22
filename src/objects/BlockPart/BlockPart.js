import 'three/examples/js/loaders/GLTFLoader'
import { Group, GLTFLoader } from 'three';
import BlockPartModel from './BlockPartScaled.model.gltf';
import BlockDieModel from './BlockDieScaled.model.gltf';

export default class BlockPart extends Group {
  constructor() {
    super();

    const loader = new GLTFLoader();

    this.name = 'Block part';

    loader.load(BlockPartModel, (gltf)=>{
      this.add(gltf.scene);
    });

    loader.load(BlockDieModel, (gltf) => {
      this.add(gltf.scene)
    })
  }
}
