class Camera {
    constructor(gl, canvas, u_ViewMatrix, u_ProjectionMatrix) {
        this.gl = gl;
        this.canvas = canvas;

        this.u_ViewMatrix = u_ViewMatrix;
        this.u_ProjectionMatrix = u_ProjectionMatrix;

        // Position/orientation
        this.eye = new Vector3([16, 2, 27]);
        this.up = new Vector3([0, 1, 0]);

        this.forward = new Vector3();
        this.right = new Vector3();
        this.forwardFlat = new Vector3([0, 0, 0]);

        this.pitch = 0;
        this.yaw = Math.PI / 2;

        // Movement
        this.moveSpeed = 0.045;
        this.mouseSensitivity = 0.002;

        // Physics
        this.velocityY = 0;
        this.gravity = -0.0013;
        this.jumpStrength = 0.06;
        this.grounded = true;
        this.radius = 0.3;

        // Key dict
        this.keys = {};

        // Matrices
        this.view = new Matrix4();
        this.proj = new Matrix4();

        this.initEvents();
        this.updateDirection();
        this.updateProjection();
        this.updateView();
    }

    initEvents() {
        // Add event listeners for keypresses
        window.addEventListener("keydown", e => this.keys[e.key.toLowerCase()] = true);
        window.addEventListener("keyup", e => this.keys[e.key.toLowerCase()] = false);

        this.canvas.addEventListener("click", () => {
            // Lock pointer to screen on click (avoid weird rotation starting point interaction)
            this.canvas.requestPointerLock();
        });

        this.canvas.addEventListener("mousemove", e => {
            // Not pointer locked -> dont move
            if (document.pointerLockElement !== this.canvas) return;

            // Modify pitch/yaw by movement and sens
            this.pitch -= e.movementY * this.mouseSensitivity;
            this.yaw += e.movementX * this.mouseSensitivity;

            // Clamp pitch vals (no upside down movement)
            const limit = Math.PI / 2 - 0.01; // -0.01 for weird vertical look bug)
            this.pitch = Math.max(-limit, Math.min(limit, this.pitch));

            // Update direction after pitch/yaw calculated
            this.updateDirection();
        });

        // Update proj mat on window resize
        window.addEventListener("resize", () => this.updateProjection());
    }

    update() {
        const speed = this.moveSpeed;

        let dx = 0;
        let dz = 0;

        if (this.keys['w']) {
            dx += this.forwardFlat.elements[0] * speed;
            dz += this.forwardFlat.elements[2] * speed;
        }

        if (this.keys['s']) {
            dx -= this.forwardFlat.elements[0] * speed;
            dz -= this.forwardFlat.elements[2] * speed;
        }

        if (this.keys['a']) {
            dx -= this.right.elements[0] * speed;
            dz -= this.right.elements[2] * speed;
        }

        if (this.keys['d']) {
            dx += this.right.elements[0] * speed;
            dz += this.right.elements[2] * speed;
        }

        // Apply collision-aware movement
        this.move(dx, dz);

        // Modify yaw with q/e
        if (this.keys['q']) this.yaw -= 0.03;
        if (this.keys['e']) this.yaw += 0.03;

        // Jump
        if (this.keys[' '] && this.grounded) {
            this.velocityY = this.jumpStrength;
            this.grounded = false;
        }

        // Gravity
        this.velocityY += this.gravity;
        this.eye.elements[1] += this.velocityY;

        // Stop camera when below 2 y
        if (this.eye.elements[1] <= 2.0) {
            this.eye.elements[1] = 2.0;
            this.velocityY = 0;
            this.grounded = true;
        }

        this.updateDirection();
        this.updateView();
    }

    move(dx, dz) {
        const x = this.eye.elements[0];
        const z = this.eye.elements[2];
        const r = this.radius;

        // X-axis collision
        if (
            // Check both sides +- r
            !isSolid(x + dx + r, z) &&
            !isSolid(x + dx - r, z)
        ) {
            this.eye.elements[0] += dx;
        }

        // Z-axis collision
        if (
            // Check both sides +- r
            !isSolid(this.eye.elements[0], z + dz + r) &&
            !isSolid(this.eye.elements[0], z + dz - r)
        ) {
            this.eye.elements[2] += dz;
        }
    }

    updateDirection() {
        // Get list elements
        const f = this.forward.elements;
        const ff = this.forwardFlat.elements;

        // Set forward direction vector based on pitch/yaw from mouse input (changed around sin/cos cause it was acting up)
        f[0] = Math.cos(this.pitch) * Math.cos(this.yaw);
        f[1] = Math.sin(this.pitch);
        f[2] = Math.cos(this.pitch) * Math.sin(this.yaw);

        // Normalize forward direction vector
        this.forward.normalize();

        // Set forward (flat) direction vector based on yaw
        ff[0] = Math.cos(this.yaw);
        ff[2] = Math.sin(this.yaw);

        // Normalize forward (flat) direction vector
        this.forwardFlat.normalize();

        // Calculate and normalize right direction vector
        this.right.set(Vector3.cross(this.forwardFlat, this.up)).normalize();
    }

    updateView() {
        const e = this.eye.elements;
        const f = this.forward.elements;

        // call set look at from lib with eye, center, up
        this.view.setLookAt(
            e[0], e[1], e[2],
            e[0] + f[0], e[1] + f[1], e[2] + f[2],
            0, 1, 0
        );

        // Update view matrix
        this.gl.uniformMatrix4fv(this.u_ViewMatrix, false, this.view.elements);
    }

    updateProjection() {
        // Get dpr
        const dpr = window.devicePixelRatio || 1;

        // Get width/height of window
        const width = this.canvas.clientWidth * dpr;
        const height = this.canvas.clientHeight * dpr;

        // Associate width/height
        this.canvas.width = width;
        this.canvas.height = height;

        // Update canvas size
        this.gl.viewport(0, 0, width, height);

        // Change perspective on screen resize
        this.proj.setPerspective(80, width / height, 0.1, 170);

        // Update proj matrix
        this.gl.uniformMatrix4fv(this.u_ProjectionMatrix, false, this.proj.elements);
    }
}