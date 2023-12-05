import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

import marble from '../img/Marble.jpg';
import marbleThunder from '../img/Marble-Thunder.jpg';
import marbleBlack from '../img/Marble-Black.jpg';
import marbleYellow from '../img/Marble-Yellow.jpg';
import marblePink from '../img/Marble-Pink.jpg';
import marbleOrange from '../img/Marble-Orange.jpg';

const hdrTexture = new URL('../img/NaturalStudio.hdr', import.meta.url);

//spheres textures
const textures = [marble, marbleThunder, marbleBlack, marbleYellow, marblePink, marbleOrange];
//spheres colors
const colorsB = [new THREE.Color(0xD33D3b), new THREE.Color(0x3B93D3), new THREE.Color(0x3BD361)];
const colorsM = [new THREE.Color(0xFF0000), new THREE.Color(0x0000FF), new THREE.Color(0x00FF00)];
//number spheres
//const numSpheres = 20;
const numSpheres = textures.length;

var bodyElement = document.querySelector('body');

//renderer
const renderer = new THREE.WebGL1Renderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);

renderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);
const canvas = renderer.domElement;

//scene
const scene = new THREE.Scene();

//camera
const camera = new THREE.PerspectiveCamera(
    45, window.innerWidth / window.innerHeight, 0.1, 1000
);
/*const ratio = window.innerWidth / window.innerHeight;
const size = 3;
let camera;
if (ratio >= 1) {
    camera = new THREE.OrthographicCamera(ratio * size / - 2, ratio * size / 2, size / 2, size / - 2, 1, 10);
} else {
    camera = new THREE.OrthographicCamera(size / - 2, size / 2, ratio * size / 2, ratio * size / - 2, 1, 10);
}*/

camera.position.set(0, -0.3, 2.5);
camera.lookAt(0, 0, 0);
const controls = new OrbitControls(camera, renderer.domElement);
controls.update();

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

//light
const light = new THREE.PointLight('white', 5);
light.position.set(2, 2, 3);
scene.add(light);

//fog
let id;
function randomColorM() {
    id = Math.round(Math.random() * colorsM.length);
    const c = colorsM[id];
    return c;
}
function randomColorB() {
    const c = colorsB[id];
    return c;
}
const near = 5;
const far = 15;
//const color = 0xFFFFFF;  //branco
//const color = 0x3bd361;  //verde
//const color = 0xd33d3b;  //vermelho
//const color = 0x3b93d3;  //azul
const colorM = randomColorM();
const colorB = randomColorB();

console.log(colorM, colorB);
//scene.fog = new THREE.Fog(color, near, far);
scene.background = new THREE.Color(colorB);

//textured spheres
const spheres = [];

const textLoader = new THREE.TextureLoader();
const loader = new RGBELoader();
loader.load(hdrTexture, function (texture) {
    //texture
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;

    //spheres
    const geometry = new THREE.SphereGeometry(0.5, 32, 32);

    /*const width = window.innerWidth * 0.0035; //4
    const height = window.innerHeight * 0.005; //3
    console.log(width, height);*/

    for (let i = 0; i < numSpheres; i++) {
        function randomTexture() {
            //const id = Math.floor(Math.random() * textures.length);
            const t = textures[i];
            return t;
        }
        let material;
        if (bodyElement.classList.contains('Teams')) {
            //spheres material textures
            material = new THREE.MeshPhysicalMaterial({
                roughness: 0,
                metalness: 0.2,
                //color: 0xFF0000,
                //color: colorM,
                //map: textLoader.load(marble),
                map: textLoader.load(randomTexture()),
                //transmission: 1,
                iridescence: 0.8,
                ior: 2.33
            });
        } else {
            //spheres material
            material = new THREE.MeshPhysicalMaterial({
                roughness: 0,
                metalness: 0.2,
                //color: 0xFF0000,
                color: colorM,
                //transmission: 1,
                iridescence: 0.8,
                ior: 2.33
            });
        }

        const mesh = new THREE.Mesh(geometry, material);

        //spheres positions
        if (bodyElement.classList.contains('Teams')) {
            mesh.position.x = (i-0.25) - 2;
            if (i%2) {
                mesh.position.y = -0.75;
            }


            /*mesh.position.x = THREE.MathUtils.randInt(-2, 2);
            mesh.position.y = THREE.MathUtils.randInt(-1, 1);*/
            mesh.position.z = -2;
        } else {
            mesh.rotation.y = Math.random(Math.PI) * 5;
            mesh.rotation.z = Math.random(Math.PI);
            mesh.position.x = THREE.MathUtils.randFloatSpread(7);
            mesh.position.y = THREE.MathUtils.randFloatSpread(4);
            mesh.position.z = Math.random() * (-9);
        }

        scene.add(mesh);
        spheres.push(mesh);
    }
});

