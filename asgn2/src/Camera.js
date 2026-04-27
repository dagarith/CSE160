class Camera {
    constructor(gl, canvas, u_ViewMatrix, u_ProjectionMatrix) {
        this.gl = gl;
        this.canvas = canvas;

        this.u_ViewMatrix = u_ViewMatrix;
        this.u_ProjectionMatrix = u_ProjectionMatrix;

        this.target = [0, 0, 0];
        this.eye = [0, 0, 5];
        this.up = [0, 1, 0];

        this.pitch = 0.3;
        this.yaw = -0.35;
        this.distance = 6;

        this.view = new Matrix4();
        this.proj = new Matrix4();

        this.initEvents();
        this.updateProjection();
        this.updateView();
    }

    initEvents() {
        // Start not dragging, 0,0
        let dragging = false;
        let panning = false;
        let lastX = 0;
        let lastY = 0;

        // If left click, dragging true, log mouse x/y
        this.canvas.addEventListener("mousedown", (e) => {
            if (e.button === 0) { // left = rotate
                dragging = true;
            } else if (e.button === 2) { // right = pan
                panning = true;
            }
        });

        // If release click, dragging false
        window.addEventListener("mouseup", () => {
            dragging = false;
            panning = false;
        });

        this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());

        window.addEventListener("mousemove", (e) => {
            // Calc mouse pos diff between this and last tick
            const dx = e.clientX - lastX;
            const dy = e.clientY - lastY;

            lastX = e.clientX;
            lastY = e.clientY;

            if (dragging) {
                // Scale for pitch/yaw
                this.yaw -= dx * 0.004;
                this.pitch += dy * 0.004;

                // Clamp vals
                this.pitch = Math.max(-1.5, Math.min(1.5, this.pitch));

                // Update view
                this.updateView();
            }

            if (panning) {
                const panSpeed = this.distance * 0.0006;

                // compute forward vector
                const fx = this.target[0] - this.eye[0];
                const fy = this.target[1] - this.eye[1];
                const fz = this.target[2] - this.eye[2];

                // normalize forward
                const fl = Math.hypot(fx, fy, fz);
                const forward = [fx / fl, fy / fl, fz / fl];

                // right = forward × up
                const right = [
                    forward[1] * this.up[2] - forward[2] * this.up[1],
                    forward[2] * this.up[0] - forward[0] * this.up[2],
                    forward[0] * this.up[1] - forward[1] * this.up[0],
                ];

                // normalize right
                const rl = Math.hypot(...right);
                right[0] /= rl;
                right[1] /= rl;
                right[2] /= rl;

                // recompute true camera up = right × forward
                const camUp = [
                    right[1] * forward[2] - right[2] * forward[1],
                    right[2] * forward[0] - right[0] * forward[2],
                    right[0] * forward[1] - right[1] * forward[0],
                ];

                // move target
                this.target[0] += (-dx * right[0] + dy * camUp[0]) * panSpeed;
                this.target[1] += (-dx * right[1] + dy * camUp[1]) * panSpeed;
                this.target[2] += (-dx * right[2] + dy * camUp[2]) * panSpeed;

                this.updateView();
            }
        });

        this.canvas.addEventListener("wheel", (e) => {
            // Cant scroll page (not rly needed but yk)
            e.preventDefault();

            // Calc cam distance
            this.distance += e.deltaY * 0.01;
            this.distance = Math.max(1, Math.min(50, this.distance));

            // Update view
            this.updateView();
        }, {passive : false});

        // Recalc proj and view matrices with resize
        window.addEventListener("resize", (e) => {
            this.updateProjection();
            this.updateView();
        })
    }

    reset() {
        this.target = [0, 0, 0];
        this.eye = [0, 0, 5];
        this.up = [0, 1, 0];

        this.pitch = 0.3;
        this.yaw = -0.35;
        this.distance = 6;

        this.updateView();
    }

    updateProjection() {
        // Device pixel ratio
        const dpr = window.devicePixelRatio || 1;

        // Calc canvas size
        const width = this.canvas.clientWidth * dpr;
        const height = this.canvas.clientHeight * dpr;

        // Set canvas size
        this.canvas.width = width;
        this.canvas.height = height;

        // Set viewport to window size
        this.gl.viewport(0, 0, width, height);

        // Set and pass proj matrix
        this.proj.setPerspective(45, width / height, 0.1, 100);
        this.gl.uniformMatrix4fv(this.u_ProjectionMatrix, false, this.proj.elements);
    }

    updateView() {
        // Calc sin/cos of pitch/yaw
        const cy = Math.cos(this.yaw);
        const sy = Math.sin(this.yaw);
        const cp = Math.cos(this.pitch);
        const sp = Math.sin(this.pitch);

        // Calc cam pos with target and distance
        this.eye[0] = this.target[0] + this.distance * cp * sy;
        this.eye[1] = this.target[1] + this.distance * sp;
        this.eye[2] = this.target[2] + this.distance * cp * cy;

        // Set view matrix
        this.view.setLookAt(
            this.eye[0], this.eye[1], this.eye[2],
            this.target[0], this.target[1], this.target[2],
            this.up[0], this.up[1], this.up[2]
        );

        // Pass view matrix
        this.gl.uniformMatrix4fv(this.u_ViewMatrix, false, this.view.elements);
    }
}