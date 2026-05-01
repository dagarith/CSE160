class Camera {
    constructor(gl, canvas, u_ViewMatrix, u_ProjectionMatrix) {
        this.gl = gl;
        this.canvas = canvas;

        this.u_ViewMatrix = u_ViewMatrix;
        this.u_ProjectionMatrix = u_ProjectionMatrix;

        this.eye = [0, 1, 11];

        this.up = [0, 1, 0];

        this.pitch = 0;
        this.yaw = Math.PI / 2;

        this.moveSpeed = 0.08;
        this.mouseSensitivity = 0.002;
        this.keyTurnSpeed = 0.03;

        this.forward = [0, 0, -1];
        this.right = [1, 0, 0];

        this.velocityY = 0;
        this.gravity = -0.001;
        this.jumpStrength = 0.06;
        this.grounded = true;

        this.keys = {};

        this.view = new Matrix4();
        this.proj = new Matrix4();

        this.initEvents();
        this.updateDirection();
        this.updateProjection();
        this.updateView();
    }

    initEvents() {
        window.addEventListener("keydown", (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });

        window.addEventListener("keyup", (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        this.canvas.addEventListener("click", () => {
            this.canvas.requestPointerLock();
        });

        this.canvas.addEventListener("mousemove", (e) => {
            if (document.pointerLockElement !== this.canvas) return;

            const dx = e.movementX;
            const dy = e.movementY;

            this.yaw += dx * this.mouseSensitivity;
            this.pitch -= dy * this.mouseSensitivity;

            const limit = Math.PI / 2 - 0.01;
            this.pitch = Math.max(-limit, Math.min(limit, this.pitch));

            this.updateDirection();
            this.updateView();
        });

        window.addEventListener("resize", () => this.updateProjection());
    }

    updateDirection() {
        this.forward[0] = Math.cos(this.pitch) * Math.cos(this.yaw);
        this.forward[1] = Math.sin(this.pitch);
        this.forward[2] = Math.cos(this.pitch) * Math.sin(this.yaw);

        let len = Math.hypot(...this.forward);
        this.forward = this.forward.map(v => v / len);

        this.right = [
            this.forward[1] * this.up[2] - this.forward[2] * this.up[1],
            this.forward[2] * this.up[0] - this.forward[0] * this.up[2],
            this.forward[0] * this.up[1] - this.forward[1] * this.up[0],
        ];

        let rlen = Math.hypot(...this.right);
        this.right = this.right.map(v => v / rlen);
    }

    update() {
        if (this.keys['q']) this.yaw -= this.keyTurnSpeed;
        if (this.keys['e']) this.yaw += this.keyTurnSpeed;

        if (this.keys['w']) {
            this.eye[0] += this.forward[0] * this.moveSpeed;
            this.eye[2] += this.forward[2] * this.moveSpeed;
        }
        if (this.keys['s']) {
            this.eye[0] -= this.forward[0] * this.moveSpeed;
            this.eye[2] -= this.forward[2] * this.moveSpeed;
        }
        if (this.keys['a']) {
            this.eye[0] -= this.right[0] * this.moveSpeed;
            this.eye[2] -= this.right[2] * this.moveSpeed;
        }
        if (this.keys['d']) {
            this.eye[0] += this.right[0] * this.moveSpeed;
            this.eye[2] += this.right[2] * this.moveSpeed;
        }

        if (this.keys[' '] && this.grounded) {
            this.velocityY = this.jumpStrength;
            this.grounded = false;
        }

        this.velocityY += this.gravity;
        this.eye[1] += this.velocityY;

        if (this.eye[1] <= 2.0) {
            this.eye[1] = 2.0;
            this.velocityY = 0;
            this.grounded = true;
        }

        this.updateDirection();
        this.updateView();
    }

    updateView() {
        const center = [
            this.eye[0] + this.forward[0],
            this.eye[1] + this.forward[1],
            this.eye[2] + this.forward[2],
        ];

        this.view.setLookAt(
            this.eye[0], this.eye[1], this.eye[2],
            center[0], center[1], center[2],
            this.up[0], this.up[1], this.up[2]
        );

        this.gl.uniformMatrix4fv(this.u_ViewMatrix, false, this.view.elements);
    }

    updateProjection() {
        const dpr = window.devicePixelRatio || 1;

        const width = this.canvas.clientWidth * dpr;
        const height = this.canvas.clientHeight * dpr;

        this.canvas.width = width;
        this.canvas.height = height;

        this.gl.viewport(0, 0, width, height);

        this.proj.setPerspective(60, width / height, 0.1, 1000);

        this.gl.uniformMatrix4fv(
            this.u_ProjectionMatrix,
            false,
            this.proj.elements
        );
    }
}