//RayCaster
class PickHelper {
    constructor() {
        this.raycaster = new THREE.Raycaster();
        this.pickedObject = null;
        this.pickedObjectSavedColor = 0;
    }
    pick(normalizedPosition, scene, camera) {
        // restore the color if there is a picked object
        if (this.pickedObject) {
            this.pickedObject.material.emissive.setHex(this.pickedObjectSavedColor);
            this.pickedObject = undefined;
        }

        // cast a ray through the frustum
        this.raycaster.setFromCamera(normalizedPosition, camera);
        // get the list of objects the ray intersected
        const intersectedObjects = this.raycaster.intersectObjects(scene.children);
        if (intersectedObjects.length) {
            // pick the first object. It's the closest one
            this.pickedObject = intersectedObjects[0].object;
            // save its color
            this.pickedObjectSavedColor = this.pickedObject.material.emissive.getHex();
            // set its emissive color to red
            this.pickedObject.material.emissive.setHex(0xFF0000);
        }
    }
}
const pickPosition = { x: 0, y: 0 };
clearPickPosition();
function getCanvasRelativePosition(event) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (event.clientX - rect.left) * canvas.width / rect.width,
        y: (event.clientY - rect.top) * canvas.height / rect.height,
    };
}
function setPickPosition(event) {
    const pos = getCanvasRelativePosition(event);
    pickPosition.x = (pos.x / canvas.width) * 2 - 1;
    pickPosition.y = (pos.y / canvas.height) * -2 + 1;  // note we flip Y
}
function clearPickPosition() {
    pickPosition.x = -100000;
    pickPosition.y = -100000;
}

window.addEventListener('mousemove', setPickPosition);
window.addEventListener('mouseout', clearPickPosition);
window.addEventListener('mouseleave', clearPickPosition);

//RayCaster mobile
window.addEventListener('touchstart', (event) => {
    // prevent the window from scrolling
    event.preventDefault();
    setPickPosition(event.touches[0]);
}, { passive: false });
window.addEventListener('touchmove', (event) => {
    setPickPosition(event.touches[0]);
});
window.addEventListener('touchend', clearPickPosition);

const pickHelper = new PickHelper();

let renderRequested = false;
function animate() {
    renderRequested = false;

    window.addEventListener('resize', function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    })

    if (bodyElement.classList.contains('Teams')) {
        pickHelper.pick(pickPosition, scene, camera);
    }

    //requestAnimationFrame(animate);

    // required if controls.enableDamping or controls.autoRotate are set to true
    //controls.update();

    renderer.render(scene, camera);
}
//renderer.setAnimationLoop(animate);
animate();

function requestRenderIfNotRequested() {
    if (!renderRequested) {
        renderRequested = true;
        requestAnimationFrame(animate);
    }
}

window.addEventListener('mousemove', requestRenderIfNotRequested);
controls.addEventListener('change', requestRenderIfNotRequested);
window.addEventListener('resize', requestRenderIfNotRequested);