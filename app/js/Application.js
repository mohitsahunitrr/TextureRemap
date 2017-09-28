class Application {
    init() {
        this.initGui();

        var material = new THREE.MeshStandardMaterial({ color: 'red' });
        this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), material);
        this.mesh.position.set(0, 0, 3);
        // this.sceneManager.scene.add(this.mesh);

        this.applyGuiChanges();
    }

    loadFile(isFrom) {

    }

    applyGuiChanges() {
        // console.log(guiParams.ballSize);
        this.mesh.scale.set(this.ballSize, this.ballSize, this.ballSize);
        this.mesh.material.color = new THREE.Color(this.color);
    }

    addParam(name, defaultValue, ...args) {
        this[name] = defaultValue;
        return this.gui.add.apply(this.gui, [this, name].concat(args));
    }

    uploadFile(callback) {
        if (!this.callback) {
            document.getElementById('fileUpload').addEventListener('change', (evt) => {
                var reader = new FileReader();
                reader.onload = (e) => {
                    this.callback(e.target.result);
                };

                // Read in the image file as a data URL.
                reader.readAsDataURL(evt.target.files[0]);
            }, false);
        }
        this.callback = callback;
        document.getElementById('fileUpload').click();
    }

    initGui() {
        this.applyGuiChanges = this.applyGuiChanges.bind(this);
        this.gui = new dat.GUI({ autoPlace: true, width: 500 });
        // this.addParam('ballSize', 3).name('Ball size').min(0.1).max(16).step(0.01).onChange(this.applyGuiChanges);
        // this.addParam('color', 'red', ['red', 'blue', 'black', 'yellow']).onChange(this.applyGuiChanges);

        this.addParam('loadMeshFrom', () => {
            this.uploadFile((f) => {
                new THREE.OBJLoader().load(f, (object) => {
                    this.meshFrom = object.children[0];
                    this.meshFrom.material = new THREE.MeshStandardMaterial({ color: 'red', side: THREE.DoubleSide });
                    this.meshFrom.geometry = new THREE.Geometry().fromBufferGeometry(this.meshFrom.geometry);
                    this.sceneManager.scene.add(this.meshFrom);
                });
            });
        });

        this.addParam('loadImageFrom', () => {
            this.uploadFile((f) => {
                new THREE.TextureLoader().load(f, (object) => {
                    function getImageData(image) {
                        var canvas = document.createElement('canvas');
                        canvas.width = image.width;
                        canvas.height = image.height;
                        var context = canvas.getContext('2d');
                        context.drawImage(image, 0, 0);
                        return context.getImageData(0, 0, image.width, image.height);
                    }
                    this.texFrom = object;
                    this.imgFrom = getImageData(this.texFrom.image);
                    this.meshFrom.material = new THREE.MeshBasicMaterial({map: this.texFrom, side: THREE.DoubleSide});
                });
            });
        });

        this.addParam('loadMeshTo', () => {
            this.uploadFile((f) => {
                new THREE.OBJLoader().load(f, (object) => {
                    this.meshTo = object.children[0];
                    this.meshTo.material = new THREE.MeshStandardMaterial({ color: 'blue', side: THREE.DoubleSide});
                    this.meshTo.geometry = new THREE.Geometry().fromBufferGeometry(this.meshTo.geometry);
                    this.meshTo.geometry.faceVertexUvs = this.meshFrom.geometry.faceVertexUvs;
                    this.meshTo.material = new THREE.MeshBasicMaterial({map: this.texFrom, side: THREE.DoubleSide});
                    this.sceneManager.scene.add(this.meshTo);
                });
            });
        });

        // this.addParam('createImageTo', () => {
        //     // var width = this.imgFrom ? this.imgFrom.width : 400;
        //     // var height = this.imgFrom ? this.imgFrom.height : 400;
        //     // this.texTo = new THREE.DataTexture( new Uint8Array(4 * width * height), width, height);
        //     // this.imgTo = this.texTo.image;
        //     // console.log(this.meshFrom.geometry);
        //     // console.log(this.meshTo.geometry);
        //     // for (var f in this.meshTo.geometry.faces) {
        //     //
        //     // }
        //     this.meshTo.geometry.faceVertexUvs = this.meshFrom.geometry.faceVertexUvs;
        //     this.meshTo.geometry.uvsNeedUpdate = true;
        //     this.meshTo.geometry.elementsNeedUpdate = true;
        //     this.meshTo.material = new THREE.MeshBasicMaterial({map: this.texFrom, side: THREE.DoubleSide});
        // });

        // this.addParam('switchOrtho', () => {
        //     this.sceneManager.scene.remove(this.sceneManager.camera);
        //     var cameraBefore = this.sceneManager.camera;
        //     if (this.sceneManager.camera == this.sceneManager.cameraPersp) {
        //         this.sceneManager.camera = this.sceneManager.cameraOrtho;
        //         this.sceneManager.camera.position.set(0, 0, cameraBefore.position.z);
        //         this.sceneManager.controls = new THREE.OrbitControls(this.sceneManager.camera, this.sceneManager.renderer.domElement);
        //         this.sceneManager.controls.enableRotate = false;
        //
        //     } else {
        //         this.sceneManager.camera = this.sceneManager.cameraPersp;
        //         this.sceneManager.camera.position.z = cameraBefore.position.z;
        //         this.sceneManager.controls = new THREE.OrbitControls(this.sceneManager.camera, this.sceneManager.renderer.domElement);
        //     }
        //     this.sceneManager.scene.add(this.sceneManager.camera);
        // });

        this.addParam('xSizeOnSave', 1000).min(10).max(4096);
        this.addParam('saveImageTo', () => {
            if (this.meshTo) {
                this.meshTo.geometry.computeBoundingBox();
                var box = this.meshTo.geometry.boundingBox;
            }

            // create clean scene
            // this.sceneManager.camera = this.sceneManager.cameraOrtho;
            var aspect = window.innerWidth / window.innerHeight;
            this.sceneManager.camera = new THREE.OrthographicCamera(box.min.x, box.max.x, box.min.y, box.max.y, -1000, 1000);
            this.sceneManager.camera.position.set(0, 0, this.sceneManager.cameraPersp.position.z);
            this.sceneManager.grid.visible = false;
            if (this.meshFrom) this.meshFrom.visible = false;

            // render
            this.sceneManager.renderer.render(this.sceneManager.scene, this.sceneManager.camera);

            // revert to normal scene
            this.sceneManager.camera = this.sceneManager.cameraPersp;
            this.sceneManager.grid.visible = true;
            if (this.meshFrom) this.meshFrom.visible = true;

            // open in new window like this
            var w = window.open('', '');
            w.document.title = "Screenshot";
            //w.document.body.style.backgroundColor = "red";
            var img = new Image();
            // img.width = box.getSize().x * 1000;
            // img.height = box.getSize().y * 1000;
            img.width = this.xSizeOnSave;//box.getSize().x * 1000;
            img.height = Math.ceil(this.xSizeOnSave / box.getSize().x * box.getSize().y);
            img.src = this.sceneManager.renderer.domElement.toDataURL();
            w.document.body.appendChild(img);

            // download file like this.
            var a = document.createElement('a');
            a.href = img.src.replace("image/png", "image/octet-stream");
            a.download = 'canvas.png'
            // a.click();
            // w.close();
        });

    }

    onClick(inter) {
        this.sceneManager.scene.remove(this.dot);
        if (inter[0].object !== this.mesh) return;
        this.dot = new THREE.Mesh(new THREE.SphereGeometry(0.1), new THREE.MeshNormalMaterial());
        this.dot.position.copy(inter[0].point);
        this.sceneManager.scene.add(this.dot);
    }
}
