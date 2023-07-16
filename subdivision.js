/* CMPSCI 373 Homework 4: Subdivision Surfaces */

const panelSize = 600;
const fov = 35;
const aspect = 1;
let scene, renderer, camera, material, orbit, light, surface=null;
let nsubdiv = 0;

let coarseMesh = null;	// the original input triangle mesh
let currMesh = null;		// current triangle mesh

let flatShading = true;
let wireFrame = false;

let objStrings = [
	box_obj,
	ico_obj,
	torus_obj,
	twist_obj,
	combo_obj,
	pawn_obj,
	bunny_obj,
	head_obj,
	hand_obj,
	klein_obj
];

let objNames = [
	'box',
	'ico',
	'torus',
	'twist',
	'combo',
	'pawn',
	'bunny',
	'head',
	'hand',
	'klein'
];

function id(s) {return document.getElementById(s);}
function message(s) {id('msg').innerHTML=s;}

function subdivide() {
	let currVerts = currMesh.vertices;
	let currFaces = currMesh.faces;
	let newVerts = [];
	let newFaces = [];
	/* You can access the current mesh data through
	 * currVerts and currFaces arrays.
	 * Compute one round of Loop's subdivision and
	 * output to newVerts and newFaces arrays.
	 */
// ===YOUR CODE STARTS HERE===

	// Cloning Verticies array
	for (let i = 0; i < currVerts.length; i++) { 
		newVerts[i] = currVerts[i].clone();
	}

	let vertexAdj = []; // Vertex Adjacency data structure
	for (let i = 0; i < currFaces.length; i++) {
		let a_index = currFaces[i].a;
		let b_index = currFaces[i].b;
		let c_index = currFaces[i].c;

		if (vertexAdj[a_index] === undefined) {
			let arr = [];
			arr.push(b_index);
			arr.push(c_index);
			vertexAdj[a_index] = arr;
		} else {
			if (!vertexAdj[a_index].includes(b_index)) {
				vertexAdj[a_index].push(b_index);
			}
			if (!vertexAdj[a_index].includes(c_index)) {
				vertexAdj[a_index].push(c_index);
			}
		}

		if (vertexAdj[b_index] === undefined) {
			let arr = [];
			arr.push(a_index);
			arr.push(c_index);
			vertexAdj[b_index] = arr;
		} else {
			if (!vertexAdj[b_index].includes(a_index)) {
				vertexAdj[b_index].push(a_index);
			}
			if (!vertexAdj[b_index].includes(c_index)) {
				vertexAdj[b_index].push(c_index);
			}
		}

		if (vertexAdj[c_index] === undefined) {
			let arr = [];
			arr.push(a_index);
			arr.push(b_index);
			vertexAdj[c_index] = arr;
		} else {
			if (!vertexAdj[c_index].includes(a_index)) {
				vertexAdj[c_index].push(a_index);
			}
			if (!vertexAdj[c_index].includes(b_index)) {
				vertexAdj[c_index].push(b_index);
			}
		}
	}

	let edges = new Map(); // Edge data structure 
	for (let i = 0; i < currFaces.length; i++) {
		let aidx = currFaces[i].a;
		let bidx = currFaces[i].b;
		let cidx = currFaces[i].c;
		let key1 = "", key2 = "", key3 = "";

		if (aidx < bidx) {
			key1 = aidx + "," + bidx;
		} else {
			key1 = bidx + "," + aidx;
		}

		if (aidx < cidx) {
			key2 = aidx + "," + cidx;
		} else {
			key2 = cidx + "," + aidx;
		}

		if (bidx < cidx) {
			key3 = bidx + "," + cidx;
		} else {
			key3 = cidx + "," + bidx;
		}

		if (!edges.has(key1)) {
			edges.set(key1, {v0: aidx, v1: bidx, n0: cidx, n1: null, index: null});
		} else {
			edges.get(key1).n1 = cidx;
		}

		if (!edges.has(key2)) {
			edges.set(key2, {v0: aidx, v1: cidx, n0: bidx, n1: null, index: null});
		} else {
			edges.get(key2).n1 = bidx;
		}

		if (!edges.has(key3)) {
			edges.set(key3, {v0: bidx, v1: cidx, n0: aidx, n1: null, index: null});
		} else {
			edges.get(key3).n1 = aidx;
		}
	}

	// Update old verticies 
	for (let i = 0; i < vertexAdj.length; i++) {
		let k = vertexAdj[i].length;
		let beta = (1 / k) * ((5/8) - (((3/8) + (1/4) * Math.cos((2 * Math.PI) / k)) * ((3/8) + (1/4) * Math.cos((2 * Math.PI) / k))));
		let vertWeight = 1 - (k * beta);

		let xVal = vertWeight * currVerts[i].x;
		let yVal = vertWeight * currVerts[i].y; 
		let zVal = vertWeight * currVerts[i].z;
		for (let j = 0; j < k; j++) {
			xVal += beta * currVerts[vertexAdj[i][j]].x;
			yVal += beta * currVerts[vertexAdj[i][j]].y;
			zVal += beta * currVerts[vertexAdj[i][j]].z;
		}
		newVerts[i].set(xVal, yVal, zVal);
	}

	// Insert new verticies
	const valuesIter = edges.values();
	for (let i = 0; i < edges.size; i++) {
		let currValue = valuesIter.next().value;

		let xVal = ((3/8) * currVerts[currValue.v0].x) + ((1/8) * currVerts[currValue.n0].x) + ((3/8) * currVerts[currValue.v1].x) + ((1/8) * currVerts[currValue.n1].x);
		let yVal = ((3/8) * currVerts[currValue.v0].y) + ((1/8) * currVerts[currValue.n0].y) + ((3/8) * currVerts[currValue.v1].y) + ((1/8) * currVerts[currValue.n1].y);
		let zVal = ((3/8) * currVerts[currValue.v0].z) + ((1/8) * currVerts[currValue.n0].z) + ((3/8) * currVerts[currValue.v1].z) + ((1/8) * currVerts[currValue.n1].z);

		newVerts.push(new THREE.Vector3(xVal, yVal, zVal));
		currValue.index = newVerts.length - 1;
	}

	// Update triangles
	for (let i = 0; i < currFaces.length; i++) {
		let aidx = currFaces[i].a;
		let bidx = currFaces[i].b;
		let cidx = currFaces[i].c;

		let valObj1 = {};
		let valObj2 = {};
		let valObj3 = {};

		let key1 = "";
		if (aidx < bidx) {
			key1 = aidx + "," + bidx;
		} else {
			key1 = bidx + "," + aidx;
		}
		valObj1 = edges.get(key1);

		let key2 = "";
		if (aidx < cidx) {
			key2 = aidx + "," + cidx;
		} else {
			key2 = cidx + "," + aidx;
		}
		valObj2 = edges.get(key2);

		let key3 = "";
		if (bidx < cidx) {
			key3 = bidx + "," + cidx;
		} else {
			key3 = cidx + "," + bidx;
		}
		valObj3 = edges.get(key3);

		let m_ab = valObj1.index;
		let m_ac = valObj2.index;
		let m_bc = valObj3.index;

		newFaces.push(new THREE.Face3(aidx, m_ab, m_ac));
		newFaces.push(new THREE.Face3(m_ab, bidx, m_bc));
		newFaces.push(new THREE.Face3(m_ac, m_bc, cidx));
		newFaces.push(new THREE.Face3(m_ab, m_bc, m_ac));
	}

	// TESTING 
	for (let i = 0; i < newFaces.length; i++) {
		console.log(newFaces[i]);
	}
	for (let i = 0; i < newVerts.length; i++) {
		console.log(newVerts[i]);
	}
	
// ---YOUR CODE ENDS HERE---
	/* Overwrite current mesh with newVerts and newFaces */
	currMesh.vertices = newVerts;
	currMesh.faces = newFaces;
	/* Update mesh drawing */
	updateSurfaces();
}

