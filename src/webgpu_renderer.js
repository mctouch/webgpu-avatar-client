// WebGPU Avatar Renderer
// GPU-accelerated blendshape deformation via WGSL compute shaders

class WebGPUAvatarRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.device = null;
        this.context = null;
        this.format = null;
        this.primitives = [];
        this.morphWeights = new Float32Array(52);
        this.time = 0;
        this.camera = {
            eye: [0, 24.0, 10],
            center: [0, 24.0, 0],
            up: [0, 1, 0]
        };
        this.modelBounds = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
        this.lightDir = [0.5, 1.0, 0.5];
    }

    async init() {
        if (!navigator.gpu) throw new Error('WebGPU not supported');

        const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
        if (!adapter) throw new Error('No WebGPU adapter found');

        this.device = await adapter.requestDevice({
            requiredLimits: {
                maxStorageBufferBindingSize: 268435456,
                maxBufferSize: 268435456
            }
        });

        this.format = navigator.gpu.getPreferredCanvasFormat();
        this.context = this.canvas.getContext('webgpu');
        this.context.configure({
            device: this.device,
            format: this.format,
            alphaMode: 'opaque'
        });

        await this.createPipelines();
        this.resize(this.canvas.clientWidth, this.canvas.clientHeight);
        return true;
    }

    resize(width, height) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = Math.max(1, Math.floor(width * dpr));
        const h = Math.max(1, Math.floor(height * dpr));
        if (this.canvas.width !== w || this.canvas.height !== h) {
            this.canvas.width = w;
            this.canvas.height = h;
        }
        if (this.depthTexture) this.depthTexture.destroy();
        this.depthTexture = this.device.createTexture({
            size: [w, h], format: 'depth24plus',
            usage: GPUTextureUsage.RENDER_ATTACHMENT
        });
    }

    async createPipelines() {
        const device = this.device;

        // ============================================================
        // COMPUTE: Blendshape deformation
        // ============================================================
        const computeCode = `
            struct Uniforms {
                weights: array<f32, 52>,
                numVertices: u32,
                _pad: array<f32, 11>,
            }

            @group(0) @binding(0) var<storage, read> basePositions: array<f32>;
            @group(0) @binding(1) var<storage, read> blendshapeOffsets: array<f32>;
            @group(0) @binding(2) var<storage, read_write> outputPositions: array<f32>;
            @group(0) @binding(3) var<uniform> u: Uniforms;

            @compute @workgroup_size(256)
            fn main(@builtin(global_invocation_id) gid: vec3u) {
                let idx = gid.x;
                if (idx >= u.numVertices) { return; }
                var pos = vec3f(basePositions[idx*3], basePositions[idx*3+1], basePositions[idx*3+2]);
                let n = u.numVertices;
                for (var b = 0u; b < 52u; b++) {
                    let w = u.weights[b];
                    if (w > 0.001) {
                        let base = (b * n + idx) * 3;
                        pos += vec3f(blendshapeOffsets[base], blendshapeOffsets[base+1], blendshapeOffsets[base+2]) * w;
                    }
                }
                outputPositions[idx*3] = pos.x;
                outputPositions[idx*3+1] = pos.y;
                outputPositions[idx*3+2] = pos.z;
            }
        `;

        this.computePipeline = device.createComputePipeline({
            layout: 'auto',
            compute: {
                module: device.createShaderModule({ code: computeCode }),
                entryPoint: 'main'
            }
        });

        // ============================================================
        // RENDER: Position + Normal/UV from separate buffers
        // ============================================================
        const vertexCode = `
            struct Matrices {
                mvp: mat4x4f,
                model: mat4x4f,
                normalMatrix: mat4x4f,
                eyePos: vec4f,
                lightDir: vec4f,
            }
            @group(0) @binding(0) var<uniform> mats: Matrices;

            struct VertexIn {
                @location(0) position: vec3f,
                @location(1) normal: vec3f,
                @location(2) uv: vec2f,
            }
            struct VertexOut {
                @builtin(position) clip: vec4f,
                @location(0) world: vec3f,
                @location(1) normal: vec3f,
                @location(2) uv: vec2f,
                @location(3) view: vec3f,
            }

            @vertex
            fn vs(in: VertexIn) -> VertexOut {
                var out: VertexOut;
                let wp = (mats.model * vec4f(in.position, 1.0)).xyz;
                out.clip = mats.mvp * vec4f(in.position, 1.0);
                out.world = wp;
                out.normal = (mats.normalMatrix * vec4f(in.normal, 0.0)).xyz;
                out.uv = in.uv;
                out.view = mats.eyePos.xyz - wp;
                return out;
            }
        `;

        const fragmentCode = `
            struct Matrices {
                mvp: mat4x4f,
                model: mat4x4f,
                normalMatrix: mat4x4f,
                eyePos: vec4f,
                lightDir: vec4f,
            }
            @group(0) @binding(0) var<uniform> mats: Matrices;
            struct VertexOut {
                @builtin(position) clip: vec4f,
                @location(0) world: vec3f,
                @location(1) normal: vec3f,
                @location(2) uv: vec2f,
                @location(3) view: vec3f,
            }
            @group(0) @binding(1) var tex: texture_2d<f32>;
            @group(0) @binding(2) var samp: sampler;

            @fragment
            fn fs(in: VertexOut) -> @location(0) vec4f {
                let texColor = textureSample(tex, samp, in.uv);
                if (texColor.a < 0.05) { discard; }
                let N = normalize(in.normal);
                let L = normalize(mats.lightDir.xyz);
                let V = normalize(in.view);
                let H = normalize(L + V);

                let albedo = texColor.rgb;
                let diff = max(dot(N, L), 0.0);
                let spec = pow(max(dot(N, H), 0.0), 64.0) * 0.3;
                let color = albedo * (0.4 + 0.6 * diff) + vec3f(spec);
                return vec4f(color, texColor.a);
            }
        `;

        this.renderPipelineOpaque = device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: device.createShaderModule({ code: vertexCode }),
                entryPoint: 'vs',
                buffers: [
                    { // Position buffer (from compute output)
                        arrayStride: 12,
                        attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }]
                    },
                    { // Normal + UV static buffer
                        arrayStride: 20,
                        attributes: [
                            { shaderLocation: 1, offset: 0, format: 'float32x3' },
                            { shaderLocation: 2, offset: 12, format: 'float32x2' }
                        ]
                    }
                ]
            },
            fragment: {
                module: device.createShaderModule({ code: fragmentCode }),
                entryPoint: 'fs',
                targets: [{ format: this.format }]
            },
            primitive: { topology: 'triangle-list', cullMode: 'none' },
            depthStencil: {
                format: 'depth24plus',
                depthWriteEnabled: true,
                depthCompare: 'less'
            }
        });

        this.renderPipelineBlend = device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: device.createShaderModule({ code: vertexCode }),
                entryPoint: 'vs',
                buffers: [
                    { // Position buffer (from compute output)
                        arrayStride: 12,
                        attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }]
                    },
                    { // Normal + UV static buffer
                        arrayStride: 20,
                        attributes: [
                            { shaderLocation: 1, offset: 0, format: 'float32x3' },
                            { shaderLocation: 2, offset: 12, format: 'float32x2' }
                        ]
                    }
                ]
            },
            fragment: {
                module: device.createShaderModule({ code: fragmentCode }),
                entryPoint: 'fs',
                targets: [{
                    format: this.format,
                    blend: {
                        color: { operation: 'add', srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha' },
                        alpha: { operation: 'add', srcFactor: 'one', dstFactor: 'one-minus-src-alpha' }
                    }
                }]
            },
            primitive: { topology: 'triangle-list', cullMode: 'none' },
            depthStencil: {
                format: 'depth24plus',
                depthWriteEnabled: false,
                depthCompare: 'less'
            }
        });

        // Uniform buffers
        this.matrixBuffer = device.createBuffer({
            size: 288, // mat4x4(64)*3 + vec4(16)*2 = 224, pad to 256... let's use 288
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.blendshapeUniformBuffer = device.createBuffer({
            size: 256,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        // Default white texture
        this.defaultTexture = device.createTexture({
            size: [1, 1], format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
        });
        device.queue.writeTexture(
            { texture: this.defaultTexture },
            new Uint8Array([255, 240, 230, 255]),
            { bytesPerRow: 4 }, [1, 1]
        );

        this.defaultSampler = device.createSampler({
            minFilter: 'linear', magFilter: 'linear'
        });
    }

    // ============================================================
    // GLB Loading
    // ============================================================
    async loadModel(url) {
        const resp = await fetch(url);
        if (!resp.ok) throw new Error('Failed to load ' + url);
        await this.parseGLB(await resp.arrayBuffer());
    }

    async parseGLB(arrayBuffer) {
        const dv = new DataView(arrayBuffer);
        if (dv.getUint32(0, true) !== 0x46546C67) throw new Error('Invalid glB');

        let jsonChunk, binChunk;
        let off = 12;
        while (off < dv.byteLength) {
            const len = dv.getUint32(off, true);
            const type = dv.getUint32(off + 4, true);
            const data = new Uint8Array(arrayBuffer, off + 8, len);
            if (type === 0x4E4F534A) jsonChunk = JSON.parse(new TextDecoder().decode(data));
            else if (type === 0x004E4942) binChunk = data;
            off += 8 + len;
        }
        if (!jsonChunk || !binChunk) throw new Error('Missing chunks');
        await this.buildMesh(jsonChunk, binChunk.buffer.slice(binChunk.byteOffset, binChunk.byteOffset + binChunk.byteLength));
        this.centerCamera();
    }

    async buildMesh(gltf, binBuffer) {
        const accessors = gltf.accessors || [];
        const bufferViews = gltf.bufferViews || [];
        const meshes = gltf.meshes || [];
        const nodes = gltf.nodes || [];

        const meshNodes = nodes.filter(n => n.mesh !== undefined);
        if (meshNodes.length === 0) throw new Error('No mesh nodes');
        
        // Phase 1: collect all primitive data and compute bounds (no GPU buffers yet)
        const primDataList = [];

        const readAccessor = (idx) => {
            const acc = accessors[idx];
            const bv = bufferViews[acc.bufferView];
            const off = (acc.byteOffset || 0) + (bv.byteOffset || 0);
            const comps = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[acc.type] || 1;
            switch (acc.componentType) {
                case 5126: return { data: new Float32Array(binBuffer, off, acc.count * comps), count: acc.count, type: acc.type };
                case 5123: return { data: new Uint16Array(binBuffer, off, acc.count * comps), count: acc.count, type: acc.type };
                case 5125: return { data: new Uint32Array(binBuffer, off, acc.count * comps), count: acc.count, type: acc.type };
                default: throw new Error('Bad comp type');
            }
        };

        const quatRotate = (q, v) => {
            const [qx, qy, qz, qw] = q;
            const tx = 2*(qy*v[2] - qz*v[1]);
            const ty = 2*(qz*v[0] - qx*v[2]);
            const tz = 2*(qx*v[1] - qy*v[0]);
            return [v[0] + qw*tx + qy*tz - qz*ty, v[1] + qw*ty + qz*tx - qx*tz, v[2] + qw*tz + qx*ty - qy*tx];
        };
        const getNodeTransform = (node) => {
            return { t: node.translation || [0,0,0], r: node.rotation || [0,0,0,1], s: node.scale || [1,1,1] };
        };

        const arkitNames = ['eyeLookUpLeft','eyeLookUpRight','eyeLookDownLeft','eyeLookDownRight','eyeLookInLeft','eyeLookInRight','eyeLookOutLeft','eyeLookOutRight','eyeBlinkLeft','eyeBlinkRight','eyeSquintLeft','eyeSquintRight','eyeWideLeft','eyeWideRight','browDownLeft','browDownRight','browInnerUp','browOuterUpLeft','browOuterUpRight','noseSneerLeft','noseSneerRight','cheekPuff','cheekSquintLeft','cheekSquintRight','jawOpen','jawForward','jawLeft','jawRight','mouthFunnel','mouthPucker','mouthLeft','mouthRight','mouthSmileLeft','mouthSmileRight','mouthFrownLeft','mouthFrownRight','mouthDimpleLeft','mouthDimpleRight','mouthStretchLeft','mouthStretchRight','mouthRollLower','mouthRollUpper','mouthShrugLower','mouthShrugUpper','mouthPressLeft','mouthPressRight','mouthLowerDownLeft','mouthLowerDownRight','mouthUpperUpLeft','mouthUpperUpRight','tongueOut'];

        // Load textures from GLB images
        const textures = [];
        if (gltf.images) {
            for (let ii = 0; ii < gltf.images.length; ii++) {
                const img = gltf.images[ii];
                if (img.bufferView !== undefined) {
                    const bv = bufferViews[img.bufferView];
                    const off = bv.byteOffset || 0;
                    const len = bv.byteLength;
                    const blob = new Blob([new Uint8Array(binBuffer, off, len)], { type: img.mimeType || 'image/png' });
                    try {
                        const bitmap = await createImageBitmap(blob);
                        textures.push(bitmap);
                        console.log(`[WebGPU] Loaded image ${ii}: ${bitmap.width}x${bitmap.height}`);
                    } catch (e) {
                        console.warn(`[WebGPU] Failed to load image ${ii}:`, e);
                        textures.push(null);
                    }
                } else {
                    textures.push(null);
                }
            }
        }
        // Create WebGPU textures from bitmaps
        const gpuTextures = textures.map(bitmap => {
            if (!bitmap) return this.defaultTexture;
            const tex = this.device.createTexture({
                size: [bitmap.width, bitmap.height],
                format: 'rgba8unorm',
                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
            });
            this.device.queue.copyExternalImageToTexture(
                { source: bitmap },
                { texture: tex },
                [bitmap.width, bitmap.height]
            );
            return tex;
        });
        // Map material index -> base color texture + alphaMode (via gltf.textures[].source)
        const materialTextures = [];
        const materialAlphaModes = []; // 'OPAQUE' | 'BLEND' | 'MASK'
        if (gltf.materials) {
            for (let mi = 0; mi < gltf.materials.length; mi++) {
                const mat = gltf.materials[mi];
                let tex = this.defaultTexture;
                let alphaMode = 'OPAQUE';
                if (mat) {
                    if (mat.alphaMode) alphaMode = mat.alphaMode;
                    if (mat.pbrMetallicRoughness && mat.pbrMetallicRoughness.baseColorTexture) {
                        const texIdx = mat.pbrMetallicRoughness.baseColorTexture.index;
                        if (texIdx !== undefined && gltf.textures && gltf.textures[texIdx]) {
                            const imgIdx = gltf.textures[texIdx].source;
                            if (imgIdx !== undefined && gpuTextures[imgIdx]) tex = gpuTextures[imgIdx];
                        }
                    }
                }
                materialTextures.push(tex);
                materialAlphaModes.push(alphaMode);
            }
        }

        for (const node of meshNodes) {
            const mesh = meshes[node.mesh];
            if (!mesh) continue;
            const xform = getNodeTransform(node);

            let targetNames = [];
            if (mesh.extras && mesh.extras.targetNames) targetNames = mesh.extras.targetNames;
            else if (mesh.primitives[0] && mesh.primitives[0].extras && mesh.primitives[0].extras.targetNames) {
                targetNames = mesh.primitives[0].extras.targetNames;
            }

            for (let pi = 0; pi < mesh.primitives.length; pi++) {
                const prim = mesh.primitives[pi];
                const attrs = prim.attributes;
                const pos = readAccessor(attrs.POSITION);
                const norm = attrs.NORMAL !== undefined ? readAccessor(attrs.NORMAL) : null;
                const uv = attrs.TEXCOORD_0 !== undefined ? readAccessor(attrs.TEXCOORD_0) : null;
                const idx = prim.indices !== undefined ? readAccessor(prim.indices) : null;
                const vc = pos.count;

                // Apply node transform to positions
                const basePositions = new Float32Array(vc * 3);
                for (let i = 0; i < vc; i++) {
                    let v = [pos.data[i*3], pos.data[i*3+1], pos.data[i*3+2]];
                    v[0] *= xform.s[0]; v[1] *= xform.s[1]; v[2] *= xform.s[2];
                    v = quatRotate(xform.r, v);
                    v[0] += xform.t[0]; v[1] += xform.t[1]; v[2] += xform.t[2];
                    basePositions[i*3] = v[0];
                    basePositions[i*3+1] = v[1];
                    basePositions[i*3+2] = v[2];
                    // Track model bounds
                    if (v[0] < this.modelBounds.min[0]) this.modelBounds.min[0] = v[0];
                    if (v[1] < this.modelBounds.min[1]) this.modelBounds.min[1] = v[1];
                    if (v[2] < this.modelBounds.min[2]) this.modelBounds.min[2] = v[2];
                    if (v[0] > this.modelBounds.max[0]) this.modelBounds.max[0] = v[0];
                    if (v[1] > this.modelBounds.max[1]) this.modelBounds.max[1] = v[1];
                    if (v[2] > this.modelBounds.max[2]) this.modelBounds.max[2] = v[2];
                }

                // Compute per-primitive bounds for head-only filtering
                let primMinY = Infinity, primMaxY = -Infinity;
                if (idx && idx.data) {
                    for (let i = 0; i < idx.count; i++) {
                        const vi = idx.data[i];
                        const y = basePositions[vi*3+1];
                        if (y < primMinY) primMinY = y;
                        if (y > primMaxY) primMaxY = y;
                    }
                } else {
                    for (let i = 0; i < vc; i++) {
                        const y = basePositions[i*3+1];
                        if (y < primMinY) primMinY = y;
                        if (y > primMaxY) primMaxY = y;
                    }
                }
                const staticData = new Float32Array(vc * 5);
                for (let i = 0; i < vc; i++) {
                    let n = norm ? [norm.data[i*3], norm.data[i*3+1], norm.data[i*3+2]] : [0,1,0];
                    n[0] *= xform.s[0]; n[1] *= xform.s[1]; n[2] *= xform.s[2];
                    n = quatRotate(xform.r, n);
                    const len = Math.sqrt(n[0]*n[0] + n[1]*n[1] + n[2]*n[2]) || 1;
                    staticData[i*5] = n[0]/len;
                    staticData[i*5+1] = n[1]/len;
                    staticData[i*5+2] = n[2]/len;
                    if (uv) {
                        staticData[i*5+3] = uv.data[i*2];
                        staticData[i*5+4] = uv.data[i*2+1];
                    } else {
                        staticData[i*5+3] = 0; staticData[i*5+4] = 0;
                    }
                }

                // Blendshape offsets [52][vc][3]
                const targets = prim.targets || [];
                let blendshapeOffsets = new Float32Array(52 * vc * 3);
                let hasBlendshapes = false;

                if (targets.length > 0 && targetNames.length > 0) {
                    hasBlendshapes = true;
                    for (let t = 0; t < targets.length && t < targetNames.length; t++) {
                        const name = targetNames[t].toLowerCase().replace(/\s+/g, '');
                        const bidx = arkitNames.findIndex(n => n.toLowerCase() === name);
                        if (bidx < 0) continue;
                        const ta = targets[t];
                        if (ta.POSITION === undefined) continue;
                        const tpos = readAccessor(ta.POSITION);
                        const base = bidx * vc * 3;
                        for (let v = 0; v < vc; v++) {
                            let dv = [tpos.data[v*3], tpos.data[v*3+1], tpos.data[v*3+2]];
                            dv[0] *= xform.s[0]; dv[1] *= xform.s[1]; dv[2] *= xform.s[2];
                            dv = quatRotate(xform.r, dv);
                            blendshapeOffsets[base + v*3] = dv[0];
                            blendshapeOffsets[base + v*3+1] = dv[1];
                            blendshapeOffsets[base + v*3+2] = dv[2];
                        }
                    }
                }

                const primTexture = (prim.material !== undefined && materialTextures[prim.material]) 
                    ? materialTextures[prim.material] : this.defaultTexture;
                const primAlphaMode = (prim.material !== undefined && materialAlphaModes[prim.material]) 
                    ? materialAlphaModes[prim.material] : 'OPAQUE';

                let indexCount = 0;
                let indexFormat = 'uint16';
                if (idx) {
                    indexCount = idx.count;
                    if (idx.data instanceof Uint16Array) {
                        indexFormat = 'uint16';
                    } else {
                        indexFormat = 'uint32';
                    }
                }

                primDataList.push({
                    vc,
                    indexCount,
                    indexFormat,
                    hasBlendshapes,
                    primAlphaMode,
                    primMaxY,
                    basePositions,
                    staticData,
                    blendshapeOffsets,
                    idx,
                    primTexture,
                    primBlendUniformBuffer: null,
                    computeBG: null,
                    renderBG: null
                });
            }
        }

        // Single threshold head filter: keep primitives above 50% of body height
        // This catches tongue, teeth, eyes while filtering out most neck/body
        const totalHeight = this.modelBounds.max[1] - this.modelBounds.min[1];
        const neckThreshold = this.modelBounds.min[1] + totalHeight * 0.50;
        const beforeCount = primDataList.length;
        const filteredData = primDataList.filter(p => p.primMaxY > neckThreshold);
        console.log(`[WebGPU] Filtered to head-only: ${filteredData.length}/${beforeCount} primitives above Y=${neckThreshold.toFixed(3)}`);

        // Phase 2: create GPU buffers only for filtered primitives
        const createBuf = (data, usage) => {
            const buf = this.device.createBuffer({ size: data.byteLength, usage, mappedAtCreation: true });
            const mapped = buf.getMappedRange();
            if (data.buffer && data.byteOffset !== undefined) {
                const src = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
                new Uint8Array(mapped).set(src);
            } else if (Array.isArray(data)) {
                if (usage & GPUBufferUsage.INDEX) {
                    new Uint32Array(mapped).set(data);
                } else {
                    new Float32Array(mapped).set(data);
                }
            }
            buf.unmap();
            return buf;
        };

        for (const pd of filteredData) {
            const basePosBuf = createBuf(pd.basePositions, GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC);
            const staticBuf = createBuf(pd.staticData, GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST);
            const blendBuf = createBuf(pd.blendshapeOffsets, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC);
            const outPosBuf = this.device.createBuffer({
                size: pd.basePositions.byteLength,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
            });

            let indexBuf = null, indexCount = pd.indexCount, indexFormat = pd.indexFormat;
            if (pd.idx) {
                if (pd.idx.data instanceof Uint16Array) {
                    indexBuf = createBuf(pd.idx.data, GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC);
                    indexFormat = 'uint16';
                } else {
                    indexBuf = createBuf(pd.idx.data, GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC);
                    indexFormat = 'uint32';
                }
            }

            const primBlendUniformBuffer = this.device.createBuffer({
                size: 256,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
            });

            const computeBG = this.device.createBindGroup({
                layout: this.computePipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: { buffer: basePosBuf } },
                    { binding: 1, resource: { buffer: blendBuf } },
                    { binding: 2, resource: { buffer: outPosBuf } },
                    { binding: 3, resource: { buffer: primBlendUniformBuffer } }
                ]
            });

            const renderPipeline = (pd.primAlphaMode === 'BLEND') ? this.renderPipelineBlend : this.renderPipelineOpaque;
            const renderBG = this.device.createBindGroup({
                layout: renderPipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: { buffer: this.matrixBuffer } },
                    { binding: 1, resource: pd.primTexture.createView() },
                    { binding: 2, resource: this.defaultSampler }
                ]
            });

            if (!pd.hasBlendshapes && basePosBuf) {
                const tmpCenc = this.device.createCommandEncoder();
                tmpCenc.copyBufferToBuffer(basePosBuf, 0, outPosBuf, 0, pd.basePositions.byteLength);
                this.device.queue.submit([tmpCenc.finish()]);
            }

            this.primitives.push({
                vertexCount: pd.vc,
                indexCount,
                indexFormat,
                hasBlendshapes: pd.hasBlendshapes,
                alphaMode: pd.primAlphaMode,
                primMaxY: pd.primMaxY,
                basePosBuf,
                staticBuf,
                outPosBuf,
                blendBuf,
                indexBuf,
                blendUniformBuffer: primBlendUniformBuffer,
                computeBG,
                renderBG
            });
        }

        console.log(`[WebGPU] Loaded ${this.primitives.length} primitives`);
        let opaque = 0, blend = 0;
        for (const p of this.primitives) {
            if (p.alphaMode === 'BLEND') blend++; else opaque++;
        }
        console.log(`[WebGPU] Opaque/MASK: ${opaque}, BLEND: ${blend}`);
    }

    centerCamera() {
        const b = this.modelBounds;
        const height = b.max[1] - b.min[1];
        
        // Scale factor for avatar size
        const sx = 16.0, sy = 16.0, sz = 16.0;
        
        let minY, maxY;
        if (height < 3.0) {
            // Head-only / bust model: use full bounds, don't chop at neck
            minY = b.min[1] * sy;
            maxY = b.max[1] * sy;
        } else {
            // Full-body model: focus on head region (top ~12%)
            const neckThreshold = b.min[1] + height * 0.88;
            minY = Math.max(b.min[1], neckThreshold) * sy;
            maxY = b.max[1] * sy;
        }
        
        const minX = b.min[0] * sx, maxX = b.max[0] * sx;
        const minZ = b.min[2] * sz, maxZ = b.max[2] * sz;
        const cx = (minX + maxX) / 2;
        const cy = minY + (maxY - minY) * 0.45; // look lower on face, show more chin
        const cz = (minZ + maxZ) / 2;
        const width = maxX - minX;
        const height_scaled = maxY - minY;

        // Compute camera distance to fit entire model in view
        const canvas = this.canvas;
        const aspect = canvas.width / canvas.height;
        const vfov = 45 * Math.PI / 180;
        const hfov = 2 * Math.atan(Math.tan(vfov / 2) * aspect);

        // Required distance to fit width and height
        const distW = (width / 2) / Math.tan(hfov / 2) * 0.25;
        const distH = (height_scaled / 2) / Math.tan(vfov / 2) * 0.25;
        const dist = Math.max(distW, distH, 1);

        this.camera.eye = [cx, cy + 0.15, cz + dist];
        this.camera.center = [cx, cy, cz];
        console.log('[WebGPU] Auto-centered camera. Center:', this.camera.center, 'Eye:', this.camera.eye, 'Dist:', dist.toFixed(2));
    }

    setBlendshapesArray(arr) {
        const len = Math.min(arr.length, 52);
        this.morphWeights.set(arr.slice(0, len));
    }

    setBlendshapes(obj) {
        const names = ['eyeLookUpLeft','eyeLookUpRight','eyeLookDownLeft','eyeLookDownRight','eyeLookInLeft','eyeLookInRight','eyeLookOutLeft','eyeLookOutRight','eyeBlinkLeft','eyeBlinkRight','eyeSquintLeft','eyeSquintRight','eyeWideLeft','eyeWideRight','browDownLeft','browDownRight','browInnerUp','browOuterUpLeft','browOuterUpRight','noseSneerLeft','noseSneerRight','cheekPuff','cheekSquintLeft','cheekSquintRight','jawOpen','jawForward','jawLeft','jawRight','mouthFunnel','mouthPucker','mouthLeft','mouthRight','mouthSmileLeft','mouthSmileRight','mouthFrownLeft','mouthFrownRight','mouthDimpleLeft','mouthDimpleRight','mouthStretchLeft','mouthStretchRight','mouthRollLower','mouthRollUpper','mouthShrugLower','mouthShrugUpper','mouthPressLeft','mouthPressRight','mouthLowerDownLeft','mouthLowerDownRight','mouthUpperUpLeft','mouthUpperUpRight','tongueOut'];
        for (let i = 0; i < 52; i++) this.morphWeights[i] = obj[names[i]] || 0;
    }

    render(dt) {
        this.time += dt;
        const device = this.device;
        const canvas = this.canvas;
        if (!canvas.width || !canvas.height) return;

        // Compute pass
        const cenc = device.createCommandEncoder();
        for (const prim of this.primitives) {
            if (!prim.hasBlendshapes) continue;
            // Write weights + numVertices into the per-primitive uniform buffer
            const udata = new Float32Array(64);
            udata.set(this.morphWeights, 0);
            device.queue.writeBuffer(prim.blendUniformBuffer, 0, udata.buffer, 0, 256);
            const nverts = new Uint32Array([prim.vertexCount]);
            device.queue.writeBuffer(prim.blendUniformBuffer, 208, nverts.buffer, 0, 4);
            const pass = cenc.beginComputePass();
            pass.setPipeline(this.computePipeline);
            pass.setBindGroup(0, prim.computeBG);
            pass.dispatchWorkgroups(Math.ceil(prim.vertexCount / 256));
            pass.end();
        }
        device.queue.submit([cenc.finish()]);

        // Update matrices
        const aspect = canvas.width / canvas.height;
        const proj = this.perspective(45 * Math.PI / 180, aspect, 0.1, 100);
        const view = this.lookAt(this.camera.eye, this.camera.center, this.camera.up);

        // Compose matrices.  perspective/lookAt/scaleM/rotateY return column-major
        // flat arrays.  mul4(A,B) on column-major inputs yields column-major of B*A,
        // so we want: model = rotY * scale;  mvp = proj * view * model
        const scale = this.scaleM(16.0, 16.0, 16.0);
        const rotY = this.rotateY(Math.PI);
        const model = this.mul4(rotY, scale);       // column-major of scale * rotY
        const mv = this.mul4(model, view);          // column-major of view * model
        const mvp = this.mul4(mv, proj);            // column-major of proj * view * model

        const mats = new Float32Array(72); // 72*4=288 bytes
        mats.set(mvp, 0);                           // already column-major
        mats.set(model, 16);
        // normalMatrix = inverse transpose of model's upper-left 3x3
        const invModel = this.inverse3(model);
        const normalMat = invModel ? this.transpose(this.transpose3(invModel)) : [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
        mats.set(normalMat, 32);
        mats[48] = this.camera.eye[0]; mats[49] = this.camera.eye[1]; mats[50] = this.camera.eye[2]; mats[51] = 1;
        mats[52] = this.lightDir[0]; mats[53] = this.lightDir[1]; mats[54] = this.lightDir[2]; mats[55] = 1;
        device.queue.writeBuffer(this.matrixBuffer, 0, mats.buffer, 0, 288);

        // Render pass
        const renc = device.createCommandEncoder();
        const pass = renc.beginRenderPass({
            colorAttachments: [{
                view: this.context.getCurrentTexture().createView(),
                clearValue: { r: 0.53, g: 0.81, b: 0.98, a: 1 },
                loadOp: 'clear', storeOp: 'store'
            }],
            depthStencilAttachment: {
                view: this.depthTexture.createView(),
                depthClearValue: 1, depthLoadOp: 'clear', depthStoreOp: 'store'
            }
        });
        pass.setPipeline(this.renderPipelineOpaque);

        for (const prim of this.primitives) {
            if (prim.alphaMode === 'BLEND') continue; // skip transparent in opaque pass
            pass.setBindGroup(0, prim.renderBG);
            pass.setVertexBuffer(0, prim.outPosBuf);
            pass.setVertexBuffer(1, prim.staticBuf);
            if (prim.indexBuf) {
                pass.setIndexBuffer(prim.indexBuf, prim.indexFormat);
                pass.drawIndexed(prim.indexCount);
            } else {
                pass.draw(prim.vertexCount);
            }
        }

        // Transparent pass: depth test but no depth write
        pass.setPipeline(this.renderPipelineBlend);
        for (const prim of this.primitives) {
            if (prim.alphaMode !== 'BLEND') continue; // only transparent
            pass.setBindGroup(0, prim.renderBG);
            pass.setVertexBuffer(0, prim.outPosBuf);
            pass.setVertexBuffer(1, prim.staticBuf);
            if (prim.indexBuf) {
                pass.setIndexBuffer(prim.indexBuf, prim.indexFormat);
                pass.drawIndexed(prim.indexCount);
            } else {
                pass.draw(prim.vertexCount);
            }
        }
        pass.end();
        device.queue.submit([renc.finish()]);
    }

    scaleM(sx, sy, sz) {
        return [sx,0,0,0, 0,sy,0,0, 0,0,sz,0, 0,0,0,1];
    }
    rotateY(angle) {
        const c = Math.cos(angle), s = Math.sin(angle);
        return [c,0,s,0, 0,1,0,0, -s,0,c,0, 0,0,0,1];
    }
    transpose3(m) {
        // transpose upper-left 3x3 into a full 4x4
        return [m[0],m[4],m[8],0, m[1],m[5],m[9],0, m[2],m[6],m[10],0, 0,0,0,1];
    }
    inverse3(m) {
        const a00=m[0],a01=m[1],a02=m[2],a10=m[4],a11=m[5],a12=m[6],a20=m[8],a21=m[9],a22=m[10];
        const b01=a22*a11-a12*a21, b11=-a22*a10+a12*a20, b21=a21*a10-a11*a20;
        let det=a00*b01+a01*b11+a02*b21;
        if(!det) return null;
        det=1.0/det;
        return [b01*det, (-a22*a01+a02*a21)*det, (a12*a01-a02*a11)*det, 0,
                b11*det, (a22*a00-a02*a20)*det, (-a12*a00+a02*a10)*det, 0,
                b21*det, (-a21*a00+a01*a20)*det, (a11*a00-a01*a10)*det, 0,
                0,0,0,1];
    }

    perspective(fov, aspect, near, far) {
        const f = 1.0 / Math.tan(fov / 2);
        const nf = 1 / (near - far);
        return [f/aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far+near)*nf, -1, 0, 0, 2*far*near*nf, 0];
    }
    lookAt(eye, center, up) {
        const z = this.norm([eye[0]-center[0], eye[1]-center[1], eye[2]-center[2]]);
        const x = this.norm(this.cross(up, z));
        const y = this.cross(z, x);
        return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -this.dot(x,eye), -this.dot(y,eye), -this.dot(z,eye), 1];
    }
    transpose(m) {
        // Convert row-major 4x4 to column-major for WGSL
        return [m[0], m[4], m[8], m[12], m[1], m[5], m[9], m[13], m[2], m[6], m[10], m[14], m[3], m[7], m[11], m[15]];
    }
    mul4(a, b) {
        const o = new Array(16);
        for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
            o[i*4+j] = 0;
            for (let k = 0; k < 4; k++) o[i*4+j] += a[i*4+k] * b[k*4+j];
        }
        return o;
    }
    norm(v) { const l = Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2]); return l>0?[v[0]/l,v[1]/l,v[2]/l]:[0,0,0]; }
    cross(a,b) { return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]; }
    dot(a,b) { return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]; }
}

window.WebGPUAvatarRenderer = WebGPUAvatarRenderer;

