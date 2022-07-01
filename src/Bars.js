import { Buffer, Geometry, Program, Texture } from '@pixi/core';
import { Mesh, MeshMaterial } from '@pixi/mesh';
import { createIndicesForQuads, hex2string } from '@pixi/utils';
import { TYPES } from '@pixi/constants';
const barVert = `
attribute vec4 aRect;
attribute vec2 aQuad;
attribute vec4 aColor;
uniform mat3 projectionMatrix;
uniform mat3 translationMatrix;
uniform float resolution;
uniform vec4 uColor;
uniform float threshold;

varying vec2 vPos;
varying vec4 vDistance;
varying vec4 vColor;

void main(void){
vec2 p1 = (translationMatrix * vec3(aRect.xy, 1.0)).xy;
vec2 p2 = (translationMatrix * vec3(aRect.xy + aRect.zw, 1.0)).xy;
vec2 size = p2 - p1;

vec2 tQuad = (aQuad * 2.0 - 1.0) * threshold;
vec2 tWorld = tQuad;
if (size.x < 0.0) {
    tWorld.x = -tWorld.x;
}
if (size.y < 0.0) {
    tWorld.y = -tWorld.y;
}

vec2 localPos = (translationMatrix * vec3(aRect.zw * aQuad, 0.0)).xy;
vec2 cssPos = (p1 + localPos) + tWorld / resolution;
vDistance.xy = abs(localPos) * resolution + tQuad;
vDistance.zw = aRect.zw * resolution;
gl_Position = vec4((projectionMatrix * vec3(cssPos, 1.0)).xy, 0.0, 1.0);
vColor = aColor * uColor;
}`;
const barFrag = `
varying vec2 vPos;
varying vec4 vDistance;
varying vec4 vColor;

void main(void) {
vec2 leftTop = max(vDistance.xy - 0.5, 0.0);
vec2 rightBottom = min(vDistance.xy + 0.5, vDistance.zw);
vec2 area = max(rightBottom - leftTop, 0.0);
float clip = area.x * area.y;

gl_FragColor = vColor * clip;
}`;
export class BarsShader extends MeshMaterial {
    constructor() {
        super(Texture.WHITE, {
            uniforms: {
                resolution: 1,
                threshold: 1,
            },
            program: BarsShader.getProgram()
        });
    }
    static getProgram() {
        if (!BarsShader._prog) {
            BarsShader._prog = new Program(barVert, barFrag);
        }
        return BarsShader._prog;
    }
}
BarsShader._prog = null;
export class BarsGeometry extends Geometry {
    constructor(_static = false) {
        super();
        this.lastLen = 0;
        this.lastPointNum = 0;
        this.lastPointData = 0;
        this.points = [];
        this._floatView = null;
        this._u32View = null;
        this._buffer = null;
        this._quad = null;
        this._indexBuffer = null;
        this.stridePoints = 5;
        this.strideFloats = 5;
        this.strideBytes = 20;
        this.legacyGeom = null;
        this.legacyBuffer = null;
        this.initGeom(_static);
        this.reset();
    }
    initGeom(_static) {
        this._buffer = new Buffer(new Float32Array(0), _static, false);
        this._quad = new Buffer(new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), true, false);
        this._indexBuffer = new Buffer(new Uint16Array([0, 1, 2, 0, 2, 3]), true, true);
        this.addAttribute('aRect', this._buffer, 4, false, TYPES.FLOAT, undefined, undefined, true)
            .addAttribute('aColor', this._buffer, 4, true, TYPES.UNSIGNED_BYTE, undefined, undefined, true)
            .addAttribute('aQuad', this._quad, 2, false, TYPES.FLOAT)
            .addIndex(this._indexBuffer);
    }
    addRect(x, y, w, h, color) {
        const { points } = this;
        points.push(x);
        points.push(y);
        points.push(w);
        points.push(h);
        points.push(color);
    }
    invalidate(pointNum = 0) {
        this.lastPointNum = Math.min(pointNum, this.lastPointNum);
    }
    reset() {
        if (this.lastLen > 0) {
            this.clearBufferData();
        }
        this.lastLen = 0;
        this.lastPointData = 0;
        this.points.length = 0;
        this.instanceCount = 0;
    }
    clearBufferData() {
        const { points, strideBytes, stridePoints } = this;
        this.lastPointNum = 0;
        this.lastPointData = 0;
        const arrBuf = new ArrayBuffer(strideBytes * points.length / stridePoints);
        this.lastLen = points.length;
        this._floatView = new Float32Array(arrBuf);
        this._u32View = new Uint32Array(arrBuf);
        this._buffer.update(arrBuf);
    }
    updateBuffer() {
        const { points, stridePoints, strideFloats } = this;
        if (this.lastLen > points.length) {
            this.lastLen = -1;
        }
        if (this.lastLen < points.length
            || this.lastPointNum < this.lastLen) {
            this.clearBufferData();
        }
        if (this.lastPointNum == this.lastLen) {
            return;
        }
        const { _floatView, _u32View } = this;
        this.lastPointData = Math.min(this.lastPointData, this.lastPointNum);
        let j = Math.round(this.lastPointNum * strideFloats / stridePoints);
        for (let i = this.lastPointNum; i < points.length; i += stridePoints) {
            _floatView[j++] = points[i];
            _floatView[j++] = points[i + 1];
            _floatView[j++] = points[i + 2];
            _floatView[j++] = points[i + 3];
            const rgb = points[i + 4];
            const bgra = ((rgb >> 16) & 0xff) | (rgb & 0xff00) | ((rgb & 0xff) << 16) | (255 << 24);
            _u32View[j++] = bgra;
        }
        this._buffer.update();
        this.instanceCount = Math.round(points.length / stridePoints);
        this.lastPointNum = this.lastLen;
        this.lastPointData = this.lastLen;
        if (this.legacyGeom) {
            this.updateLegacy();
        }
    }
    initLegacy() {
        if (this.legacyGeom) {
            return;
        }
        this.legacyGeom = new Geometry();
        this.legacyBuffer = new Buffer(new Float32Array(0), false, false);
        this.legacyGeom.addAttribute('aRect', this.legacyBuffer, 4, false, TYPES.FLOAT)
            .addAttribute('aColor', this.legacyBuffer, 4, true, TYPES.UNSIGNED_BYTE)
            .addAttribute('aQuad', this.legacyBuffer, 2, false, TYPES.FLOAT)
            .addIndex(new Buffer(new Uint16Array([0, 1, 2, 0, 2, 3]), false, true));
    }
    updateLegacy() {
        const { legacyBuffer, _floatView, _u32View, strideFloats } = this;
        const strideLegacy = 7;
        const quadsCount = this._floatView.length / strideFloats;
        const legacyLen = quadsCount * strideLegacy * 4;
        if (legacyBuffer.data.length !== legacyLen) {
            legacyBuffer.data = new Float32Array(legacyLen);
            this.legacyGeom.getIndex().update(createIndicesForQuads(quadsCount));
        }
        const floats = legacyBuffer.data;
        const quad = this._quad.data;
        for (let i = 0, j = 0; i < this._floatView.length;) {
            for (let k = 0; k < 4; k++) {
                floats[j++] = _floatView[i];
                floats[j++] = _floatView[i + 1];
                floats[j++] = _floatView[i + 2];
                floats[j++] = _floatView[i + 3];
                floats[j++] = _floatView[i + 4];
                floats[j++] = quad[k * 2];
                floats[j++] = quad[k * 2 + 1];
            }
            i += strideFloats;
        }
        legacyBuffer.update();
    }
}
export class Bars extends Mesh {
    constructor() {
        super(new BarsGeometry(), new BarsShader());
    }
    addRect(x, y, w, h, color) {
        const geometry = this.geometry;
        geometry.addRect(x, y, w, h, color);
    }
    clear() {
        this.geometry.reset();
    }
    _renderDefault(renderer) {
        const geometry = this.geometry;
        const useLegacy = !renderer.geometry.hasInstance;
        if (useLegacy) {
            geometry.initLegacy();
        }
        geometry.updateBuffer();
        if (geometry.instanceCount === 0) {
            return;
        }
        const rt = renderer.renderTexture.current;
        this.shader.uniforms.resolution = rt ? rt.baseTexture.resolution : renderer.resolution;
        const multisample = rt ? rt.framebuffer.multisample > 1 : renderer.options.antialias;
        this.shader.uniforms.threshold = multisample ? 2 : 1;
        if (useLegacy) {
            this.geometry = geometry.legacyGeom;
            super._renderDefault(renderer);
            this.geometry = geometry;
            return;
        }
        super._renderDefault(renderer);
    }
    _renderCanvas(renderer) {
        const { points } = this.geometry;
        const { context } = renderer;
        renderer.setContextTransform(this.transform.worldTransform);
        context.beginPath();
        let clr = -1;
        for (let i = 0; i < points.length; i += 5) {
            if (clr !== points[i + 4]) {
                clr = points[i + 4];
                let fill = hex2string(clr);
                context.fillStyle = fill;
            }
            context.beginPath();
            context.rect(points[i], points[i + 1], points[i + 2], points[i + 3]);
            context.fill();
        }
        context.beginPath();
    }
}
//# sourceMappingURL=Bars.js.map