window.onload = function(e) {
	// create scene, camera, renderer and orbit controls
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 100 );
	camera.position.set(-1, 1, 3);
	
	renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.setSize(panelSize, panelSize);
	renderer.setClearColor(0x202020);
	id('surface').appendChild(renderer.domElement);	// bind renderer to HTML div element
	orbit = new THREE.OrbitControls(camera, renderer.domElement);
	
	light = new THREE.DirectionalLight(0xFFFFFF, 1.0);
	light.position.set(camera.position.x, camera.position.y, camera.position.z);	// right light
	scene.add(light);

	let amblight = new THREE.AmbientLight(0x202020);	// ambient light
	scene.add(amblight);
	
	// create materials
	material = new THREE.MeshPhongMaterial({color:0xCC8033, specular:0x101010, shininess: 50});
	
	// create current mesh object
	currMesh = new THREE.Geometry();
	
	// load first object
	loadOBJ(objStrings[0]);
}

function updateSurfaces() {
	currMesh.verticesNeedUpdate = true;
	currMesh.elementsNeedUpdate = true;
	currMesh.computeFaceNormals(); // compute face normals
	if(!flatShading) currMesh.computeVertexNormals(); // if smooth shading
	else currMesh.computeFlatVertexNormals(); // if flat shading
	
	if (surface!=null) {
		scene.remove(surface);	// remove old surface from scene
		surface.geometry.dispose();
		surface = null;
	}
	material.wireframe = wireFrame;
	surface = new THREE.Mesh(currMesh, material); // attach material to mesh
	scene.add(surface);
}

function loadOBJ(objstring) {
	loadOBJFromString(objstring, function(mesh) {
		coarseMesh = mesh;
		currMesh.vertices = mesh.vertices;
		currMesh.faces = mesh.faces;
		updateSurfaces();
		nsubdiv = 0;
	},
	function() {},
	function() {});
}

function onKeyDown(event) { // Key Press callback function
	switch(event.key) {
		case 'w':
		case 'W':
			wireFrame = !wireFrame;
			message(wireFrame ? 'wireframe rendering' : 'solid rendering');
			updateSurfaces();
			break;
		case 'f':
		case 'F':
			flatShading = !flatShading;
			message(flatShading ? 'flat shading' : 'smooth shading');
			updateSurfaces();
			break;
		case 's':
		case 'S':
		case ' ':
			if(nsubdiv>=5) {
				message('# subdivisions at maximum');
				break;
			}
			subdivide();
			nsubdiv++;
			updateSurfaces();
			message('# subdivisions = '+nsubdiv);
			break;
		case 'e':
		case 'E':
			currMesh.vertices = coarseMesh.vertices;
			currMesh.faces = coarseMesh.faces;
			nsubdiv = 0;
			updateSurfaces();
			message('# subdivisions = '+nsubdiv);
			break;
		case 'r':
		case 'R':
			orbit.reset();
			break;
			
	}
	if(event.key>='0' && event.key<='9') {
		let index = 9;
		if(event.key>'0')	index = event.key-'1';
		if(index<objStrings.length) {
			loadOBJ(objStrings[index]);
			message('loaded mesh '+objNames[index]);
		}
	}
}

window.addEventListener('keydown',  onKeyDown,  false);

function animate() {
	requestAnimationFrame( animate );
	//if(orbit) orbit.update();
	if(scene && camera)	{
		light.position.set(camera.position.x, camera.position.y, camera.position.z);
		renderer.render(scene, camera);
	}
}

animate();
